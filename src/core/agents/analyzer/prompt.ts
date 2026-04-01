import { ChatPromptTemplate } from "@langchain/core/prompts";

export const analyzerPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a document analyst. Your job is to read a full document and extract structured metadata about it.
You will identify the document's language, main topic, key concepts, and produce a comprehensive summary.
Be thorough — do not omit important information. The summary will be used to give context to another AI generating study flashcards.`,
  ],
  [
    "human",
    `Analyze the following document and extract its metadata:\n\n{fullText}`,
  ],
]);
