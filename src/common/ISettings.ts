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

// export enum SubtitleType {
//   None = 'None',
//   SubtitleTranslate = 'Subtitle Translate',
//   SubtitleToPodcast = 'Subtitle to Podcast'
// }

export enum SubtitleType {
    None = "None",
    Translation = "Translation",
    Podcast = "Podcast",
}

export interface ITtsSettings {
  language: string;
  voiceName: string;
  voiceNameRobinson: string;
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
  isCommonKey: boolean;
  promptType: number;
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
  language: Language;
  autoTtsSpeak: boolean;
  autoGenerate: boolean;
  autoDownload: boolean;
  generateSubtitleType: SubtitleType;
}

export interface ILlmSettings {
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  userApiKey: string;
}

export interface IAbstractSettings {
  general: IGeneralSettings;
  summary: ISummarySettings;
  llm: ILlmSettings;
  tts: ITtsSettings;
} 