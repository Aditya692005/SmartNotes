import { genAI, MODEL } from "./geminiClient.js";

export async function summarizeChunk(chunk, index) {
  const model = genAI.getGenerativeModel({
    model: MODEL
  });

  const prompt = `
Summarize the following transcript chunk into well-structured markdown notes.

Rules:
- Use headings and subheadings
- Use bullet points
- Do not skip important topics
- Make it clean and readable

Chunk #${index}:
"""
${chunk}
"""
  `;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });

  return result.response.text();
}

export async function mergeNotes(notesArray) {
  const model = genAI.getGenerativeModel({
    model: MODEL
  });

  const prompt = `
Merge these notes into one clean, complete Markdown document.
Ensure no information is lost.

Notes:
"""
${notesArray.join("\n\n---\n\n")}
"""
  `;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });

  return result.response.text();
}
