import { ChatVertexAI } from "@langchain/google-vertexai";

export function createLLM(): ChatVertexAI {
  if (!process.env.GOOGLE_VERTEX_PROJECT) {
    throw new Error(
      "GOOGLE_VERTEX_PROJECT is not set in environment variables",
    );
  }

  return new ChatVertexAI({
    model: "gemini-2.0-flash-001",
    location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
    temperature: 0.3,
  });
}
