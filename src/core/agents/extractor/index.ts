import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { IAgent } from "../../ports/index.js";
import type { GraphState } from "../../../shared/models/index.js";

interface ExtractorConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkLength?: number;
}

export class ExtractorAgent implements IAgent {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly minChunkLength: number;

  constructor(config: ExtractorConfig = {}) {
    this.chunkSize = config.chunkSize ?? 2000;
    this.chunkOverlap = config.chunkOverlap ?? 200;
    this.minChunkLength = config.minChunkLength ?? 50;
  }

  async run(state: GraphState): Promise<Partial<GraphState>> {
    console.log(`\n[ExtractorAgent] Loading PDF: ${state.pdfPath}`);

    const docs = await this.loadPDF(state.pdfPath);
    const totalPages = docs.length;
    console.log(`[ExtractorAgent] Loaded ${totalPages} page(s)`);

    const chunks = await this.splitIntoChunks(docs);
    console.log(`[ExtractorAgent] Split into ${chunks.length} chunk(s)`);

    return { chunks, totalPages };
  }

  private async loadPDF(pdfPath: string) {
    const loader = new PDFLoader(pdfPath);
    return loader.load();
  }

  private async splitIntoChunks(docs: Awaited<ReturnType<PDFLoader["load"]>>) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    return splitDocs
      .map((doc) => doc.pageContent.trim())
      .filter((chunk) => chunk.length > this.minChunkLength);
  }
}
