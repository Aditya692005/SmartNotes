import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { mmd } = await req.json();

    if (!mmd || typeof mmd !== "string") {
      return NextResponse.json({ error: "mmd is required" }, { status: 400 });
    }

    // Sanitize the incoming MMD so Kroki receives well-formed Mermaid.
    const sanitizedMmd = sanitizeMermaid(mmd);

    // ✅ Use Kroki's API to convert Mermaid to SVG. If Kroki errors due to
    // malformed MMD, we attempt an aggressive sanitize and retry, otherwise
    // return helpful debug information to the client.
    let response = await fetch("https://kroki.io/mermaid/svg", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: sanitizedMmd,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Kroki API error (sanitized):", errorText);

      // If Kroki complains about roots / indentation we try an aggressive
      // sanitize, resend to kroki and return the sanitized input if that fails
      if (isLikelyRootError(errorText)) {
        const aggressive = aggressiveSanitizeMermaid(mmd);
        if (aggressive !== sanitizedMmd) {
          const retryRes = await fetch("https://kroki.io/mermaid/svg", {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: aggressive,
          });

          if (retryRes.ok) {
            const svg = await retryRes.text();
            return new NextResponse(svg, {
              headers: { "Content-Type": "image/svg+xml" },
            });
          }

          const retryErr = await retryRes.text();
          console.error("Kroki API error (aggressive):", retryErr);
          return NextResponse.json(
            {
              error: `Kroki API failed: ${retryErr}`,
              reason: errorText,
              sanitizedMmd,
              aggressiveMmd: aggressive,
            },
            { status: 500 }
          );
        }
      }
      // Generic failure: include sanitized MMD for debugging
      return NextResponse.json(
        { error: `Kroki API failed: ${errorText}`, sanitizedMmd },
        { status: 500 }
      );
    }

    const svg = await response.text();

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("SVG error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

  // ------------------ HELPERS ---------------------

  function sanitizeMermaid(input: string): string {
    if (!input) return "mindmap\n  root((Main Topic))";
    const trimmed = input.trim();
    if (!trimmed.startsWith("mindmap")) {
      // Place the content under a simple mindmap root
      return `mindmap\n  ${trimmed}`;
    }
    return trimmed;
  }

  function aggressiveSanitizeMermaid(input: string): string {
    if (!input) return "mindmap\n  root((Main Topic))";
    const lines = input.split(/\r?\n/);
    // Ensure the mindmap header is present
    let headIdx = 0;
    while (headIdx < lines.length && lines[headIdx].trim() === "") headIdx++;
    if (!/^\s*mindmap\b/i.test(lines[headIdx] || "")) {
      lines.splice(headIdx, 0, "mindmap");
    }

    const rootRegex = /^\s*root\s*\(\(/i;
    const rootIndices: number[] = [];
    for (let i = 0; i < lines.length; i++) if (rootRegex.test(lines[i])) rootIndices.push(i);

    if (rootIndices.length > 1) {
      // Keep the first root; convert others to siblings beneath it.
      for (let k = 1; k < rootIndices.length; k++) {
        const idx = rootIndices[k];
        const labelMatch = lines[idx].match(/root\s*\(\(([^)]+)\)\)/i);
        const label = labelMatch ? labelMatch[1].trim() : `Node${k}`;
        lines[idx] = `  ${label}`;
        const end = rootIndices[k + 1] ?? lines.length;
        for (let j = idx + 1; j < end; j++) {
          if (lines[j].trim() !== "") lines[j] = `  ${lines[j]}`;
        }
      }
      return lines.join("\n");
    }

    if (rootIndices.length === 0) {
      // Insert a root after mindmap header and indent subsequent lines
      const headerIndex = headIdx;
      const rootLine = `  root((Main Topic))`;
      for (let i = headerIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() !== "") lines[i] = `  ${lines[i]}`;
      }
      lines.splice(headerIndex + 1, 0, rootLine);
      return lines.join("\n");
    }

    // Ensure nodes after root are indented at least two spaces
    const rootIdx = rootIndices[0];
    for (let i = rootIdx + 1; i < lines.length; i++) {
      if (lines[i].trim() !== "" && !/^\s/.test(lines[i])) {
        lines[i] = `  ${lines[i]}`;
      }
    }
    return lines.join("\n");
  }

  function isLikelyRootError(errorText: string) {
    const t = (errorText || "").toLowerCase();
    return (
      t.includes("there can be only one root") ||
      t.includes("no parent could be found") ||
      t.includes("no root") ||
      t.includes("no parent")
    );
  }
