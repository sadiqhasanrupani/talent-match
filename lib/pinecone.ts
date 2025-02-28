import { Pinecone } from "@pinecone-database/pinecone";
import { generateEmbedding } from "./embeddings";
import { parseResume } from "./pdf-parser";

// Define types for the application
type CandidateMetadata = {
  id: string;
  name: string;
  email: string;
  skills: string;
  resumeText?: string;
  linkedinUrl?: string;
};

type JobMetadata = {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  company?: string;
};

// Initialize Pinecone client
const initPinecone = (): Pinecone => {
  const apiKey = process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY environment variable is not set");
  }

  return new Pinecone({
    apiKey,
  });
};

// Get or create an index
const getOrCreateIndex = async (indexName: string, dimension: number = 768) => {
  const pinecone = initPinecone();

  // List all indexes
  const indexes = await pinecone.listIndexes();
  // Convert indexes to an array if not already one
  const indexesArray = Array.isArray(indexes)
    ? indexes
    : Object.values(indexes);

  // Check if the index already exists
  const indexExists = indexesArray.some((index) => index.name === indexName);

  if (!indexExists) {
    console.log(`Creating new index: ${indexName}`);
    await pinecone.createIndex({
      name: indexName,
      dimension,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
      waitUntilReady: true, // Ensures the index is ready for upsert operations
    });
  }

  return pinecone.index(indexName);
};

// Store candidate embedding in Pinecone
export const storeCandidateEmbedding = async (
  candidateData: CandidateMetadata,
  resumeText?: string,
) => {
  try {
    // Get or create the candidates index
    const index = await getOrCreateIndex("candidates");

    // Use resume text if provided, otherwise use skills
    const textToEmbed =
      resumeText || candidateData.resumeText || candidateData.skills;

    if (!textToEmbed) {
      throw new Error("No text available to generate embedding");
    }

    // Generate embedding for the candidate data
    const embedding = await generateEmbedding(textToEmbed);

    // Upsert the embedding into Pinecone
    await index.upsert([
      {
        id: candidateData.id,
        values: embedding,
        metadata: {
          name: candidateData.name,
          email: candidateData.email,
          skills: candidateData.skills,
          linkedinUrl: candidateData.linkedinUrl || "",
        },
      },
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error storing candidate embedding:", error);
    return { success: false, error };
  }
};

// Store job embedding in Pinecone
export const storeJobEmbedding = async (jobData: JobMetadata) => {
  try {
    // Get or create the jobs index
    const index = await getOrCreateIndex("jobs");

    // Combine job title and description for richer embedding
    const textToEmbed = `${jobData.title}. ${jobData.description}. ${jobData.requirements || ""}`;

    // Generate embedding for the job data
    const embedding = await generateEmbedding(textToEmbed);

    // Upsert the embedding into Pinecone
    await index.upsert([
      {
        id: jobData.id,
        values: embedding,
        metadata: {
          title: jobData.title,
          description: jobData.description,
          requirements: jobData.requirements || "",
          location: jobData.location || "",
          company: jobData.company || "",
        },
      },
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error storing job embedding:", error);
    return { success: false, error };
  }
};

// Search for relevant candidates based on job description
export const findCandidatesForJob = async (
  jobDescription: string,
  limit: number = 10,
) => {
  try {
    // Get the candidates index
    const index = await getOrCreateIndex("candidates");

    // Generate embedding for the job description
    const embedding = await generateEmbedding(jobDescription);

    // Query Pinecone for similar vectors
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
    });

    // Format and return the results
    return {
      success: true,
      candidates: queryResponse.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as CandidateMetadata,
      })),
    };
  } catch (error) {
    console.error("Error finding candidates for job:", error);
    return { success: false, error, candidates: [] };
  }
};

// Process a resume file and store its embedding
export const processResumeAndStoreEmbedding = async (
  candidateId: string,
  candidateData: CandidateMetadata,
  resumeUrl?: string | null,
) => {
  try {
    if (!resumeUrl) {
      // If no resume, just store embedding based on skills
      return await storeCandidateEmbedding(candidateData);
    }

    // Parse the resume to extract resume data (of type ResumeData)
    const resumeData = await parseResume(resumeUrl);

    // Ensure we have a rawText field from the parsed resume data
    if (!resumeData || !resumeData.rawText) {
      console.warn(
        `No text extracted from resume for candidate ${candidateId}`,
      );
      return await storeCandidateEmbedding(candidateData);
    }

    // Store embedding with the extracted resume text (using rawText)
    return await storeCandidateEmbedding(
      { ...candidateData, resumeText: resumeData.rawText },
      resumeData.rawText,
    );
  } catch (error) {
    console.error("Error processing resume and storing embedding:", error);
    return { success: false, error };
  }
};

// Find jobs matching a candidate's profile
export const findJobsForCandidate = async (
  candidateSkills: string,
  limit: number = 10,
) => {
  try {
    // Get the jobs index
    const index = await getOrCreateIndex("jobs");

    // Generate embedding for the candidate skills
    const embedding = await generateEmbedding(candidateSkills);

    // Query Pinecone for similar vectors
    const queryResponse = await index.query({
      vector: embedding,
      topK: limit,
      includeMetadata: true,
    });

    // Format and return the results
    return {
      success: true,
      jobs: queryResponse.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as JobMetadata,
      })),
    };
  } catch (error) {
    console.error("Error finding jobs for candidate:", error);
    return { success: false, error, jobs: [] };
  }
};

// Delete a candidate from the vector database
export const deleteCandidate = async (candidateId: string) => {
  try {
    const index = await getOrCreateIndex("candidates");
    await index.deleteOne(candidateId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return { success: false, error };
  }
};

// Delete a job from the vector database
export const deleteJob = async (jobId: string) => {
  try {
    const index = await getOrCreateIndex("jobs");
    await index.deleteOne(jobId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting job:", error);
    return { success: false, error };
  }
};

// Get all candidates (for listing purposes)
export const getAllCandidates = async () => {
  try {
    // const index = await getOrCreateIndex("candidates");
    // This is a stub - Pinecone doesn't support getting all vectors without a query
    // In a production app, you would typically keep a separate database for listing
    // purposes and use Pinecone solely for vector search
    return { success: true, candidates: [] };
  } catch (error) {
    console.error("Error getting all candidates:", error);
    return { success: false, error, candidates: [] };
  }
};
