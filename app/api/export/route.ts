import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Buffer } from "buffer";

export async function POST(request: Request) {
  try {
    const { content, type, format } = await request.json();

    if (!content || !type) {
      return NextResponse.json(
        { error: "Content and type are required" },
        { status: 400 }
      );
    }

    // Create title based on type
    let title = "";
    switch (type) {
      case "transcript":
        title = "SMARTNOTES - TRANSCRIPT";
        break;
      case "notes":
        title = "SMARTNOTES - STRUCTURED NOTES";
        break;
      case "mindmap":
        title = "SMARTNOTES - MINDMAP";
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // Parse content into paragraphs for better formatting
    const contentText =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);
    const contentLines = contentText.split("\n").filter((line) => line.trim());

    // Create document with proper structure
    const doc = new Document({
      sections: [
        {
          children: [
            // Title
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            // Generated date
            new Paragraph({
              text: `Generated: ${new Date().toLocaleString()}`,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: `Generated: ${new Date().toLocaleString()}`,
                  italics: true,
                  size: 20,
                }),
              ],
            }),
            // Content
            ...contentLines.map(
              (line) =>
                new Paragraph({
                  text: line,
                  spacing: { line: 360, lineRule: "auto" },
                })
            ),
          ],
        },
      ],
    });

    if (format === "txt") {
      const textData = contentText;
      return new NextResponse(textData, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": `attachment; filename="smartnotes-${type}-${Date.now()}.txt"`,
        },
      });
    }

    // PDF export isn't supported - clients should only request DOCX or TXT

    // Default: DOCX
    const buffer = await Packer.toBuffer(doc);
    const bytes = Buffer.from(buffer);
    // Return as downloadable file
    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="smartnotes-${type}-${Date.now()}.docx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting document:", error);
    return NextResponse.json(
      { error: "Failed to export document" },
      { status: 500 }
    );
  }
}
