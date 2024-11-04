export enum ApiType {
    Azure = "Azure",
    Chrome = "Chrome",
  }
  
// multi-language enum
export enum Language {
    English = 'English',
    Simplified_Chinese = 'Simplified Chinese',
    Traditional_Chinese = 'Traditional Chinese',
    // French = 'French',
    // German = 'German',
    // Italian = 'Italian',
    // Portuguese = 'Portuguese',
    // Japanese = 'Japanese',
    // Korean = 'Korean',
    // Russian = 'Russian',
}

export interface ITtsSettings {
  language: string;
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  apiType: ApiType;
}

export interface IGeneralSettings {
  language: Language;
  syncLanguageLlmAndTts: boolean;
}

export interface ISummarySettings {
  promptType: number;
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
  language: string;
  autoTtsSpeak: boolean;
  autoSummary: boolean;
}

export interface ILlmSettings {
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  apiKey: string;
}

export interface IAbstractSettings {
  general: IGeneralSettings;
  summary: ISummarySettings;
  llm: ILlmSettings;
  tts: ITtsSettings;
} 