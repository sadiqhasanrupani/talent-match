import { NextResponse } from "next/server";
import { getCandidateIndex, getJobIndex } from "@/lib/pinecone";
import { generateAIFeedback, generateInterviewQuestions, AIFeedback, InterviewQuestion } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

// Cache to store previously generated AI feedback and questions
const feedbackCache = new Map<string, { feedback: AIFeedback, questions: InterviewQuestion[], timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
export async function GET(
  request: Request,
  { params }: { params: { jobId: string } },
) {
  try {
    const jobId = params.jobId;

    // Get Pinecone indexes
    const candidateIndex = getCandidateIndex();
    const jobIndex = getJobIndex();

    // Check if the job exists
    const jobQuery = await jobIndex.query({
      id: jobId,
      topK: 1,
      includeMetadata: true,
      includeValues: true,
    });

    // If no matching job found
    if (!jobQuery.matches || jobQuery.matches.length === 0) {
      return NextResponse.json(
        { error: `Job with ID ${jobId} not found` },
        { status: 404 },
      );
    }

    // Get the job details and embedding
    const jobEmbedding = jobQuery.matches[0].values;
    const jobData = jobQuery.matches[0].metadata as any;
    const jobRequirements = jobData?.description || "";
    const jobDetails = {
      job_id: jobId,
      title: jobData?.title || "Job Posting",
      description: jobRequirements,
    };

    // Search for matching candidates
    const candidateMatches = await candidateIndex.query({
      vector: jobEmbedding,
      topK: 10,
      includeMetadata: true,
      includeValues: false,
    });

    // Format the response with AI processing for each candidate
    const matchedCandidatesPromises = candidateMatches.matches?.map(async (match) => {
      const candidateEmail = match.id;
      const candidateSkills = match.metadata?.skill_experience || "";
      const normalizedScore = Math.round(((match.score + 1) / 2) * 100);
      
      // Check if we have cached feedback and questions for this candidate-job pair
      const cacheKey = `${candidateEmail}-${jobId}`;
      const cachedData = feedbackCache.get(cacheKey);
      
      let feedback: AIFeedback;
      let questions: InterviewQuestion[];
      
      // Use cached data if it exists and is not stale
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        feedback = cachedData.feedback;
        questions = cachedData.questions;
      } else {
        // Generate new feedback and questions
        try {
          [feedback, questions] = await Promise.all([
            generateAIFeedback(candidateSkills, jobRequirements, normalizedScore),
            generateInterviewQuestions(candidateSkills, jobRequirements, normalizedScore)
          ]);
          
          // Cache the results
          feedbackCache.set(cacheKey, {
            feedback,
            questions,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("Error generating AI feedback:", error);
          // Fallback if AI generation fails
          feedback = {
            text: `Match score: ${normalizedScore}%`,
            category: normalizedScore >= 90 ? "exceptional" : 
                     normalizedScore >= 70 ? "high" : 
                     normalizedScore >= 40 ? "medium" : "low",
            details: "Unable to generate detailed AI feedback at this time."
          };
          questions = [
            {
              question: "Can you describe your experience with the technologies mentioned in your profile?",
              rationale: "Understanding the candidate's practical experience."
            },
            {
              question: "How do you approach learning new technologies or skills?",
              rationale: "Assessing adaptability and learning capacity."
            },
            {
              question: "What do you consider your strongest technical skill and why?",
              rationale: "Evaluating self-awareness and technical strengths."
            }
          ];
        }
      }

      return {
        name: match.metadata?.name || "",
        email: match.id,
        linkedin_url: match.metadata?.linkedin_url || "",
        skills_experience: candidateSkills,
        score: match.score,
        normalizedScore,
        ai_feedback: feedback,
        interview_questions: questions
      };
    }) || [];

    // Wait for all AI processing to complete
    const matchedCandidates = await Promise.all(matchedCandidatesPromises);

    // Sort by normalized score
    matchedCandidates.sort((a, b) => b.normalizedScore - a.normalizedScore);

    return NextResponse.json({ 
      job: jobDetails,
      matches: matchedCandidates 
    });
  } catch (error) {
    console.error("Error matching candidates for job:", error);
    return NextResponse.json(
      { error: `An error occurred: ${error}` },
      { status: 500 },
    );
  }
}
