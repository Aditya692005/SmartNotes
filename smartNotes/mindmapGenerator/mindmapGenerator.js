import fs from "fs";

// --- HELPERS ---

function sanitize(text) {
  return text
    .replace(/[(){}\[\]`*_\\\/]/g, "")
    .replace(/:/g, "")
    .replace(/"/g, "'")
    .trim();
}

function shorten(text) {
  const words = text.split(/\s+/);
  if (words.length <= 4) return text;
  return words.slice(0, 4).join(" ");
}

function cleanHeading(text) {
  return shorten(sanitize(text));
}

function getLevel(line) {
  return (line.match(/^#+/) || [""])[0].length;
}

// --- MAIN MINDMAP GENERATION ---
// ENSURES ONLY ONE ROOT NODE

function generateMindmap(notes) {
  const lines = notes.split("\n");
  let mindmap = "mindmap\n";

  // Find first H1 to use as root
  let root = null;

  const headings = [];

  for (let line of lines) {
    line = line.trim();

    if (!line.startsWith("#")) continue;

    const level = getLevel(line);
    let text = cleanHeading(line.replace(/^#+/, "").trim());

    headings.push({ level, text });

    if (level === 1 && !root) {
      root = text;
    }
  }

  if (!root) root = "Mindmap";

  // Add root node
  mindmap += `  "${root}"\n`;

  let lastLevel = 1;

  headings.forEach(h => {
    if (h.text === root) return;

    // indent relative to root
    const indent = "  ".repeat(h.level + 1);
    mindmap += `${indent}"${h.text}"\n`;

    lastLevel = h.level;
  });

  return mindmap;
}

// --- RUN SCRIPT ---

function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    console.log("Usage: node mindmapGenerator.js notes.md mindmap.mmd");
    return;
  }

  const notes = fs.readFileSync(inputFile, "utf8");
  const mindmapText = generateMindmap(notes);

  fs.writeFileSync(outputFile, mindmapText);
  console.log("Mindmap generated:", outputFile);
}

main();
