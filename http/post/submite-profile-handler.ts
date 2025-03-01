import { ResumeData } from "@/lib/pdf-parser";
import { Candidate } from "@/lib/types";

type Result = {
  resumeData: ResumeData;
};

export async function submitProfileHandler(
  candidateProfile: Candidate,
): Promise<Result> {
  const response = await fetch("/api/store-candidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(candidateProfile),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to store candidate");
  }

  return await response.json();
}
