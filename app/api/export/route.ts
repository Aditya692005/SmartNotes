export async function POST(request: Request) {
  try {
    const { content, type, format } = await request.json()

    if (!content || !type) {
      return Response.json({ error: "Content and type are required" }, { status: 400 })
    }

    // In a real implementation, this would use a library like docx or pdfkit
    // to generate proper .docx files. For now, we'll return the content as text
    // that can be downloaded

    let formattedContent = ""

    switch (type) {
      case "transcript":
        formattedContent = `SMARTNOTES - TRANSCRIPT
Generated: ${new Date().toLocaleString()}

${content}`
        break

      case "notes":
        formattedContent = `SMARTNOTES - STRUCTURED NOTES
Generated: ${new Date().toLocaleString()}

${content}`
        break

      case "mindmap":
        formattedContent = `SMARTNOTES - MINDMAP
Generated: ${new Date().toLocaleString()}

${content}`
        break

      default:
        return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    // Return as downloadable file
    return new Response(formattedContent, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="smartnotes-${type}-${Date.now()}.docx"`,
      },
    })
  } catch (error) {
    console.error("Error exporting document:", error)
    return Response.json({ error: "Failed to export document" }, { status: 500 })
  }
}
