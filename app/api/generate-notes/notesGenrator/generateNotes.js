import fs from "fs";
import { summarizeChunk, mergeNotes } from "./summarizer.js";

export async function generateNotes(transcript) {
  const chunkSize = 6000;
  const chunks = [];

  for (let i = 0; i < transcript.length; i += chunkSize) {
    chunks.push(transcript.slice(i, i + chunkSize));
  }

  console.log("Total chunks:", chunks.length);

  const notesParts = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Summarizing chunk ${i + 1}/${chunks.length}...`);
    const part = await summarizeChunk(chunks[i], i + 1);
    notesParts.push(part);
  }

  console.log("Merging notes...");
  const finalNotes = await mergeNotes(notesParts);

  return finalNotes;
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];

  if (!input || !output) {
    console.log("Usage: node generateNotes.js transcript.txt notes.md");
    return;
  }

  const transcript = fs.readFileSync(input, "utf8");

  const finalNotes = await generateNotes(transcript);

  fs.writeFileSync(output, finalNotes);
  console.log("Notes saved to:", output);
}

// Run CLI when invoked directly
if (process.argv && process.argv[1] && process.argv[1].endsWith("generateNotes.js")) {
  main();
}
