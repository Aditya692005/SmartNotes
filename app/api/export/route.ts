import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function POST(request: Request) {
  try {
    const { content, type, format } = await request.json()

    if (!content || !type) {
      return Response.json({ error: "Content and type are required" }, { status: 400 })
    }

    let doc: Document

    switch (type) {
      case "transcript":
        doc = createTranscriptDocument(content)
        break

      case "notes":
        doc = createNotesDocument(content)
        break

      case "mindmap":
        doc = createMindmapDocument(content)
        break

      default:
        return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    // Generate the DOCX buffer
    const buffer = await Packer.toBuffer(doc)

    // Return as downloadable file
    return new Response(buffer, {
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

function createTranscriptDocument(content: string): Document {
  const paragraphs = content.split('\n').map(line => {
    if (line.trim() === '') {
      return new Paragraph({ children: [new TextRun({ text: "" })] })
    }
    return new Paragraph({
      children: [new TextRun({ text: line.trim() })],
      spacing: { after: 200 }
    })
  })

  return new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "SMARTNOTES - TRANSCRIPT", bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, italics: true })],
          spacing: { after: 400 }
        }),
        ...paragraphs
      ]
    }]
  })
}

function createNotesDocument(content: string): Document {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  children.push(new Paragraph({
    children: [new TextRun({ text: "SMARTNOTES - STRUCTURED NOTES", bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 400 }
  }))

  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, italics: true })],
    spacing: { after: 400 }
  }))

  for (const line of lines) {
    if (line.trim() === '') {
      children.push(new Paragraph({ children: [new TextRun({ text: "" })] }))
      continue
    }

    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line.substring(2), bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 }
      }))
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line.substring(3), bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }))
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line.substring(4), bold: true, size: 20 })],
        heading: HeadingLevel.HEADING_3,
        spacing: { after: 200 }
      }))
    } else if (line.startsWith('- ')) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `• ${line.substring(2)}` })],
        spacing: { after: 100 }
      }))
    } else {
      children.push(new Paragraph({
        children: [new TextRun({ text: line.trim() })],
        spacing: { after: 100 }
      }))
    }
  }

  return new Document({
    sections: [{
      properties: {},
      children
    }]
  })
}

function createMindmapDocument(content: string): Document {
  let parsedContent
  try {
    parsedContent = JSON.parse(content)
  } catch {
    parsedContent = { central: "Main Topic", branches: [] }
  }

  const children: Paragraph[] = []

  children.push(new Paragraph({
    children: [new TextRun({ text: "SMARTNOTES - MINDMAP", bold: true, size: 32 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 400 }
  }))

  children.push(new Paragraph({
    children: [new TextRun({ text: `Generated: ${new Date().toLocaleString()}`, italics: true })],
    spacing: { after: 400 }
  }))

  // Central topic
  children.push(new Paragraph({
    children: [new TextRun({ text: parsedContent.central || "Main Topic", bold: true, size: 24 })],
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 300 }
  }))

  // Branches
  if (parsedContent.branches && Array.isArray(parsedContent.branches)) {
    for (const branch of parsedContent.branches) {
      children.push(new Paragraph({
        children: [new TextRun({ text: branch.title || "Untitled Branch", bold: true, size: 20 })],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 }
      }))

      if (branch.subtopics && Array.isArray(branch.subtopics)) {
        for (const subtopic of branch.subtopics) {
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${subtopic}` })],
            spacing: { after: 100 }
          }))
        }
      }
    }
  }

  return new Document({
    sections: [{
      properties: {},
      children
    }]
  })
}
