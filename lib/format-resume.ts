type ResumeData = {
  skills?: string[];
  experience?: string[];
  education?: string[];
  contact?: {
    email?: string;
    phone?: string;
  };
};

export function formatResume(resumeData: ResumeData): Promise<string> {
  return new Promise((resolve) => {
    let formattedText = "";

    if (resumeData.contact) {
      formattedText += `Contact Information:\n`;
      if (resumeData.contact.email)
        formattedText += `Email: ${resumeData.contact.email}\n`;
      if (resumeData.contact.phone)
        formattedText += `Phone: ${resumeData.contact.phone}\n`;
      formattedText += "\n";
    }

    if (resumeData.experience && resumeData.experience.length > 0) {
      formattedText += `Experience:\n`;
      formattedText += resumeData.experience.join(" \n");
      formattedText += "\n\n";
    }

    if (resumeData.skills && resumeData.skills.length > 0) {
      formattedText += `Skills:\n`;
      formattedText += resumeData.skills.join(", ");
      formattedText += "\n\n";
    }

    if (resumeData.education && resumeData.education.length > 0) {
      formattedText += `Education:\n`;
      formattedText += resumeData.education.join(" \n");
      formattedText += "\n\n";
    }

    resolve(formattedText.trim());
  });
}
