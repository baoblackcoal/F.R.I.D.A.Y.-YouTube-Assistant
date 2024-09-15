import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let gemini_api_key: string | null = null;
let googleAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

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

export const sayHelloByGemini = async (): Promise<string | undefined> => {
  try {
    const prompt = "Tell me about google.";
    if (!geminiModel) throw new Error("Gemini model not initialized");
    const result = await geminiModel.generateContent(prompt);
    const response = result.response.text();
    console.log(response);
    return response; // Return the response
  } catch (error) {
    console.error("Response error:", error);
    return undefined; // Ensure a value is always returned
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