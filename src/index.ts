import "dotenv/config";
import { resolve, basename, extname } from "path";
import { existsSync } from "fs";
import { Pipeline } from "./core/pipeline/index.js";
import {
  RunPipelineDTOSchema,
  PipelineResultDTOSchema,
} from "./shared/models/index.js";
import type { PipelineResultDTO } from "./shared/models/index.js";

class CLI {
  private readonly args: string[];

  constructor() {
    this.args = process.argv.slice(2);
  }

  async run(): Promise<void> {
    const rawPdfPath = this.args[0];

    if (!rawPdfPath) {
      console.error("Usage: node src/index.ts <pdf-path> [deck-name]");
      console.error('Example: node src/index.ts ./study.pdf "My Study Deck"');
      process.exit(1);
    }

    const pdfPath = resolve(rawPdfPath);
    const deckName = this.args[1] ?? basename(rawPdfPath, extname(rawPdfPath));
    const outputPath = resolve(
      "output",
      `${deckName.replace(/\s+/g, "_")}.apkg`,
    );

    const input = RunPipelineDTOSchema.safeParse({
      pdfPath,
      deckName,
      outputPath,
    });

    if (!input.success) {
      console.error("Invalid input:");
      for (const issue of input.error.issues) {
        console.error(`  ${issue.path.join(".")}: ${issue.message}`);
      }
      process.exit(1);
    }

    if (!existsSync(input.data.pdfPath)) {
      console.error(`Error: File not found: ${input.data.pdfPath}`);
      process.exit(1);
    }

    if (!input.data.pdfPath.toLowerCase().endsWith(".pdf")) {
      console.error("Error: Input file must be a PDF");
      process.exit(1);
    }

    try {
      const pipeline = new Pipeline();
      const state = await pipeline.run(
        input.data.pdfPath,
        input.data.deckName,
        input.data.outputPath,
      );

      const result = PipelineResultDTOSchema.parse({
        totalPages: state.totalPages,
        totalChunks: state.chunks.length,
        qaCards: state.qaCards.length,
        clozeCards: state.clozeCards.length,
        outputPath: state.outputPath,
      } satisfies PipelineResultDTO);

      this.printResult(result);
    } catch (err) {
      console.error("\nPipeline failed:", err);
      process.exit(1);
    }
  }

  private printResult(result: PipelineResultDTO): void {
    console.log("\n=== Done! ===");
    console.log(`Pages processed : ${result.totalPages}`);
    console.log(`Chunks generated: ${result.totalChunks}`);
    console.log(`Q&A cards       : ${result.qaCards}`);
    console.log(`Cloze cards     : ${result.clozeCards}`);
    console.log(`Total cards     : ${result.qaCards + result.clozeCards}`);
    console.log(`Output file     : ${result.outputPath}`);
  }
}

new CLI().run();
