import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Use the API key from the environment variable
const gemini_api_key = process.env.GEMINI_API_KEY;

const googleAI = new GoogleGenerativeAI(gemini_api_key);

// Set proxy configuration
const geminiConfig = {
  temperature: 0.9,
  topP: 1,
  topK: 1,
  maxOutputTokens: 8192,
};

const geminiModel = googleAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  geminiConfig,
});

export const sayHelloByGemini = async () => {
  try {
    console.log("Say hello to the world.");
    const prompt = "Tell me about google.";
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    console.log(response.text());
  } catch (error) {
    console.log("Response error:", error);
  }
};
 
// generate();









