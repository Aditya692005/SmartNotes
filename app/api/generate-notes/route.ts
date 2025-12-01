// app/api/generate-notes/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || !transcript.trim()) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert note-taker.
Given a raw transcript, produce clear, structured notes in Markdown.

Rules:
- Use headings and subheadings
- Use bullet points and numbered lists
- Keep sentences concise
- Do NOT include any Mermaid or mindmap syntax
- Only return the notes, no extra explanations`,
        },
        {
          role: "user",
          content: `Create structured notes from this transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    });

    const structuredNotes =
      completion.choices[0]?.message?.content?.trim() ?? "";

    if (!structuredNotes) {
      return NextResponse.json(
        { error: "Model returned empty notes" },
        { status: 500 }
      );
    }

    // The frontend expects `data.structuredNotes`
    return NextResponse.json(
      { structuredNotes, success: true },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error generating notes:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate notes" },
      { status: 500 }
    );
  }
}
