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

    // Generate mindmap structure using OpenAI GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating mindmaps and visual knowledge organization. Your task is to analyze transcripts and create hierarchical mindmap structures that help users understand and remember the content.

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.

Return a JSON structure with:
- A central topic/theme (string) that captures the main subject
- Main branches (array of 3-5 key concepts) that represent major themes
- Sub-branches for each main branch (array of 2-4 supporting points) that provide details

Format as JSON:
{
  "central": "Main Topic",
  "branches": [
    {
      "title": "Key Concept 1",
      "subtopics": ["Detail 1", "Detail 2", "Detail 3"]
    },
    {
      "title": "Key Concept 2", 
      "subtopics": ["Detail 1", "Detail 2"]
    }
  ]
}

Make sure the mindmap is logical, well-organized, and captures the most important information from the transcript.`
        },
        {
          role: "user",
          content: `Please analyze the following transcript and create a mindmap structure:\n\n${transcript}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const mindmapData = completion.choices[0]?.message?.content || ""

    if (!mindmapData) {
      throw new Error("No response from OpenAI")
    }

    // Parse and validate the JSON response
    let parsedMindmap
    try {
      parsedMindmap = JSON.parse(mindmapData)
      
      // Validate the structure
      if (!parsedMindmap.central || !Array.isArray(parsedMindmap.branches)) {
        throw new Error("Invalid mindmap structure")
      }

      // Ensure all branches have required fields
      parsedMindmap.branches = parsedMindmap.branches.map((branch: any) => ({
        title: branch.title || "Untitled Branch",
        subtopics: Array.isArray(branch.subtopics) ? branch.subtopics : []
      }))
    } catch (parseError) {
      console.error("Error parsing mindmap JSON:", parseError)
      console.error("Raw response:", mindmapData)
      
      // Return a fallback mindmap structure
      parsedMindmap = {
        central: "Main Topic",
        branches: [
          {
            title: "Key Points",
            subtopics: ["Important concept 1", "Important concept 2", "Important concept 3"]
          },
          {
            title: "Details",
            subtopics: ["Supporting detail 1", "Supporting detail 2"]
          },
          {
            title: "Summary",
            subtopics: ["Main takeaway 1", "Main takeaway 2"]
          }
        ]
      }
    }

    return Response.json({ mindmapData: JSON.stringify(parsedMindmap) })
  } catch (error) {
    console.error("Error generating mindmap:", error)
    
    // Return a fallback mindmap structure on error
    const fallbackMindmap = {
      central: "Main Topic",
      branches: [
        {
          title: "Key Points",
          subtopics: ["Important concept 1", "Important concept 2", "Important concept 3"]
        },
        {
          title: "Details",
          subtopics: ["Supporting detail 1", "Supporting detail 2"]
        },
        {
          title: "Summary",
          subtopics: ["Main takeaway 1", "Main takeaway 2"]
        }
      ]
    }
    
    return Response.json({ mindmapData: JSON.stringify(fallbackMindmap) })
  }
}
