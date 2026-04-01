import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createLLM(): ChatGoogleGenerativeAI {
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY is not set in environment variables");
  }

  return new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0.3,
  });
}
