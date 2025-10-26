import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return Response.json({ error: "Transcript is required" }, { status: 400 })
    }

    // Generate mindmap structure
    const { text: mindmapData } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are an expert at creating mindmaps. Analyze the following transcript and create a hierarchical mindmap structure.

Return a JSON structure with:
- A central topic/theme
- Main branches (3-5 key concepts)
- Sub-branches for each main branch (2-4 supporting points)

Format as JSON:
{
  "central": "Main Topic",
  "branches": [
    {
      "title": "Key Concept 1",
      "subtopics": ["Detail 1", "Detail 2"]
    }
  ]
}

Transcript:
${transcript}`,
    })

    return Response.json({ mindmapData })
  } catch (error) {
    console.error("Error generating mindmap:", error)
    return Response.json({ error: "Failed to generate mindmap" }, { status: 500 })
  }
}
