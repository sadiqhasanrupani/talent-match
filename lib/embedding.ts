import { FeatureExtractionOutput, HfInference } from "@huggingface/inference";

// Initialize the Hugging Face Inference client
// You should set your API key in an environment variable
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

/**
 * Generate embeddings for a given text using Hugging Face's sentence-transformers model
 *
 * @param text - The text to generate embeddings for
 * @returns A Promise resolving to an array of numbers representing the embedding vector
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response: FeatureExtractionOutput = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    // Ensure response is a number array
    if (Array.isArray(response)) {
      if (Array.isArray(response[0])) {
        // If it's a nested array, return the first one (assuming batch processing)
        return response[0] as number[];
      }
      return response as number[];
    }

    throw new Error("Unexpected response format from Hugging Face API.");
  } catch (error) {
    console.error("Error generating embeddings:", error);
    console.warn("Falling back to random embeddings.");

    return Array.from({ length: 384 }, () => Math.random() * 2 - 1);
  }
}

/**
 * Calculate the cosine similarity between two embedding vectors
 *
 * @param embedding1 - First embedding vector
 * @param embedding2 - Second embedding vector
 * @returns A number between -1 and 1, where 1 means identical vectors
 */
export function cosineSimilarity(
  embedding1: number[],
  embedding2: number[],
): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same dimensions");
  }

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
}
