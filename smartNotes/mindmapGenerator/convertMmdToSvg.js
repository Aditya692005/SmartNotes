#!/usr/bin/env node

// convertMmdToSvg.js
// Usage: node convertMmdToSvg.js input.mmd output.svg

import { spawnSync } from "child_process";
import path from "path";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node convertMmdToSvg.js <input.mmd> <output.svg>");
  process.exit(1);
}

const input = path.resolve(args[0]);
const output = path.resolve(args[1]);

console.log(`Converting ${input} -> ${output} using mermaid-cli (mmdc)...`);

// Use npx to avoid requiring a global install. This will invoke the mermaid-cli binary.
const cmd = "npx";
const cmdArgs = ["@mermaid-js/mermaid-cli", "-i", input, "-o", output];

const res = spawnSync(cmd, cmdArgs, { stdio: "inherit" });

if (res.error) {
  console.error("Error running mermaid-cli:", res.error);
  process.exit(1);
}

if (res.status !== 0) {
  console.error("mermaid-cli returned non-zero exit code:", res.status);
  process.exit(res.status || 1);
}

console.log("Conversion complete:", output);
