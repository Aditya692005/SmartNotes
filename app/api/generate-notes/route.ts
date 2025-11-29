import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { notes } = await req.json();

    if (!notes) {
      return NextResponse.json(
        { error: "Notes are required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Free and fast model
      messages: [
        {
          role: "system",
          content: `You are an expert at creating mindmaps. Convert structured notes into Mermaid mindmap syntax.

Rules:
- Use "mindmap" as the diagram type
- Use the root node as the main topic
- Create branches for main sections
- Add sub-branches for details
- Keep node text concise (2-5 words max)
- Use proper indentation
- Remove any markdown symbols from the notes

Example format:
mindmap
  root((Main Topic))
    Section 1
      Detail A
      Detail B
    Section 2
      Detail C
      Detail D

Return ONLY the Mermaid mindmap code, no explanation or markdown code blocks.`,
        },
        {
          role: "user",
          content: `Convert these structured notes into a Mermaid mindmap:\n\n${notes}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    const mindmapCode = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      mindmap: mindmapCode.trim(),
      success: true,
    });
  } catch (err: any) {
    console.error("Error generating mindmap:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate mindmap" },
      { status: 500 }
    );
  }
}
