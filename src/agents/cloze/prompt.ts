import { ChatPromptTemplate } from "@langchain/core/prompts";

export const clozePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are an expert educator creating Anki cloze deletion flashcards from study material.
Given a text excerpt, generate cloze deletion cards using Anki's format: {{c1::hidden text}}.
Rules:
- Use {{c1::word}} for the first deletion, {{c2::word}} for the second, etc.
- Each card should test one key concept or fact
- The surrounding context must make the answer guessable
- Generate between 3 and 8 cards per chunk depending on content density
- Write in the same language as the source text
Example: "The capital of France is {{c1::Paris}}, which is located on the {{c2::Seine}} river."`,
  ],
  [
    "human",
    "Generate cloze deletion Anki cards from the following text:\n\n{text}",
  ],
]);
