import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

// Optional: Use a temporary uploads directory
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, `${Date.now()}-${file.name}`);
    fs.writeFileSync(filePath, buffer);

    const whisperProcess = spawn("faster-whisper", [
      filePath,
      "--language",
      "en",
      "--model",
      "base.en",
    ]);

    let output = "";
    whisperProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      whisperProcess.on("close", resolve);
    });

    fs.unlinkSync(filePath);

    if (exitCode !== 0) {
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ text: output });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
