import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define types for the feedback and questions
export interface AIFeedback {
  text: string;
  category: "exceptional" | "high" | "medium" | "low";
  details: string;
}

export interface InterviewQuestion {
  question: string;
  rationale: string;
}

/**
 * Generate AI feedback for a candidate based on their skills and job requirements
 */
export async function generateAIFeedback(
  candidateSkills: string,
  jobRequirements: string,
  matchScore: number,
): Promise<AIFeedback> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt
    const prompt = `
      You are an AI recruiting assistant helping to evaluate candidate matches for job positions.

      Candidate skills and experience: "${candidateSkills}"

      Job requirements: "${jobRequirements}"

      Match score (0-100): ${matchScore}

      Based on this information, provide a detailed assessment of how well the candidate matches the job requirements.
      Format your response as a JSON object with the following structure:
      {
        "text": "A short, one-sentence summary of the match quality",
        "category": "One of: exceptional, high, medium, or low based on the match score and qualitative assessment",
        "details": "A paragraph with 2-3 sentences explaining the match in more detail, including strengths and potential gaps"
      }

      Only return the JSON object, nothing else.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      // Extract JSON if it's wrapped in code blocks or other text
      let jsonString = text.trim();
      
      // Handle ```json code blocks
      if (jsonString.startsWith("```json") && jsonString.endsWith("```")) {
        jsonString = jsonString.substring(8, jsonString.length - 3).trim();
      }
      // Handle ``` code blocks
      else if (jsonString.startsWith("```") && jsonString.endsWith("```")) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
      }
      // Handle cases where there's text before or after the JSON
      else {
        const jsonMatch = jsonString.match(/{[\s\S]*}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      const feedback = JSON.parse(jsonString) as AIFeedback;

      return feedback;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      // Fallback response if parsing fails
      return {
        text: `Match score: ${matchScore}%`,
        category:
          matchScore >= 90
            ? "exceptional"
            : matchScore >= 70
              ? "high"
              : matchScore >= 40
                ? "medium"
                : "low",
        details:
          "The candidate's skills and experience have been analyzed against the job requirements.",
      };
    }
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    // Fallback response if API call fails
    return {
      text: `Match score: ${matchScore}%`,
      category:
        matchScore >= 90
          ? "exceptional"
          : matchScore >= 70
            ? "high"
            : matchScore >= 40
              ? "medium"
              : "low",
      details: "Unable to generate detailed AI feedback at this time.",
    };
  }
}

/**
 * Generate interview questions based on candidate skills and job requirements
 */
export async function generateInterviewQuestions(
  candidateSkills: string,
  jobRequirements: string,
  matchScore: number,
): Promise<InterviewQuestion[]> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt
    const prompt = `
      You are an AI recruiting assistant helping to generate interview questions for job candidates.

      Candidate skills and experience: "${candidateSkills}"

      Job requirements: "${jobRequirements}"

      Match score (0-100): ${matchScore}

      Based on this information, generate 3 tailored interview questions that will help assess:
      1. The candidate's technical skills relevant to the job
      2. Their experience with specific technologies mentioned in their profile
      3. Any potential gaps between their skills and the job requirements

      For each question, also provide a rationale explaining why this question is important to ask.

      Format your response as a JSON array of objects, each containing a question and its rationale.
      Example: [
        {
          "question": "Question 1",
          "rationale": "Rationale for asking question 1"
        },
        {
          "question": "Question 2",
          "rationale": "Rationale for asking question 2"
        }
      ]

      Only return the JSON array, nothing else.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    try {
      // Extract JSON if it's wrapped in code blocks or other text
      let jsonString = text.trim();
      
      // Handle ```json code blocks
      if (jsonString.startsWith("```json") && jsonString.endsWith("```")) {
        jsonString = jsonString.substring(8, jsonString.length - 3).trim();
      }
      // Handle ``` code blocks
      else if (jsonString.startsWith("```") && jsonString.endsWith("```")) {
        jsonString = jsonString.substring(3, jsonString.length - 3).trim();
      } 
      // Handle cases where there's text before or after the JSON array
      else {
        const jsonMatch = jsonString.match(/\[([\s\S]*)\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Handle both old format (string[]) and new format (InterviewQuestion[])
      let questions: InterviewQuestion[];
      
      if (Array.isArray(parsed)) {
        if (typeof parsed[0] === 'string') {
          // Convert old format to new format
          questions = parsed.map((q: string) => ({
            question: q,
            rationale: "This question helps assess the candidate's fit for the position."
          }));
        } else {
          // Already in correct format
          questions = parsed as InterviewQuestion[];
        }
      } else {
        throw new Error("Unexpected response format");
      }

      return questions.slice(0, 3); // Ensure we only return 3 questions
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);

      // Fallback questions if parsing fails
      const skillsList = candidateSkills
        .split(/,|\.|and/)
        .map((s) => s.trim())
        .filter(Boolean);
      const randomSkills = skillsList
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      if (matchScore >= 70) {
        return [
          {
            question: `Can you describe a project where you used ${randomSkills[0] || "your technical skills"} to solve a complex problem?`,
            rationale: "This helps assess the candidate's practical experience and problem-solving abilities with specific technologies."
          },
          {
            question: `How do you stay updated with the latest developments in ${randomSkills[1] || "your field"}?`,
            rationale: "This reveals the candidate's commitment to continuous learning and staying current in their field."
          },
          {
            question: `What's your approach to learning new technologies quickly?`,
            rationale: "This evaluates the candidate's adaptability and learning methodology, which is crucial in fast-evolving technical roles."
          },
        ];
      } else {
        return [
          {
            question: `How would you rate your proficiency in ${randomSkills[0] || "the required technologies"} and why?`,
            rationale: "This helps evaluate the candidate's self-awareness and honest assessment of their skills in relation to the job requirements."
          },
          {
            question: `What steps would you take to improve your knowledge of ${randomSkills[1] || "the required skills"}?`,
            rationale: "This assesses the candidate's commitment to addressing their skill gaps and their approach to professional development."
          },
          {
            question: `Can you describe a situation where you had to learn a new technology quickly?`,
            rationale: "This evaluates the candidate's adaptability and ability to efficiently acquire new skills when needed for a project."
          },
        ];
      }
    }
  } catch (error) {
    console.error("Error generating interview questions:", error);

    // Fallback questions if API call fails
    return [
      {
        question: "Can you describe your experience with the technologies mentioned in your profile?",
        rationale: "This helps verify the candidate's claimed experience and assess depth of knowledge in relevant technologies."
      },
      {
        question: "How do you approach learning new technologies or skills?",
        rationale: "This reveals the candidate's learning methodology and adaptability to new technical challenges."
      },
      {
        question: "What do you consider your strongest technical skill and why?",
        rationale: "This provides insight into the candidate's strengths and self-awareness about their technical capabilities."
      },
    ];
  }
}

/**
 * Calculate a match score between a candidate's skills and job requirements using Gemini AI
 */
export async function calculateMatchScore(
  candidateSkills: string,
  jobRequirements: string,
): Promise<number> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the prompt
    const prompt = `
      You are an AI recruiting assistant calculating a match score between a candidate and a job position.

      Candidate skills and experience: "${candidateSkills}"

      Job requirements: "${jobRequirements}"

      Based on this information, calculate a match score from 0 to 100 that represents how well the candidate's skills match the job requirements.

      Consider the following factors:
      1. Technical skills mentioned in both the candidate profile and job requirements
      2. Experience level and depth of knowledge
      3. Relevance of the candidate's background to the job
      4. Both hard skills (specific technologies) and soft skills (if mentioned)

      Return ONLY a single number between 0 and 100 representing the match percentage. 
      Do not include any explanation or text, only the number.
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();

    // Parse the response to extract only the number
    const scoreMatch = text.match(/\d+/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[0], 10);
      // Ensure the score is within the valid range
      return Math.min(Math.max(score, 0), 100);
    }

    // Default fallback score if we couldn't parse a number
    return 50;
  } catch (error) {
    console.error("Error calculating AI match score:", error);
    // Return a default score if the API call fails
    return 50;
  }
}

