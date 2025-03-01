import { NextResponse } from "next/server";
import { getCandidateIndex, getJobIndex } from "@/lib/pinecone";
import { generateAIFeedback, AIFeedback, calculateMatchScore } from "@/lib/gemini";

// Cache to store previously generated AI feedback
const feedbackCache = new Map<string, { feedback: AIFeedback, timestamp: number }>();
// Cache to store AI-calculated match scores
const scoreCache = new Map<string, { score: number, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to normalize score from Pinecone (-1 to 1) to a 0-100 scale
// Only used as fallback if AI scoring fails
function normalizeScore(score: number): number {
  return Math.round(((score + 1) / 2) * 100);
}

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const email = params.email;

    // Extract the URL search parameters to get the jobId
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    // Get Pinecone indexes
    const candidateIndex = getCandidateIndex();
    const jobIndex = getJobIndex();

    // Fetch the candidate data by email
    const candidateQuery = await candidateIndex.query({
      id: email,
      topK: 1,
      includeMetadata: true,
      includeValues: true,
    });

    // If no matching candidate found
    if (!candidateQuery.matches || candidateQuery.matches.length === 0) {
      return NextResponse.json(
        { error: `Candidate with email ${email} not found` },
        { status: 404 }
      );
    }

    // Get the candidate embedding and metadata
    const candidateEmbedding = candidateQuery.matches[0].values;
    const candidateData = candidateQuery.matches[0].metadata as any;
    const candidateSkills = candidateData?.skill_experience || "";
    const candidateName = candidateData?.name || "";
    
    // Query for matching jobs using the candidate's embedding
    const jobMatches = await jobIndex.query({
      vector: candidateEmbedding,
      topK: 10,
      includeMetadata: true,
      includeValues: false,
    });

    // Process each job match and add AI feedback
    const matchedJobsPromises = jobMatches.matches?.map(async (match) => {
      const jobId = match.id;
      const jobDescription = match.metadata?.description || "";
      const jobTitle = match.metadata?.title || "";
      
      // We'll use the Gemini AI to calculate the score
      // Check if we have cached score for this candidate-job pair
      const cacheKey = `${email}-${jobId}`;
      const scoreCacheKey = `score-${cacheKey}`;
      const cachedScore = scoreCache.get(scoreCacheKey);
      const cachedData = feedbackCache.get(cacheKey);
      
      // Calculate or get cached AI match score
      let aiScore: number;
      
      // Use cached score if it exists and is not stale
      if (cachedScore && (Date.now() - cachedScore.timestamp) < CACHE_TTL) {
        aiScore = cachedScore.score;
      } else {
        try {
          // Use Gemini AI to calculate the match score
          aiScore = await calculateMatchScore(candidateSkills, jobDescription);
          
          // Cache the score
          scoreCache.set(scoreCacheKey, {
            score: aiScore,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("Error calculating AI match score:", error);
          // Fallback to normalized Pinecone score if AI scoring fails
          aiScore = normalizeScore(match.score);
        }
      }
      
      // Use the AI score for generating feedback
      
      let feedback: AIFeedback;
      
      // Use cached data if it exists and is not stale
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        feedback = cachedData.feedback;
      } else {
        // Generate new feedback
        try {
          feedback = await generateAIFeedback(candidateSkills, jobDescription, aiScore);
          
          // Cache the results
          feedbackCache.set(cacheKey, {
            feedback,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error("Error generating AI feedback:", error);
          // Fallback if AI generation fails
          feedback = {
            text: `Match score: ${aiScore}%`,
            category: aiScore >= 90 ? "exceptional" : 
                    aiScore >= 70 ? "high" : 
                    aiScore >= 40 ? "medium" : "low",
            details: "Unable to generate detailed AI feedback at this time."
          };
        }
      }

      return {
        id: jobId,
        title: jobTitle,
        description: jobDescription,
        company: match.metadata?.company || "",
        location: match.metadata?.location || "",
        posted_date: match.metadata?.posted_date || "",
        salary: match.metadata?.salary || "",
        job_type: match.metadata?.job_type || "",
        score: match.score,
        normalizedScore: aiScore,
        ai_feedback: feedback
      };
    }) || [];

    // Wait for all AI processing to complete
    const matchedJobs = await Promise.all(matchedJobsPromises);

    // Sort by normalized score in descending order
    matchedJobs.sort((a, b) => b.normalizedScore - a.normalizedScore);

    // If jobId is specified, filter results to only that job
    let finalMatches = matchedJobs;
    if (jobId) {
      finalMatches = matchedJobs.filter(job => job.id === jobId);
      
      // If no matching job was found
      if (finalMatches.length === 0) {
        return NextResponse.json(
          { error: `Job with ID ${jobId} not found for candidate ${email}` },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ 
      candidate: {
        email,
        name: candidateName,
        skills_experience: candidateSkills
      },
      matches: finalMatches 
    });
  } catch (error) {
    console.error("Error matching jobs for candidate:", error);
    return NextResponse.json(
      { error: `An error occurred: ${error}` },
      { status: 500 }
    );
  }
}
