export const translateText = async (description: string): Promise<string> => {
  const response = await fetch("/api/text-translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    throw new Error("Translation request failed");
  }

  const data = await response.json();
  return data.translatedText;
};