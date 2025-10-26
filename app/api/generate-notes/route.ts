import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return Response.json({ error: "Transcript is required" }, { status: 400 })
    }

    // Generate structured notes
    const { text: structuredNotes } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are an expert note-taker. Analyze the following transcript and create well-structured, comprehensive notes.

Format the notes with:
- A brief summary at the top
- Key points organized by topic
- Important details and examples
- Action items or takeaways (if applicable)

Use markdown formatting for headers, lists, and emphasis.

Transcript:
${transcript}`,
    })

    return Response.json({ structuredNotes })
  } catch (error) {
    console.error("Error generating notes:", error)
    return Response.json({ error: "Failed to generate notes" }, { status: 500 })
  }
}
