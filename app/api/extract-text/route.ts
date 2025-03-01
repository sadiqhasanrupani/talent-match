import { NextRequest } from "next/server";
import { parseResume, ResumeData } from "@/lib/pdf-parser";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Parse the form data using the native FormData API
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;

    if (!pdfFile) {
      return new Response(JSON.stringify({ message: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert the file to ArrayBuffer and then to Buffer
    const pdfArrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Parse the PDF
    const data = await parseResume(pdfBuffer);

    // Return the extracted text
    return new Response(JSON.stringify({ resumeData: data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return new Response(
      JSON.stringify({ message: "Error processing the PDF" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
