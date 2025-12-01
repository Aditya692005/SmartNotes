import { NextResponse } from "next/server";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "child_process";

export async function POST(req: Request) {
  try {
    const { mmd } = await req.json();

    if (!mmd || typeof mmd !== "string") {
      return NextResponse.json({ error: "`mmd` (mermaid code) is required" }, { status: 400 });
    }

    // Create a temp directory to store input/output files
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mmd-"));
    const inputPath = path.join(tmpDir, "input.mmd");
    const outputPath = path.join(tmpDir, "output.svg");

    fs.writeFileSync(inputPath, mmd, "utf8");

    // Try to run local mmdc (mermaid-cli). Use npx fallback if not available.
    let bin: string;
    const isWindows = process.platform === "win32";
    
    if (isWindows) {
      bin = path.join(process.cwd(), "node_modules", ".bin", "mmdc.cmd");
    } else {
      bin = path.join(process.cwd(), "node_modules", ".bin", "mmdc");
    }
    
    let res;

    console.log("Platform:", process.platform);
    console.log("Looking for mmdc at:", bin);
    console.log("Binary exists:", fs.existsSync(bin));

    if (fs.existsSync(bin)) {
      console.log("Using local mmdc binary");
      res = spawnSync(bin, ["-i", inputPath, "-o", outputPath], { encoding: "utf8", shell: true });
    } else {
      // Use npx to run the installed package or fetch it
      console.log("Using npx to run mermaid-cli");
      res = spawnSync("npx", ["@mermaid-js/mermaid-cli", "-i", inputPath, "-o", outputPath], { encoding: "utf8", shell: true });
    }

    if (res.error) {
      console.error("Error running mermaid-cli:", res.error);
      cleanup(tmpDir);
      return NextResponse.json({ error: "Failed to run mermaid renderer: " + res.error.message }, { status: 500 });
    }

    if (res.status !== 0) {
      console.error("mermaid-cli exit:", res.status, "stdout:", res.stdout, "stderr:", res.stderr);
      cleanup(tmpDir);
      return NextResponse.json({ error: "mermaid-cli failed: " + (res.stderr || res.stdout) }, { status: 500 });
    }

    if (!fs.existsSync(outputPath)) {
      cleanup(tmpDir);
      return NextResponse.json({ error: "Renderer did not produce an SVG" }, { status: 500 });
    }

    const svg = fs.readFileSync(outputPath, "utf8");

    // Clean up temp files
    cleanup(tmpDir);

    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch (err: any) {
    console.error("Error converting mmd to svg:", err);
    return NextResponse.json({ error: err.message || "Failed to convert mmd" }, { status: 500 });
  }
}

function cleanup(tmpDir: string) {
  try {
    const files = fs.readdirSync(tmpDir);
    for (const f of files) {
      try {
        fs.unlinkSync(path.join(tmpDir, f));
      } catch {}
    }
    fs.rmdirSync(tmpDir);
  } catch (e) {
    // ignore
  }
}
