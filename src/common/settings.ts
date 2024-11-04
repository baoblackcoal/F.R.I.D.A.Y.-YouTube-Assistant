import { 
  ApiType, 
  Language,
  ITtsSettings, 
  IGeneralSettings, 
  ISummarySettings, 
  ILlmSettings, 
  IAbstractSettings 
} from './ISettings';

export const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
export const pitchOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const defaultTtsSettings: ITtsSettings = {
  language: '',
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  apiType: ApiType.Azure,
};

export const defaultGeneralSettings: IGeneralSettings = {
  language: Language.English,
  syncLanguageLlmAndTts: false,
};

export const defaultSummarySettings: ISummarySettings = {
  promptType: 0,
  diyPromptText1: "Summarize the video titled '{videoTitle}' with the following transcript in {language}  :\n\n{textTranscript}",
  diyPromptText2: "Create a bullet-point summary of the key points from this video in {language}:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
  diyPromptText3: "Analyze the main themes and ideas in this video in {language}:\n\n{videoTitle}\n\n{textTranscript}",
  language: Language.English.toString(),
  autoTtsSpeak: false,
  autoSummary: true,
};

export const defaultLlmModel: ILlmSettings = {
  modelName: "gemini-1.5-flash",
  maxTokens: 4096,
  temperature: 0,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  apiKey: "",
};

export const defaultSettings: IAbstractSettings = {
  general: defaultGeneralSettings,
  summary: defaultSummarySettings,
  llm: defaultLlmModel,
  tts: defaultTtsSettings,
};

// change settings for testing, must update extension in chrome://extensions after change, or it will not take effect!!!
export const testSettings: IAbstractSettings = {
  general: {
    ...defaultGeneralSettings,
    language: Language.Simplified_Chinese,
    syncLanguageLlmAndTts: true,
  },
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
    apiType: ApiType.Chrome,
  },
};

export enum InitialSettingsType {
  TEST = "test",
  DEFAULT = "default",
}

export function getInitSettings(settingsType: InitialSettingsType): IAbstractSettings {
  return settingsType === InitialSettingsType.DEFAULT ? defaultSettings : testSettings;
}


