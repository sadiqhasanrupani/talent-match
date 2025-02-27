import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

// Type definitions for resume and job data
export interface ResumeData {
  text: string;
  candidateName?: string;
  fileInfo?: {
    filename: string;
    size: number;
  };
}

export interface JobRequirements {
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceLevel?: string;
}

export interface CandidateSummary {
  name: string;
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
}

export interface CandidateEvaluation {
  score: number; // 0-100
  skillsMatch: {
    matched: string[];
    missing: string[];
  };
  strengths: string[];
  weaknesses: string[];
  overallAssessment: string;
}

export interface CandidateFeedback {
  recommendedNextSteps: string[];
  suggestedImprovement: string;
  skillGaps: string[];
  trainingRecommendations?: string[];
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private apiKey: string;

  constructor(
    apiKey: string = process.env.GOOGLE_AI_API_KEY!,
    modelName: string = "gemini-pro",
  ) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = modelName;
  }

  private async getModel() {
    return this.genAI.getGenerativeModel({
      model: this.model,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });
  }

  /**
   * Summarizes a resume to generate a structured candidate profile
   * @param resumeData The resume text and optional metadata
   * @returns A structured summary of the candidate's profile
   */
  async summarizeResume(resumeData: ResumeData): Promise<CandidateSummary> {
    const model = await this.getModel();

    const prompt = `
    Analyze the following resume and extract key information into a structured format.

    Resume:
    ${resumeData.text}

    Please provide a structured summary with the following information:
    1. Name of the candidate
    2. Skills (as a list)
    3. Experience (as a list of roles with companies and timeframes)
    4. Education (as a list)
    5. A brief professional summary (3-4 sentences)

    Format the response as JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from text response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from API response");
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);
      return {
        name: jsonResponse.name || resumeData.candidateName || "Unknown",
        skills: jsonResponse.skills || [],
        experience: jsonResponse.experience || [],
        education: jsonResponse.education || [],
        summary: jsonResponse.summary || "",
      };
    } catch (error) {
      console.error("Error parsing resume:", error);

      if (error instanceof Error) {
        throw new Error(`Error summarizing resume: ${error.message}`);
      } else {
        throw new Error(`Error summarizing resume: something went wrong`);
      }
    }
  }

  /**
   * Evaluates a candidate against job requirements
   * @param candidateSummary The structured candidate summary
   * @param jobRequirements The job requirements to evaluate against
   * @returns An evaluation of the candidate against the job requirements
   */
  async evaluateCandidate(
    candidateSummary: CandidateSummary,
    jobRequirements: JobRequirements,
  ): Promise<CandidateEvaluation> {
    const model = await this.getModel();

    const prompt = `
    You are an expert HR professional tasked with evaluating a candidate for a job opening.

    Job Details:
    Title: ${jobRequirements.title}
    Description: ${jobRequirements.description}
    Required Skills: ${jobRequirements.requiredSkills.join(", ")}
    ${jobRequirements.preferredSkills ? `Preferred Skills: ${jobRequirements.preferredSkills.join(", ")}` : ""}
    ${jobRequirements.experienceLevel ? `Experience Level: ${jobRequirements.experienceLevel}` : ""}

    Candidate Details:
    Name: ${candidateSummary.name}
    Skills: ${candidateSummary.skills.join(", ")}
    Experience: ${JSON.stringify(candidateSummary.experience)}
    Education: ${JSON.stringify(candidateSummary.education)}
    Summary: ${candidateSummary.summary}

    Evaluate this candidate against the job requirements and provide:
    1. A score from 0-100 indicating how well they match the job requirements
    2. Skills match analysis (which required skills they have and which they lack)
    3. The candidate's key strengths relative to this role
    4. The candidate's key weaknesses or gaps relative to this role
    5. An overall assessment paragraph

    Format the response as JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from text response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from API response");
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);
      return {
        score: jsonResponse.score || 0,
        skillsMatch: {
          matched: jsonResponse.skillsMatch?.matched || [],
          missing: jsonResponse.skillsMatch?.missing || [],
        },
        strengths: jsonResponse.strengths || [],
        weaknesses: jsonResponse.weaknesses || [],
        overallAssessment: jsonResponse.overallAssessment || "",
      };
    } catch (error) {
      console.error("Error evaluating candidate:", error);
      throw new Error(
        `Failed to evaluate candidate: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Generates feedback for a candidate based on their evaluation
   * @param candidateSummary The structured candidate summary
   * @param evaluation The evaluation results
   * @param jobRequirements The job requirements
   * @returns Personalized feedback for the candidate
   */
  async generateFeedback(
    candidateSummary: CandidateSummary,
    evaluation: CandidateEvaluation,
    jobRequirements: JobRequirements,
  ): Promise<CandidateFeedback> {
    const model = await this.getModel();

    const prompt = `
    You are a career coach providing constructive feedback to a job candidate.

    Candidate Summary:
    ${JSON.stringify(candidateSummary, null, 2)}

    Job Requirements:
    ${JSON.stringify(jobRequirements, null, 2)}

    Evaluation Results:
    ${JSON.stringify(evaluation, null, 2)}

    Based on the evaluation, provide:
    1. 3-5 recommended next steps for this candidate
    2. Constructive feedback on how they could improve their candidacy
    3. Specific skill gaps they should address
    4. Recommended training or certifications that would help them

    Make the feedback actionable, specific, and encouraging. Format the response as JSON.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Extract JSON from text response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from API response");
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);
      return {
        recommendedNextSteps: jsonResponse.recommendedNextSteps || [],
        suggestedImprovement: jsonResponse.suggestedImprovement || "",
        skillGaps: jsonResponse.skillGaps || [],
        trainingRecommendations: jsonResponse.trainingRecommendations || [],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate feedback: ${error.message}`);
      } else {
        throw new Error(
          "Failed to generate feedback: An unknown error occurred",
        );
      }
    }
  }

  /**
   * Compares multiple candidates for a job and ranks them
   * @param candidates Array of candidate evaluations
   * @returns Ranked list of candidates with comparative analysis
   */
  async rankCandidates(
    candidates: Array<{
      name: string;
      summary: CandidateSummary;
      evaluation: CandidateEvaluation;
    }>,
    jobRequirements: JobRequirements,
  ): Promise<
    Array<{
      name: string;
      rank: number;
      score: number;
      rationale: string;
    }>
  > {
    const model = await this.getModel();

    const prompt = `
    You are a hiring manager comparing multiple candidates for a job opening.

    Job Requirements:
    ${JSON.stringify(jobRequirements, null, 2)}

    Candidates:
    ${JSON.stringify(candidates, null, 2)}

    Rank these candidates from best to worst fit for the role. For each candidate, provide:
    1. Their rank (1 being the best)
    2. Their score out of 100
    3. A brief rationale for their ranking

    Format the response as a JSON array.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extract JSON from text response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Failed to parse JSON from API response");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error ranking candidates:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to rank candidates: ${error.message}`);
      } else {
        throw new Error("Failed to rank candidates: An unknown error occurred");
      }
    }
  }
}

// Export a singleton instance with default configuration
export const geminiService = new GeminiService();

// Export default for direct imports
export default GeminiService;
