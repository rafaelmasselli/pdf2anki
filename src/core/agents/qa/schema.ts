import { z } from "zod";

export const qaSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("The question for the front of the Anki card"),
      back: z
        .string()
        .describe("The answer: 1–2 complete sentences, no bullet points, no filler"),
      hint: z
        .string()
        .optional()
        .describe(
          "Optional short hint (1–5 words) shown before revealing the answer — guides without giving it away. Omit if the question is already clear enough.",
        ),
    }),
  ),
});

export type QASchemaOutput = z.infer<typeof qaSchema>;
