/**
 * Local file storage implementation
 * Stores uploaded files in the public/uploads directory
 */

import path from "path";
import { promises as fsPromises } from "fs";

/**
 * Uploads a file to local storage
 * @param file The file to upload
 * @returns A promise that resolves to the path where the file is stored
 */
export async function uploadFile(file: File): Promise<string> {
  try {
    // Create a unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^\w.-]/g, "")}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, fileName);

    // Ensure the uploads directory exists
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Convert the file to an ArrayBuffer and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write the file to the filesystem
    await fsPromises.writeFile(filePath, buffer);

    // Return the public URL path (relative to the public directory)
    return `/uploads/${fileName}`;
  } catch (error) {
    throw new Error(
      `Failed to upload file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
