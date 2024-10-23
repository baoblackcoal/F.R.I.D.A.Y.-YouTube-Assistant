import { Env } from "./common";

export enum ApiType {
  Azure = "Azure",
  Chrome = "Chrome",
}

// Define the TTS settings interface
export interface TtsSettings {
  language: string;
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  apiType: ApiType;
}

// Default TTS settings
export const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
export const pitchOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
export const defaultTtsSettings: TtsSettings = {
  language: '',
  voiceName: '',
  rate: 1.0, //only set to speedOptions
  pitch: 1.0, //only set to pitchOptions
  volume: 1.0,
  apiType: ApiType.Azure,
};



// multi-language enum
export enum Language {
  English = 'English',
  Simplified_Chinese = 'Simplified Chinese',
  Traditional_Chinese = 'Traditional Chinese',
  French = 'French',
  German = 'German',
  Italian = 'Italian',
  Portuguese = 'Portuguese',
  Japanese = 'Japanese',
  Korean = 'Korean',
  Russian = 'Russian',
}

export interface SummarySettings {
  promptType: number; // 0: default, 1: diy1, 2: diy2, 3: diy3
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
  language: string;
  autoTtsSpeak: boolean; // After the YouTube video page loads, pause the video. Let TTS speak the summary, then resume the video once it's done.
  autoSummary: boolean; // After the YouTube video page loads, pause the video. Let TTS speak the summary, then resume the video once it's done.
}

export const defaultSummarySettings: SummarySettings = {
  promptType: 0,
  diyPromptText1: "Summarize the video titled '{videoTitle}' with the following transcript in {language}  :\n\n{textTranscript}",
  diyPromptText2: "Create a bullet-point summary of the key points from this video in {language}:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
  diyPromptText3: "Analyze the main themes and ideas in this video in {language}:\n\n{videoTitle}\n\n{textTranscript}",
  language: Language.English.toString(),
  autoTtsSpeak: false,
  autoSummary: true,
};  


export interface LlmSettings {
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  apiKey: string;
}

export const defaultLlmModel: LlmSettings = {
  modelName: "gemini-1.5-flash",
  maxTokens: 4096,
  temperature: 0,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  apiKey: "",
};


// Abstract interface for settings
export interface AbstractSettings {
  summary: SummarySettings;
  llm: LlmSettings;
  tts: TtsSettings;
}

export const defaultSettings: AbstractSettings = {
  summary: defaultSummarySettings,
  llm: defaultLlmModel,
  tts: defaultTtsSettings,
};

// change settings for testing, must update extension in chrome://extensions after change, or it will not take effect!!!
export const testSettings: AbstractSettings = {
  summary: {
    ...defaultSummarySettings,
    promptType: 0,
    diyPromptText1: "hi",
    diyPromptText2: "hi",
    diyPromptText3: "hello",
    language: Language.Simplified_Chinese.toString(),
    autoTtsSpeak: false,
    autoSummary: true,
  },
  llm: {
    ...defaultLlmModel,
    apiKey: "test-api-key",
  },
  tts: {
    ...defaultTtsSettings,
    rate: 1,
    apiType: ApiType.Azure,
  },
};

export enum InitialSettingsType {
  TEST = "test",
  DEFAULT = "default",
} 

export function getInitSettings(settingsType: InitialSettingsType): AbstractSettings {
  return settingsType === InitialSettingsType.DEFAULT ? defaultSettings : testSettings;
}


