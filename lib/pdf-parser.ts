import fs from "fs";
import PDFParser from 'pdf2json';
// Define types for the extracted information
export interface ResumeData {
  rawText: string;
  skills: string[];
  experience: string[];
  education: string[];
  contact?: {
    email?: string;
    phone?: string;
  };
}

// Common keywords for identifying different sections
const SECTION_KEYWORDS = {
  skills: [
    "skills",
    "technical skills",
    "core competencies",
    "technologies",
    "proficiencies",
  ],
  experience: [
    "experience",
    "work experience",
    "employment history",
    "work history",
    "professional experience",
  ],
  education: [
    "education",
    "academic background",
    "educational background",
    "academic history",
    "qualifications",
  ],
  contact: ["contact", "email", "phone", "address"],
};

// Common skill keywords to look for
const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c#",
  "c++",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "react",
  "angular",
  "vue",
  "node",
  "express",
  "django",
  "flask",
  "spring",
  "asp.net",
  "html",
  "css",
  "sass",
  "less",
  "bootstrap",
  "tailwind",
  "material-ui",
  "semantic-ui",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "terraform",
  "jenkins",
  "circleci",
  "travis",
  "sql",
  "mysql",
  "postgresql",
  "mongodb",
  "dynamodb",
  "firebase",
  "redis",
  "elasticsearch",
  "git",
  "github",
  "gitlab",
  "bitbucket",
  "jira",
  "confluence",
  "trello",
  "agile",
  "scrum",
];

/**
 * Parse a PDF file and extract text and key information
 * @param input - Buffer containing PDF data or path to PDF file
 */
export async function parseResume(input: Buffer | string): Promise<ResumeData> {
  try {
    let pdfBuffer: Buffer;

    // If input is a string, assume it's a file path or URL
    if (typeof input === "string") {
      try {
        // Check if input is a URL
        if (input.startsWith("http://") || input.startsWith("https://")) {
          // Fetch content from URL
          const response = await fetch(input);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch PDF from URL: ${response.status} ${response.statusText}`,
            );
          }

          // Convert to buffer
          const arrayBuffer = await response.arrayBuffer();
          pdfBuffer = Buffer.from(arrayBuffer);
        } else {
          // Try to read as a local file
          try {
            pdfBuffer = fs.readFileSync(input);
          } catch (fsError) {
            console.error("Error reading local PDF file:", fsError);
            throw new Error(
              `Error reading local PDF file: ${fsError instanceof Error ? fsError.message : "Unknown error"}`,
            );
          }
        }
      } catch (error) {
        console.error("Error handling PDF input:", error);

        if (error instanceof Error) {
          throw new Error(`Error processing PDF file: ${error.message}`);
        } else {
          throw new Error(
            "Error processing PDF file: An unknown error occurred.",
          );
        }
      }
    } else {
      pdfBuffer = input;
    }

    // Parse the PDF
    let text;
    try {
    text = await extractTextFromPdf(pdfBuffer);
    } catch (parseError) {
    console.error("Error parsing PDF content:", parseError);
    throw new Error(
        `Failed to parse PDF content: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
    );
    }

    // Extract information
    const skills = extractSkills(text);
    const experience = extractExperience(text);
    const education = extractEducation(text);
    const contact = extractContactInfo(text);

    return {
      rawText: text,
      skills,
      experience,
      education,
      contact,
    };
  } catch (error) {
    console.error("Error parsing resume:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to parse resume: ${error.message}`);
    } else {
      throw new Error("Failed to parse resume: An unknown error occurred.");
    }
  }
}

/**
 * Extract skills from resume text
 */
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const lowerText = text.toLowerCase();

  // Try to find a skills section
  const skillsSection = extractSection(text, SECTION_KEYWORDS.skills);

  if (skillsSection) {
    // Look for bullet points or comma-separated skills
    const skillLines = skillsSection.split(/[•·,\n]/);
    for (const line of skillLines) {
      const trimmed = line.trim();
      if (trimmed.length > 2) {
        // Ignore very short strings
        skills.push(trimmed);
      }
    }
  }

  // If no skills found in a specific section, look for common skill keywords
  if (skills.length === 0) {
    for (const skill of COMMON_SKILLS) {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }
  }

  return skills;
}

/**
 * Extract experience information from resume text
 */
function extractExperience(text: string): string[] {
  const experiences: string[] = [];
  const experienceSection = extractSection(text, SECTION_KEYWORDS.experience);

  if (experienceSection) {
    // Split by common delimiters like bullet points or new lines
    const items = experienceSection.split(/[•·\n]+/);
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed.length > 10) {
        // Ignore very short lines
        experiences.push(trimmed);
      }
    }
  }

  return experiences;
}

/**
 * Extract education information from resume text
 */
function extractEducation(text: string): string[] {
  const education: string[] = [];
  const educationSection = extractSection(text, SECTION_KEYWORDS.education);

  if (educationSection) {
    // Split by common delimiters like bullet points or new lines
    const items = educationSection.split(/[•·\n]+/);
    for (const item of items) {
      const trimmed = item.trim();
      if (trimmed.length > 10) {
        // Ignore very short lines
        education.push(trimmed);
      }
    }
  }

  return education;
}

/**
 * Extract contact information (email, phone) from resume text
 */
function extractContactInfo(text: string): { email?: string; phone?: string } {
  const result: { email?: string; phone?: string } = {};

  // Extract email using regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches && emailMatches.length > 0) {
    result.email = emailMatches[0];
  }

  // Extract phone number using regex (simple pattern for demonstration)
  const phoneRegex = /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches && phoneMatches.length > 0) {
    result.phone = phoneMatches[0];
  }

  return result;
}

/**
 * Extract a section from the resume text based on keywords
 */
function extractSection(text: string, keywords: string[]): string | null {
  const lines = text.split("\n");
  let startIndex = -1;
  let endIndex = -1;

  // Find the start of the section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    if (keywords.some((keyword) => line.includes(keyword.toLowerCase()))) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return null; // Section not found
  }

  // Find the end of the section (next section heading or end of document)
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    const isNewSection = Object.values(SECTION_KEYWORDS)
      .flat()
      .some(
        (keyword) =>
          line === keyword.toLowerCase() ||
          line.startsWith(keyword.toLowerCase() + ":") ||
          line.startsWith(keyword.toLowerCase() + " "),
      );

    if (isNewSection && i > startIndex + 2) {
      // Ensure we've captured some content
      endIndex = i - 1;
      break;
    }
  }

  // If no explicit end found, use the end of the document
  if (endIndex === -1) {
    endIndex = lines.length - 1;
  }

  // Return the section content
  return lines
    .slice(startIndex + 1, endIndex + 1)
    .join("\n")
    .trim();
}

/**
* Helper function to extract text from a PDF buffer using pdf2json
* @param pdfBuffer - Buffer containing PDF data
* @returns The extracted text as a string
*/
async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    
    // Register event handlers
    pdfParser.on("pdfParser_dataError", (errData) => {
    reject(new Error(errData.parserError));
    });
    
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
    try {
        // Extract text from the parsed PDF data
        let text = "";
        
        // PDF2JSON parses the PDF into pages, with each page containing text elements
        for (const page of pdfData.Pages) {
        for (const textItem of page.Texts) {
            // Decode the text content (pdf2json encodes spaces as '%20' and other special characters)
            for (const textFragment of textItem.R) {
            text += decodeURIComponent(textFragment.T) + " ";
            }
            text += "\n";
        }
        text += "\n\n"; // Add extra newlines between pages
        }
        
        resolve(text.trim());
    } catch (error) {
        reject(error);
    }
    });
    
    // Parse the PDF buffer
    try {
    pdfParser.parseBuffer(pdfBuffer);
    } catch (error) {
    reject(error);
    }
});
}
