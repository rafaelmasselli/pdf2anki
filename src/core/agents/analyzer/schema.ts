import { z } from "zod";

export const analyzerSchema = z.object({
  language: z
    .string()
    .describe(
      "The primary language of the document (e.g. English, Portuguese)",
    ),
  topic: z
    .string()
    .describe("The main subject or topic of the document in one sentence"),
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
});

export type AnalyzerSchemaOutput = z.infer<typeof analyzerSchema>;
