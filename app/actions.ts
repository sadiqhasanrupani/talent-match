"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { applications } from "@/lib/schema";
import { uploadFile } from "@/lib/storage";
import { sendEmail } from "@/lib/email";
import { parseResume } from "@/lib/pdf-parser";

export async function submitApplication(
  formData: { name: string; email: string; linkedIn: string; skills: string },
  resumeFile: File | null,
) {
  try {
    /**
     * Upload resume if provided
     */
    let resumeUrl = null;
    if (resumeFile) {
      resumeUrl = await uploadFile(resumeFile);

      // Fetch the file content from the URL
      const response = await fetch(resumeUrl);
      const fileBuffer = await response.arrayBuffer();

      // Convert to Buffer and parse the resume
      const buffer = Buffer.from(fileBuffer);
      const parsedResume = await parseResume(buffer);
      console.log("parsedResume: ", parsedResume);
    }

    /**
     * Store application data in the database
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
        message:
          "Unable to process your application please try again sometime.",
      };
    }

    /**
     * Send confirmation email to candidate
     */
    await sendEmail(
      formData.email,
      "Application Received",
      `Hello ${formData.name},\n\nYour application has been received. We'll get back to you soon!\n\nBest,\nHiring Team`,
    );

    /**
     *  Revalidate cache to update UI
     */
    revalidatePath("/applications");

    return { success: true, message: "Application submitted successfully!" };
  } catch (error) {
    console.error("Error submitting application:", error);
    return { success: false, message: "Failed to submit application." };
  }
}
