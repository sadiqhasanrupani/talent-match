// Candidate types
export interface Candidate {
  name: string;
  email: string;
  linkedin_url: string;
  skills_experience: string;
  resume_text: string;
}

export interface CandidateMetadata {
  name: string;
  email: string;
  linkedin_url: string;
  skill_experience: string;
}

// Job types
export interface JobPosting {
  id: string;
  title: string;
  description: string;
}

export interface JobMetadata {
  title: string;
  description: string;
}

// Match types
// export interface JobMatch {
//   job_id: string;
//   title: string;
//   description: string;
//   score: number;
// }

// export interface CandidateMatch {
//   name: string;
//   email: string;
//   linkedin_url: string;
//   skills_experience: string;
//   score: number;
// }

// AI Feedback type
export type AIFeedback = {
  text: string;
  category: "exceptional" | "high" | "medium" | "low";
  details: string;
};

// Interview Question type
export type InterviewQuestion = {
  question: string;
  rationale: string;
};

export type CandidateMatch = {
  id: string;
  name: string;
  email: string;
  skills_experience: string;
  linkedin_url?: string;
  score: number;
  normalizedScore?: number;
  ai_feedback?: AIFeedback;
  interview_questions?: string[] | InterviewQuestion[];
};

export type JobMatch = {
  id: string;
  title: string;
  description: string;
  score: number;
  normalizedScore?: number;
  ai_feedback?: AIFeedback;
  company?: string;
  location?: string;
  posted_date?: string;
  salary?: string;
  job_type?: string;
};
