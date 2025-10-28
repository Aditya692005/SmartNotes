import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const source = formData.get("source") as string

    if (!audioFile) {
      return Response.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    // Convert file to buffer for OpenAI API
    const buffer = await audioFile.arrayBuffer()
    const file = new File([buffer], audioFile.name, { type: audioFile.type })

    // Use OpenAI Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en", // You can make this configurable
      response_format: "text",
    })

    return Response.json({ transcript: transcription })
  } catch (error) {
    console.error("Error transcribing audio:", error)
    return Response.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
