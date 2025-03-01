import { NextResponse } from "next/server";
import { getCandidateIndex } from "@/lib/pinecone";
import { getEmbedding } from "@/lib/embedding";
import {
  generateAIFeedback,
  generateInterviewQuestions,
  calculateMatchScore,
  AIFeedback,
} from "@/lib/gemini";

// Cache for AI-generated content to reduce API calls
const feedbackCache = new Map<
  string,
  {
    feedback: AIFeedback;
    questions: string[];
    score: number;
    timestamp: number;
  }
>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Job title and description are required" },
        { status: 400 },
      );
    }

    // Get job embedding for search
    const jobText = `${title} ${description}`;
    const jobEmbedding = await getEmbedding(jobText);

    // Search for matching candidates
    const candidateIndex = getCandidateIndex();
    const candidateMatches = await candidateIndex.query({
      vector: jobEmbedding,
      topK: 10,
      includeMetadata: true,
      includeValues: false,
    });

    // Process each matching candidate with AI scoring and feedback
    const matchedCandidatesPromises =
      candidateMatches.matches?.map(async (match) => {
        const candidateEmail = match.id;
        const candidateSkills = match.metadata?.skill_experience || "";
        const candidateName = match.metadata?.name || "";

        // Create a cache key based on candidate and job
        const cacheKey = `${candidateEmail}-${title}-${description.substring(0, 50)}`;
        const cachedData = feedbackCache.get(cacheKey);

        let feedback: AIFeedback;
        let questions: string[];
        let score: number;

        // Use cached data if available and not stale
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
          feedback = cachedData.feedback;
          questions = cachedData.questions;
          score = cachedData.score;
        } else {
          // Generate new AI feedback, questions, and score
          try {
            // Calculate AI-based match score
            score = await calculateMatchScore(candidateSkills, description);

            // Get AI feedback and questions in parallel
            [feedback, questions] = await Promise.all([
              generateAIFeedback(candidateSkills, description, score),
              generateInterviewQuestions(candidateSkills, description, score),
            ]);

            // Cache the results
            feedbackCache.set(cacheKey, {
              feedback,
              questions,
              score,
              timestamp: Date.now(),
            });
          } catch (error) {
            console.error("Error generating AI content:", error);

            // Fallback if AI generation fails
            score = Math.round(((match.score + 1) / 2) * 100); // Default to vector similarity
            feedback = {
              text: `Match score: ${score}%`,
              category:
                score >= 90
                  ? "exceptional"
                  : score >= 70
                    ? "high"
                    : score >= 40
                      ? "medium"
                      : "low",
              details: "Unable to generate detailed AI feedback at this time.",
            };
            questions = [
              "Can you describe your experience with the technologies mentioned in your profile?",
              "How do you approach learning new technologies or skills?",
              "What do you consider your strongest technical skill and why?",
            ];
          }
        }

        return {
          name: candidateName,
          email: candidateEmail,
          linkedin_url: match.metadata?.linkedin_url || "",
          skills_experience: candidateSkills,
          vector_score: match.score,
          score: score, // AI-calculated score
          ai_feedback: feedback,
          interview_questions: questions,
        };
      }) || [];

    // Wait for all AI processing to complete
    const matchedCandidates = await Promise.all(matchedCandidatesPromises);

    // Sort by AI-generated score
    matchedCandidates.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      job: {
        title,
        description,
      },
      matches: matchedCandidates,
    });
  } catch (error) {
    console.error("Error searching candidates:", error);
    return NextResponse.json(
      { error: `An error occurred: ${error}` },
      { status: 500 },
    );
  }
}
