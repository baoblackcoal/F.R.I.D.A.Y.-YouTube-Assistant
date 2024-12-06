export enum ApiType {
    Azure = "Azure",
    Chrome = "Chrome",
  }
  
// multi-language enum
export enum Language {
    English = 'en',
    SimplifiedChinese = 'zh_CN',
    TraditionalChinese = 'zh_TW',
    // French = 'French',
    // German = 'German',
    // Italian = 'Italian',
    // Portuguese = 'Portuguese',
    // Japanese = 'Japanese',
    // Korean = 'Korean',
    // Russian = 'Russian',
}

export enum GenerateSubtitleType {
    None = "None",
    EasyToRead = "EasyToRead",
    Podcast = "Podcast",
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
  syncLanguage: boolean;
}

export interface ISummarySettings {
  promptType: number;
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
  language: Language;
  autoTtsSpeak: boolean;
  autoSummary: boolean;
  generateSubtitleType: GenerateSubtitleType;
}

export interface ILlmSettings {
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  userApiKey: string;
  isCommonKey: boolean;
}

export interface IAbstractSettings {
  general: IGeneralSettings;
  summary: ISummarySettings;
  llm: ILlmSettings;
  tts: ITtsSettings;
} 