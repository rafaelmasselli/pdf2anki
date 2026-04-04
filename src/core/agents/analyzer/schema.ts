import { z } from "zod";

export const analyzerSchema = z.object({
  language: z.string().describe("The primary language of the document (e.g. English, Portuguese)"),
  topic: z.string().describe("The main subject or topic of the document in one sentence"),
  keyConcepts: z
    .string()
    .describe(
      "A comma-separated list of the most important concepts, terms, or vocabulary found in the document",
    ),
  summary: z
    .string()
    .describe(
      "A comprehensive paragraph summarizing the full content of the document, preserving all important details",
    ),
  modules: z
    .array(z.string())
    .describe(
      "An ordered list of the main modules, chapters, or thematic sections found in the document. Each entry should be a short, descriptive title (e.g. 'Introduction to OOP', 'Design Patterns'). Return between 3 and 10 items depending on document length.",
    ),
});

export type AnalyzerSchemaOutput = z.infer<typeof analyzerSchema>;
