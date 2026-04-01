import { z } from "zod";

export const QACardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const ClozeCardSchema = z.object({
  text: z.string(),
});

export const StudyContextSchema = z.object({
  language: z.string(),
  level: z.string(),
  goal: z.string(),
  additionalNotes: z.string(),
});

export const DocumentSummarySchema = z.object({
  language: z.string(),
  topic: z.string(),
  keyConcepts: z.string(),
  summary: z.string(),
});

export type QACard = z.infer<typeof QACardSchema>;
export type ClozeCard = z.infer<typeof ClozeCardSchema>;
export type StudyContext = z.infer<typeof StudyContextSchema>;
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>;
