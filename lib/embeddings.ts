import { HfInference } from "@huggingface/inference";

// Initialize the HuggingFace client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

// Default embedding model for HuggingFace
const DEFAULT_HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Generate embeddings using HuggingFace models
 * @param text The text to generate embeddings for
 * @param model Optional model name (defaults to sentence-transformers/all-MiniLM-L6-v2)
 */
export async function generateEmbedding(
  text: string,
  model: string = DEFAULT_HF_MODEL,
): Promise<number[]> {
  try {
    // Generate embedding using HuggingFace's featureExtraction pipeline
    const response = await hf.featureExtraction({
      model,
      inputs: text,
    });

    // The response can be:
    // - a single number
    // - a one-dimensional array of numbers (number[])
    // - a two-dimensional array of numbers (number[][]) (e.g., token embeddings)
    if (typeof response === "number") {
      return [response];
    }

    if (Array.isArray(response)) {
      // Check if the first element is a number
      if (typeof response[0] === "number") {
        // Already a flat array
        return response as number[];
      }

      // Otherwise, assume it's an array of arrays of numbers (token embeddings)
      if (Array.isArray(response[0])) {
        const tokenEmbeddings = response as number[][];
        if (tokenEmbeddings.length === 0) {
          throw new Error(
            "Empty token embeddings returned from HuggingFace API",
          );
        }
        // Average pooling: compute the average across all token embeddings
        const dim = tokenEmbeddings[0].length;
        const avgEmbedding = new Array(dim).fill(0);
        for (const token of tokenEmbeddings) {
          for (let i = 0; i < dim; i++) {
            avgEmbedding[i] += token[i];
          }
        }
        return avgEmbedding.map((val) => val / tokenEmbeddings.length);
      }
    }

    throw new Error("Unexpected response format from HuggingFace API");
  } catch (error) {
    console.error("Error generating HuggingFace embedding:", error);
    throw new Error(
      `Failed to generate HuggingFace embedding: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Generate embeddings for a job description
 * @param jobDescription The job description text
 * @param model Optional model name for HuggingFace embeddings
 */
export async function generateJobEmbedding(
  jobDescription: string,
  model?: string,
): Promise<number[]> {
  const processedText = jobDescription.trim();
  return generateEmbedding(processedText, model);
}

/**
 * Generate embeddings for a candidate profile
 * @param candidateProfile The candidate profile text (from resume or other sources)
 * @param model Optional model name for HuggingFace embeddings
 */
export async function generateCandidateEmbedding(
  candidateProfile: string,
  model?: string,
): Promise<number[]> {
  const processedText = candidateProfile.trim();
  return generateEmbedding(processedText, model);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param texts Array of texts to generate embeddings for
 * @param model Optional model name for HuggingFace embeddings
 */
export async function generateBatchEmbeddings(
  texts: string[],
  model?: string,
): Promise<number[][]> {
  try {
    const embeddings = await Promise.all(
      texts.map((text) => generateEmbedding(text, model)),
    );
    return embeddings;
  } catch (error) {
    console.error("Error generating batch embeddings with HuggingFace:", error);
    throw new Error(
      `Failed to generate batch embeddings with HuggingFace: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Compare embeddings for a given text using HuggingFace.
 * (Since only HuggingFace is used, this simply returns its embedding.)
 * @param text The text to generate embeddings for and compare results
 */
export async function compareEmbeddings(
  text: string,
): Promise<{ huggingface: number[] }> {
  try {
    const huggingfaceEmbedding = await generateEmbedding(text);
    return { huggingface: huggingfaceEmbedding };
  } catch (error) {
    console.error("Error comparing embeddings:", error);
    throw new Error(
      `Failed to compare embeddings: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
