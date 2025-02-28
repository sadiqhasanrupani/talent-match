"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications } from "@/lib/schema";
import { uploadFile } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { parseResume, ResumeData } from "@/lib/pdf-parser";
import { generateEmbedding } from "@/lib/embeddings";
import { storeCandidateEmbedding } from "@/lib/pinecone";
import { eq } from "drizzle-orm";
/**
 * Submits a candidate application with the following steps:
 * 1. Uploads and parses the resume if provided
 * 2. Stores application data in the PostgreSQL database
 * 3. Generates embeddings for combined application and resume data
 * 4. Stores embeddings in Pinecone for vector search
 * 5. Sends a confirmation email to the candidate
 *
 * @param formData Application data containing name, email, LinkedIn URL, and skills
 * @param resumeFile Optional resume file uploaded by the candidate
 * @returns Object containing success status, message, and application ID if successful
 */
export async function submitApplication(
  formData: { name: string; email: string; linkedIn: string; skills: string },
  resumeFile: File | null,
) {
  try {
    let resumeUrl = null;
    let parsedResume: ResumeData | null = null;

    /**
     * Step 1: Upload and parse resume if provided
     */
    if (resumeFile) {
      try {
        // Upload the resume file to storage
        resumeUrl = await uploadFile(resumeFile);

        // Use NEXT_PUBLIC_BASE_URL to construct an absolute URL
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const absoluteResumeUrl = `${baseUrl}${resumeUrl}`;

        // Fetch the file for parsing
        const response = await fetch(absoluteResumeUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch resume: ${response.statusText}`);
        }
        const fileBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(fileBuffer);

        // Parse the resume with error handling
        parsedResume = await parseResume(buffer);
        console.log("Resume parsed successfully");
      } catch (parseError) {
        console.error("Error parsing resume:", parseError);
        // Continue with application process even if resume parsing fails
      }
    }

    /**
     * Step 2: Store application data in the database
     */
    const application = await db
      .insert(applications)
      .values({
        name: formData.name,
        email: formData.email,
        linkedinUrl: formData.linkedIn,
        skills: formData.skills,
        resumeUrl: resumeUrl,
      })
      .returning({ id: applications.id });

    if (!application[0]) {
      return {
        success: false,
        message: "Unable to process your application. Please try again later.",
      };
    }

    /**
     * Step 3: Retrieve full application data after saving
     */
    const applicationId = application[0].id;
    const fullApplication = await db
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.id, applicationId));

    if (!fullApplication[0]) {
      console.error("Could not retrieve full application data after saving");
      return {
        success: false,
        message: "Application saved but could not retrieve full data.",
      };
    }

    /**
     * Step 4: Generate embeddings and store them in Pinecone
     */
    try {
      // Create combined data for embedding generation
      let combinedData = `Name: ${formData.name}. Email: ${formData.email}. LinkedIn: ${formData.linkedIn}. Skills: ${formData.skills}.`;

      // Add resume data if parsed successfully
      if (parsedResume) {
        combinedData += ` Resume Text: ${parsedResume.rawText}`;

        if (parsedResume.skills && parsedResume.skills.length > 0) {
          combinedData += ` Skills from Resume: ${parsedResume.skills.join(", ")}.`;
        }

        if (parsedResume.experience && parsedResume.experience.length > 0) {
          combinedData += ` Experience: ${parsedResume.experience.join(" ")}.`;
        }

        if (parsedResume.education && parsedResume.education.length > 0) {
          combinedData += ` Education: ${parsedResume.education.join(" ")}.`;
        }
      }

      // Generate embeddings for the combined data
      const embedding = await generateEmbedding(combinedData);
      if (!embedding) {
        throw new Error("Failed to generate embedding");
      }

      // Create candidate data object that matches the CandidateMetadata type
      const candidateData = {
        id: applicationId.toString(),
        name: formData.name,
        email: formData.email,
        skills: formData.skills,
        linkedinUrl: formData.linkedIn,
        resumeText: parsedResume?.rawText || "",
      };

      // Store the embedding in Pinecone
      const storageResult = await storeCandidateEmbedding(
        candidateData,
        parsedResume?.rawText,
      );

      if (!storageResult.success) {
        console.warn(
          "Embedding storage was not successful:",
          storageResult.error,
        );
      } else {
        console.log("Candidate embedding stored successfully");
      }
    } catch (embeddingError) {
      // Log the error but don't fail the application submission
      console.error("Error generating or storing embeddings:", embeddingError);
    }

    /**
     * Step 5: Send confirmation email to candidate
     */
    try {
      await sendEmail(
        formData.email,
        "Application Received",
        `Hello ${formData.name},\n\nYour application has been received. We'll get back to you soon!\n\nBest,\nHiring Team`,
      );
      console.log("Confirmation email sent successfully");
    } catch (emailError) {
      // Log the error but don't fail the application submission
      console.error("Error sending confirmation email:", emailError);
    }

    /**
     * Step 6: Revalidate cache to update UI
     */
    try {
      revalidatePath("/applications");
    } catch (cacheError) {
      // Log the error but don't fail the application submission
      console.error("Error revalidating cache:", cacheError);
    }

    return {
      success: true,
      message: "Application submitted successfully!",
      applicationId: applicationId,
    };
  } catch (error) {
    console.error("Error submitting application:", error);
    return {
      success: false,
      message:
        "An error occurred while processing your application. Please try again later.",
    };
  }
}
