"use client";

import { useState } from "react";

const PdfUploader = () => {
  const [text, setText] = useState<string | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setText(data.text);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      {text && <pre className="mt-4 p-2 border">{text}</pre>}
    </div>
  );
};

export default PdfUploader;
