import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import type { GraphState } from "../../types/state.js";

const CHUNK_SIZE = 2000;
const CHUNK_OVERLAP = 200;
const MIN_CHUNK_LENGTH = 50;

export async function extractorAgent(
  state: GraphState,
): Promise<Partial<GraphState>> {
  console.log(`\n[ExtractorAgent] Loading PDF: ${state.pdfPath}`);

  const loader = new PDFLoader(state.pdfPath);
  const docs = await loader.load();

  const totalPages = docs.length;
  console.log(`[ExtractorAgent] Loaded ${totalPages} page(s)`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const splitDocs = await splitter.splitDocuments(docs);
  const chunks = splitDocs
    .map((doc) => doc.pageContent.trim())
    .filter((c) => c.length > MIN_CHUNK_LENGTH);

  console.log(`[ExtractorAgent] Split into ${chunks.length} chunk(s)`);

  return { chunks, totalPages };
}
