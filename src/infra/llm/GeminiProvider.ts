import { ChatVertexAI } from "@langchain/google-vertexai";
import type { ILLMProvider } from "../../core/ports/index.js";

export class GeminiProvider implements ILLMProvider {
  private readonly model: ChatVertexAI;

  constructor() {
    if (!process.env.GOOGLE_VERTEX_PROJECT) {
      throw new Error("GOOGLE_VERTEX_PROJECT is not set in environment variables");
    }

    this.model = new ChatVertexAI({
      model: "gemini-2.0-flash-001",
      location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
      temperature: 0.3,
    });
  }

  getModel(): ChatVertexAI {
    return this.model;
  }
}
