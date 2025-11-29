import { NextResponse } from "next/server";
import { Supadata } from "@supadata/js";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const supadata = new Supadata({
      apiKey: process.env.SUPADATA_API_KEY!,
    });

    // ✅ Using the exact code from the documentation
    const transcriptResult = await supadata.transcript({
      url,
      lang: "en", // optional, remove if you don't need
      text: true, // returns plain text instead of timestamp chunks
      mode: "auto", // auto detect method (native, auto, generate)
    });

    console.log("Transcript fetched:", transcriptResult);

    // ✅ Extract the content from Supadata response
    // Supadata returns: { lang, availableLangs, content } or { jobId }
    let transcriptText;

    if (typeof transcriptResult === "string") {
      transcriptText = transcriptResult;
    } else if ("content" in transcriptResult) {
      transcriptText = transcriptResult.content;
    } else {
      throw new Error("Unexpected response format from Supadata");
    }

    // ✅ Return the transcript to the client
    return NextResponse.json({
      transcript: transcriptText,
      success: true,
    });
  } catch (err: any) {
    console.error("Error fetching transcript:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
