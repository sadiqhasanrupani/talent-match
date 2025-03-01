export async function resumeTextExtractor(formData: FormData) {
  const response = await fetch("/api/extract-text", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to store candidate");
  }

  return data;
}
