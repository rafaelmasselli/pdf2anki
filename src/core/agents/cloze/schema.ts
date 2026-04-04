import { z } from "zod";

export const clozeSchema = z.object({
  cards: z.array(
    z.object({
      text: z
        .string()
        .describe("A sentence with one or more cloze deletions using {{c1::word}} syntax — double curly braces required"),
    }),
  ),
});

export type ClozeSchemaOutput = z.infer<typeof clozeSchema>;
