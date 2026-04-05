import { z } from "zod";
import {
  QACardSchema,
  ClozeCardSchema,
  StudyContextSchema,
  DocumentSummarySchema,
} from "./domain.js";

export const GraphStateSchema = z.object({
  pdfPath: z.string(),
  deckName: z.string(),
  studyContext: StudyContextSchema,
  documentSummary: DocumentSummarySchema,
  chunks: z.array(z.string()),
  totalPages: z.number(),
  qaCards: z.array(QACardSchema),
  clozeCards: z.array(ClozeCardSchema),
  outputPath: z.string(),
  outputPaths: z.array(z.string()),
  error: z.string().optional(),
});

export type GraphState = z.infer<typeof GraphStateSchema>;
