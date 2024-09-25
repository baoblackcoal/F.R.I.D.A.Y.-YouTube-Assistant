import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let gemini_api_key: string | null = null;
let googleAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

export interface GeminiAPI {
  setKey: (key: string) => Promise<void>;
  sayHelloByGemini: () => Promise<string>;
  generate: (prompt: string) => Promise<string>;
  streamGenerate: (prompt: string, callback: (text: string) => void) => Promise<void>;
}

export const setKey = async (key: string): Promise<void> => {
  gemini_api_key = key;
  
  googleAI = new GoogleGenerativeAI(gemini_api_key);

  const geminiConfig = {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 8192,
  };

  geminiModel = googleAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: geminiConfig,
  });
}

export const sayHelloByGemini = async (): Promise<string> => {
  try {
    const prompt = "hello";
    if (!geminiModel) throw new Error("Gemini model not initialized");
    console.log('Before generating content');
    const result = await geminiModel.generateContent(prompt);
    console.log('After generating content');
    const response = result.response.text();
    console.log(response);
    return response;
  } catch (error) {
    console.error("Response error:", error);
    return "An error occurred";
  }
};

export const generate = async (prompt: string): Promise<string> => {
  let text: string;
  try {
    if (!geminiModel) throw new Error("Gemini model not initialized");
    const result = await geminiModel.generateContent(prompt);
    text = result.response.text();
  } catch (error) {
    if (error instanceof Error) {
      text = error.message;
    } else {
      text = "An unknown error occurred";
    }
    console.log("Response error:", text);
  }
  return text;
}

//stream the response from the gemini model
export const streamGenerate = async (prompt: string, callback: (text: string) => void): Promise<void> => {
  let text: string;
  try {
    if (!geminiModel) throw new Error("Gemini model not initialized");

    const result = await geminiModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
        console.log(chunk.text());
        callback(chunk.text());
    }
  } catch (error) {
    console.error("Response error:", error);
  }
}

export const geminiAPI: GeminiAPI = {
  setKey,
  sayHelloByGemini,
  generate,
  streamGenerate
};
