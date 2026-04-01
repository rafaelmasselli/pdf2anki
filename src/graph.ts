import { StateGraph, END, START } from "@langchain/langgraph";
import { Annotation } from "@langchain/langgraph";
import {
  extractorAgent,
  qaAgent,
  clozeAgent,
  exporterAgent,
} from "./agents/index.js";
import type { GraphState, QACard, ClozeCard } from "./types/state.js";

const PipelineState = Annotation.Root({
  pdfPath: Annotation<string>(),
  deckName: Annotation<string>(),
  chunks: Annotation<string[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),
  totalPages: Annotation<number>({
    default: () => 0,
    reducer: (_, next) => next,
  }),
  qaCards: Annotation<QACard[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),
  clozeCards: Annotation<ClozeCard[]>({
    default: () => [],
    reducer: (_, next) => next,
  }),
  outputPath: Annotation<string>(),
  error: Annotation<string | undefined>({
    default: () => undefined,
    reducer: (_, next) => next,
  }),
});

type PipelineStateType = typeof PipelineState.State;

async function extractorNode(
  state: PipelineStateType,
): Promise<Partial<PipelineStateType>> {
  return extractorAgent(state as GraphState);
}

async function qaNode(
  state: PipelineStateType,
): Promise<Partial<PipelineStateType>> {
  return qaAgent(state as GraphState);
}

async function clozeNode(
  state: PipelineStateType,
): Promise<Partial<PipelineStateType>> {
  return clozeAgent(state as GraphState);
}

async function cardGenerationNode(
  state: PipelineStateType,
): Promise<Partial<PipelineStateType>> {
  console.log("\n[Pipeline] Running QA and Cloze agents in parallel...");
  const [qaResult, clozeResult] = await Promise.all([
    qaNode(state),
    clozeNode(state),
  ]);
  return {
    qaCards: qaResult.qaCards ?? [],
    clozeCards: clozeResult.clozeCards ?? [],
  };
}

async function exporterNode(
  state: PipelineStateType,
): Promise<Partial<PipelineStateType>> {
  return exporterAgent(state as GraphState);
}

function afterExtractor(state: PipelineStateType): string {
  if (!state.chunks || state.chunks.length === 0) {
    console.error("[Pipeline] No content extracted from PDF. Aborting.");
    return "end";
  }
  return "generate";
}

export function buildGraph() {
  const graph = new StateGraph(PipelineState)
    .addNode("extractor", extractorNode)
    .addNode("cardGeneration", cardGenerationNode)
    .addNode("exporter", exporterNode)
    .addEdge(START, "extractor")
    .addConditionalEdges("extractor", afterExtractor, {
      generate: "cardGeneration",
      end: END,
    })
    .addEdge("cardGeneration", "exporter")
    .addEdge("exporter", END);
  return graph.compile();
}

export async function runPipeline(
  pdfPath: string,
  deckName: string,
  outputPath: string,
): Promise<GraphState> {
  const app = buildGraph();

  const initialState: Partial<PipelineStateType> = {
    pdfPath,
    deckName,
    outputPath,
    chunks: [],
    qaCards: [],
    clozeCards: [],
  };

  console.log("\n=== PDF to Anki Pipeline ===");
  console.log(`PDF:    ${pdfPath}`);
  console.log(`Deck:   ${deckName}`);
  console.log(`Output: ${outputPath}`);

  const result = await app.invoke(initialState);
  return result as GraphState;
}
