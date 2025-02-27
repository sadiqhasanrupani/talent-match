import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

/**
 * Generate embeddings using Google's textembedding-gecko model
 * @param text The text to generate embeddings for
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Access the embedding model
    const model = genAI.getGenerativeModel({ model: "embedding-gecko-001" });

    // Generate embedding
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Generate embeddings for a job description
 * @param jobDescription The job description text
 */
export async function generateJobEmbedding(
  jobDescription: string,
): Promise<number[]> {
  // Preprocess job description text if needed
  const processedText = jobDescription.trim();
  return generateEmbedding(processedText);
}

/**
 * Generate embeddings for a candidate profile
 * @param candidateProfile The candidate profile text (from resume or other sources)
 */
export async function generateCandidateEmbedding(
  candidateProfile: string,
): Promise<number[]> {
  // Preprocess candidate profile text if needed
  const processedText = candidateProfile.trim();
  return generateEmbedding(processedText);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts Array of texts to generate embeddings for
 */
export async function generateBatchEmbeddings(
  texts: string[],
): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      texts.map((text) => generateEmbedding(text)),
    );
    return embeddings;
  } catch (error) {
    console.error("Error generating batch embeddings:", error);
    throw new Error(
      `Failed to generate batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
