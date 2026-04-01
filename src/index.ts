import "dotenv/config";
import { resolve, basename, extname } from "path";
import { existsSync } from "fs";
import { runPipeline } from "./graph.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error("Usage: node src/index.ts <pdf-path> [deck-name]");
    console.error('Example: node src/index.ts ./study.pdf "My Study Deck"');
    process.exit(1);
  }

  const pdfPath = resolve(args[0]);
  const deckName = args[1] ?? basename(pdfPath, extname(pdfPath));
  const outputPath = resolve("output", `${deckName.replace(/\s+/g, "_")}.apkg`);

  if (!existsSync(pdfPath)) {
    console.error(`Error: File not found: ${pdfPath}`);
    process.exit(1);
  }

  if (!pdfPath.toLowerCase().endsWith(".pdf")) {
    console.error("Error: Input file must be a PDF");
    process.exit(1);
  }

  try {
    const result = await runPipeline(pdfPath, deckName, outputPath);

    console.log("\n=== Done! ===");
    console.log(`Pages processed : ${result.totalPages}`);
    console.log(`Chunks generated: ${result.chunks.length}`);
    console.log(`Q&A cards       : ${result.qaCards.length}`);
    console.log(`Cloze cards     : ${result.clozeCards.length}`);
    console.log(
      `Total cards     : ${result.qaCards.length + result.clozeCards.length}`,
    );
    console.log(`Output file     : ${result.outputPath}`);
  } catch (err) {
    console.error("\nPipeline failed:", err);
    process.exit(1);
  }
}

main();
