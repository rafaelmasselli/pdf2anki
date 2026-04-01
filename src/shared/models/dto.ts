import { z } from "zod";
import { QACardSchema, ClozeCardSchema } from "./domain.js";

export const RunPipelineDTOSchema = z.object({
  pdfPath: z.string().min(1),
  deckName: z.string().min(1),
  outputPath: z.string().min(1),
});

export const PipelineResultDTOSchema = z.object({
  totalPages: z.number().int().nonnegative(),
  totalChunks: z.number().int().nonnegative(),
  qaCards: z.number().int().nonnegative(),
  clozeCards: z.number().int().nonnegative(),
  outputPath: z.string(),
});

export const SaveDeckDTOSchema = z.object({
  deckName: z.string().min(1),
  outputPath: z.string().min(1),
  qaCards: z.array(QACardSchema),
  clozeCards: z.array(ClozeCardSchema),
});

export const SaveDeckResultDTOSchema = z.object({
  savedPaths: z.array(z.string()),
});

export type RunPipelineDTO = z.infer<typeof RunPipelineDTOSchema>;
export type PipelineResultDTO = z.infer<typeof PipelineResultDTOSchema>;
export type SaveDeckDTO = z.infer<typeof SaveDeckDTOSchema>;
export type SaveDeckResultDTO = z.infer<typeof SaveDeckResultDTOSchema>;
