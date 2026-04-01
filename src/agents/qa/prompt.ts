import { ChatPromptTemplate } from "@langchain/core/prompts";

export const qaPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert educator creating Anki flashcards from study material.
Given a text excerpt, generate clear and concise question-answer pairs.
Rules:
- Each question must be specific and unambiguous
- Answers should be concise but complete
- Focus on key concepts, definitions, and important facts
- Generate between 3 and 8 cards per chunk depending on content density
- Write in the same language as the source text`,
  ],
  ["human", "Generate Q&A Anki cards from the following text:\n\n{text}"],
]);
