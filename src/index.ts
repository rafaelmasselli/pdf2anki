import "dotenv/config";
import { resolve, basename, extname } from "path";
import { existsSync } from "fs";
import { Pipeline } from "./graph.js";

class CLI {
  private readonly args: string[];

  constructor() {
    this.args = process.argv.slice(2);
  }

  async run(): Promise<void> {
    this.validateArgs();

    const pdfPath = resolve(this.args[0]);
    const deckName = this.args[1] ?? basename(pdfPath, extname(pdfPath));
    const outputPath = resolve(
      "output",
      `${deckName.replace(/\s+/g, "_")}.apkg`,
    );

    this.validateFile(pdfPath);

    try {
      const pipeline = new Pipeline();
      const result = await pipeline.run(pdfPath, deckName, outputPath);

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

  private validateArgs(): void {
    if (this.args.length < 1) {
      console.error("Usage: node src/index.ts <pdf-path> [deck-name]");
      console.error('Example: node src/index.ts ./study.pdf "My Study Deck"');
      process.exit(1);
    }
  }

  private validateFile(pdfPath: string): void {
    if (!existsSync(pdfPath)) {
      console.error(`Error: File not found: ${pdfPath}`);
      process.exit(1);
    }

    if (!pdfPath.toLowerCase().endsWith(".pdf")) {
      console.error("Error: Input file must be a PDF");
      process.exit(1);
    }
  }
}

new CLI().run();
