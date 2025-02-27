import fs from 'fs';

// Import the PDF parser from the actual implementation file
// This bypasses the main entry point which tries to access test files
import { PdfParser } from '@pixdif/pdf-parser';

/**
* Interface for the data returned from resume parsing
*/
export interface ResumeData {
rawText: string;
skills?: string[];
education?: string[];
experience?: string[];
summary?: string;
}

/**
* Parse a PDF resume from a buffer or file path
* 
* @param source - Buffer containing PDF data or path to PDF file
* @returns Parsed resume data
*/
export async function parseResume(source: Buffer | string): Promise<ResumeData> {
try {
    let dataBuffer: Buffer;
    
    // If source is a string (file path), read the file
    if (typeof source === 'string') {
    // Handle URL case - will need to be implemented with fetch in actual usage
    if (source.startsWith('http')) {
        throw new Error('URL parsing not implemented in this wrapper. Please download the file first.');
    }
    
    // Read from filesystem
    dataBuffer = fs.readFileSync(source);
    } else {
    // Source is already a buffer
    dataBuffer = source;
    }
    
    // Parse the PDF
    const parser = new PdfParser();
    const data = await parser.parse(dataBuffer);
    
    // Extract the raw text
    const rawText = data.text || '';
    
    // Simple extraction of skills, education, and experience based on keyword matching
    // This is a very basic implementation - a more robust solution would use NLP
    const skills = extractSection(rawText, ['skills', 'technologies', 'technical skills'], 200);
    const education = extractSection(rawText, ['education', 'academic', 'degree'], 300);
    const experience = extractSection(rawText, ['experience', 'employment', 'work history'], 500);
    
    // Create a summary (first 200 characters or so)
    const summary = rawText.substring(0, 200).trim();
    
    return {
    rawText,
    skills,
    education,
    experience,
    summary
    };
} catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
}
}

/**
* Extract sections from resume text based on keywords
* 
* @param text - The full text of the resume
* @param keywords - Keywords that might indicate the start of a section
* @param maxLength - Maximum length of text to extract
* @returns Array of extracted skills
*/
function extractSection(text: string, keywords: string[], maxLength: number): string[] {
const lowerText = text.toLowerCase();

// Find the position of the keywords
let startPos = -1;
for (const keyword of keywords) {
    const pos = lowerText.indexOf(keyword.toLowerCase());
    if (pos !== -1 && (startPos === -1 || pos < startPos)) {
    startPos = pos;
    }
}

if (startPos === -1) {
    return [];
}

// Extract the section text
const sectionText = text.substring(startPos, startPos + maxLength);

// Split into lines and clean up
return sectionText
    .split(/[\n,;•]/)
    .map(item => item.trim())
    .filter(item => item.length > 2); // Filter out very short items
}

