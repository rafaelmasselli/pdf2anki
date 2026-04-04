import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { IAgent } from "../../ports/index.js";
import type { GraphState } from "../../../shared/models/index.js";

interface ExtractorConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkLength?: number;
  skipFirstPages?: number;
}

export class ExtractorAgent implements IAgent {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly minChunkLength: number;
  private readonly skipFirstPages: number;

  constructor(config: ExtractorConfig = {}) {
    this.chunkSize = config.chunkSize ?? 2000;
    this.chunkOverlap = config.chunkOverlap ?? 200;
    this.minChunkLength = config.minChunkLength ?? 50;
    this.skipFirstPages = config.skipFirstPages ?? 5;
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

    const contentDocs = docs.filter((doc) => {
      const page = doc.metadata?.["loc"]?.["pageNumber"] ?? doc.metadata?.["page"] ?? 0;
      return page >= this.skipFirstPages;
    });

    const splitDocs = await splitter.splitDocuments(contentDocs);

    return splitDocs
      .filter((doc) => doc.pageContent.trim().length > this.minChunkLength)
      .map((doc) => {
        const page = doc.metadata?.["loc"]?.["pageNumber"] ?? doc.metadata?.["page"] ?? null;
        const header = page !== null ? `[Page ${page}]\n` : "";
        return `${header}${doc.pageContent.trim()}`;
      });
  }
}
