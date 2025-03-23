import { GoogleGenerativeAI, GenerativeModel, ChatSession } from "@google/generative-ai";

let gemini_api_key: string | null = null;
let googleAI: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

export interface GeminiAPI {
  setKey: (key: string) => Promise<void>;
  sayHelloByGemini: () => Promise<string>;
  generate: (prompt: string) => Promise<string>;
  streamGenerate: (prompt: string, callback: (text: string) => Promise<void>) => Promise<void>;
  chat: (prompt: string, isFirstConversation: boolean) => Promise<string>;
  countTokens: (prompt: string) => Promise<number>;
  testApiKey: (key: string) => Promise<boolean>;
}

export const setKey = async (key: string): Promise<void> => {
  gemini_api_key = key;
  
  googleAI = new GoogleGenerativeAI(gemini_api_key);

  const geminiConfig = {
    temperature: 0,
    topP: 1,
    topK: 1,
    maxOutputTokens: 8192,
  };

  geminiModel = googleAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // model: "gemini-2.0-flash-exp",
    // model: "gemini-1.5-flash-002",
    // model: "gemini-1.5-flash",
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
    console.log("Response error:", error);
    return "An error occurred";
  }
};

export const testApiKey = async (key: string): Promise<boolean> => {
  await setKey(key);
  if (!geminiModel) throw new Error("Gemini model not initialized");
  const result = await geminiModel.generateContent("hello");
  //check if the response is 200 indicates the api key is valid, otherwise the api key is invalid
  const response = result.response.text();
  return response.length > 0;
}

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
export const streamGenerate = async (prompt: string, callback: (text: string) => Promise<void>): Promise<void> => {
  let text: string;
  try {
    if (!geminiModel) throw new Error("Gemini model not initialized");
    
    const result = await geminiModel.generateContentStream(prompt);
    for await (const chunk of result.stream) {
        console.log(chunk.text());
        await callback(chunk.text());
    }
  } catch (error) {
    console.log("Response error:", error);
    callback("Error: " + error);
  }
}

let chatSession: ChatSession | null = null;
export const chat = async (prompt: string, isFirstConversation: boolean): Promise<string> => {
  let text: string;
  try {
    if (!geminiModel) throw new Error("Gemini model not initialized");
    if (isFirstConversation) {
      chatSession = geminiModel.startChat();
    }
    if (!chatSession) throw new Error("Chat session not initialized");
    const result = await chatSession.sendMessage(prompt);
    text = result.response.text();
  } catch (error) {
    text = "Error: " + error;
  }
  return text;
}

export const countTokens = async (prompt: string): Promise<number> => {
  if (!geminiModel) throw new Error("Gemini model not initialized");
  const result = await geminiModel.countTokens(prompt);
  return result.totalTokens;
}

export const geminiAPI: GeminiAPI = {
  setKey,
  sayHelloByGemini,
  generate,
  streamGenerate,
  chat,
  countTokens,
  testApiKey,
};
