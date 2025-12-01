import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
  console.error("GROQ_API_KEY is not set. Mindmap generation will fail.");
}
const groq = new Groq({
  apiKey: groqApiKey!,
});

export async function POST(req: Request) {
  try {
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "Server misconfigured: GROQ_API_KEY is missing" },
        { status: 500 }
      );
    }
    const { notes } = await req.json();
    console.log(
      "generate-mindmap received notes length:",
      typeof notes === "string" ? notes.length : notes
    );

    if (!notes) {
      return NextResponse.json(
        { error: "Notes are required" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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

Rules:
- Begin the diagram with the line: mindmap
- Use a single root line immediately after, like: root((Main Topic))
- Nest branches using two-space indentation under the root
- If multiple top-level items appear, nest them under the single root
- Do not include any Markdown or code fences, return only the mermaid diagram

Return ONLY the Mermaid mindmap code starting with 'mindmap' and a single 'root((...))' line. No extra text, no commentary, no code blocks.`,
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
    console.log("Generated Mermaid mindmap length:", mindmapCode.length);
    console.log("Mindmap preview:", mindmapCode.slice(0, 200));

    return NextResponse.json({ mindmap: mindmapCode.trim(), success: true });
  } catch (err: any) {
    console.error("Error generating mindmap:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate mindmap" },
      { status: 500 }
    );
  }
}
