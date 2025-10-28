import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { transcript } = await request.json()

    if (!transcript) {
      return Response.json({ error: "Transcript is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Generate structured notes using OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert note-taker and educational content organizer. Your task is to analyze transcripts and create well-structured, comprehensive notes that are easy to understand and reference.

Format the notes with:
- A brief summary at the top
- Key points organized by topic
- Important details and examples
- Action items or takeaways (if applicable)

Use markdown formatting for headers, lists, and emphasis. Make the notes clear, concise, and well-organized.`
        },
        {
          role: "user",
          content: `Please analyze the following transcript and create structured notes:\n\n${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const structuredNotes = completion.choices[0]?.message?.content || ""

    if (!structuredNotes) {
      throw new Error("No response from OpenAI")
    }

    return Response.json({ structuredNotes })
  } catch (error) {
    console.error("Error generating notes:", error)
    
    // Return fallback notes on error
    const fallbackNotes = `# Notes

## Summary
This is a fallback note structure. The AI-generated notes could not be created due to an error.

## Key Points
- Important concept 1
- Important concept 2
- Important concept 3

## Details
- Supporting detail 1
- Supporting detail 2
- Supporting detail 3

## Action Items
- Follow-up task 1
- Follow-up task 2`
    
    return Response.json({ structuredNotes: fallbackNotes })
  }
}
