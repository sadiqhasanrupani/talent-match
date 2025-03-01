import { Pinecone } from "@pinecone-database/pinecone";

// Add debug logging function
const debugLog = (message: string, data?: any) => {
  if (process.env.DEBUG_PINECONE === 'true') {
    console.log(`[PINECONE DEBUG] ${message}`, data || '');
  }
};

// Initialize Pinecone with new API and proper error handling
let pc: Pinecone | null = null;

try {
  const apiKey = process.env.PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not defined in environment variables");
  }
  
  debugLog("Initializing Pinecone client");
  
  // Initialize with the new API for serverless indexes
  pc = new Pinecone({
    apiKey: apiKey.toString()
  });
  
  debugLog("Pinecone client initialized successfully");
} catch (error) {
  console.error("Failed to initialize Pinecone client:", error);
  // We'll handle the null pc in the functions below
}

// Index names
export const CANDIDATE_INDEX_NAME = "candidate-index";
export const JOB_INDEX_NAME = "job-description-index";

// Function to create an index if it doesn't exist
export async function createPineconeIndex(indexName: string, dimension = 384) {
  if (!pc) {
    console.error("Cannot create index: Pinecone client not initialized");
    throw new Error("Pinecone client not initialized");
  }
  
  try {
    debugLog(`Checking if index '${indexName}' exists`);
    
    // List existing indexes with error handling
    const existingIndexes = await pc.listIndexes().catch(error => {
      console.error(`Failed to list Pinecone indexes: ${error}`);
      throw new Error(`Failed to list Pinecone indexes: ${error.message}`);
    });
    
    const indexExists = existingIndexes.indexes?.some(
      (index) => index.name === indexName,
    );
    
    debugLog(`Index '${indexName}' exists: ${indexExists}`);

    if (!indexExists) {
      debugLog(`Creating new index '${indexName}'`);
      // Create index with new API
      await pc.createIndex({
        name: indexName,
        dimension: dimension,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: "us-east-1",
          },
        },
      }).catch(error => {
        console.error(`Failed to create Pinecone index '${indexName}': ${error}`);
        throw new Error(`Failed to create Pinecone index '${indexName}': ${error.message}`);
      });
      
      console.log(`✅ Created Pinecone index: ${indexName}`);
      
      // Wait for index to be ready
      console.log(`Waiting for index '${indexName}' to be ready...`);
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 60 seconds
    } else {
      console.log(`✅ Using existing Pinecone index: ${indexName}`);
    }
  } catch (error) {
    console.error(`Error creating Pinecone index: ${error}`);
    throw error; // Re-throw to allow caller to handle
  }
}

// Get Pinecone indexes with error handling
export const getCandidateIndex = () => {
  if (!pc) {
    console.error("Cannot get candidate index: Pinecone client not initialized");
    throw new Error("Pinecone client not initialized");
  }
  
  debugLog(`Getting candidate index: ${CANDIDATE_INDEX_NAME}`);
  try {
    return pc.index(CANDIDATE_INDEX_NAME);
  } catch (error) {
    console.error(`Error getting candidate index: ${error}`);
    throw new Error(`Failed to connect to candidate index: ${error.message}`);
  }
};

export const getJobIndex = () => {
  if (!pc) {
    console.error("Cannot get job index: Pinecone client not initialized");
    throw new Error("Pinecone client not initialized");
  }
  
  debugLog(`Getting job index: ${JOB_INDEX_NAME}`);
  try {
    return pc.index(JOB_INDEX_NAME);
  } catch (error) {
    console.error(`Error getting job index: ${error}`);
    throw new Error(`Failed to connect to job index: ${error.message}`);
  }
};

// Initialize indexes with better error handling
export async function initPinecone() {
  debugLog("Initializing Pinecone indexes");
  
  if (!pc) {
    const error = "Cannot initialize indexes: Pinecone client not initialized";
    console.error(error);
    throw new Error(error);
  }
  
  try {
    console.log("Creating candidate index...");
    await createPineconeIndex(CANDIDATE_INDEX_NAME);
    
    console.log("Creating job index...");
    await createPineconeIndex(JOB_INDEX_NAME);
    
    // Test connections to verify indexes are accessible
    debugLog("Testing connection to indexes");
    
    try {
      const candidateIndex = getCandidateIndex();
      const stats = await candidateIndex.describeIndexStats();
      debugLog("Candidate index connection successful", stats);
    } catch (error) {
      console.error(`Failed to connect to candidate index: ${error}`);
    }
    
    try {
      const jobIndex = getJobIndex();
      const stats = await jobIndex.describeIndexStats();
      debugLog("Job index connection successful", stats);
    } catch (error) {
      console.error(`Failed to connect to job index: ${error}`);
    }
    
    console.log("✅ Pinecone indexes initialized");
  } catch (error) {
    console.error("Failed to initialize Pinecone indexes:", error);
    throw error;
  }
}

// Export Pinecone client for testing connection
export const getPineconeClient = () => {
  if (!pc) {
    throw new Error("Pinecone client not initialized");
  }
  return pc;
};
