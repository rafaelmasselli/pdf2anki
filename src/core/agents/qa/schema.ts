import { z } from "zod";

export const qaSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe("The question for the front of the Anki card"),
      back: z.string().describe("The answer for the back of the Anki card"),
    }),
  ),
});

export type QASchemaOutput = z.infer<typeof qaSchema>;
