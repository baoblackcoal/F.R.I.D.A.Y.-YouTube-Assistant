import { 
  ApiType, 
  Language,
  ITtsSettings, 
  IGeneralSettings, 
  ISummarySettings, 
  ILlmSettings, 
  IAbstractSettings,
  SubtitleType
} from './ISettings';
import { summaryDiy1PromptText } from '../prompts/defaultPromptText';

export const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
export const pitchOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export const defaultTtsSettings: ITtsSettings = {
  language: '',
  voiceName: '',
  voiceNameRobinson: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  apiType: ApiType.Chrome,
};

export const defaultGeneralSettings: IGeneralSettings = {
  language: Language.SimplifiedChinese,
  syncLanguage: true,
};

export const defaultSummarySettings: ISummarySettings = {
  isCommonKey: true,
  promptType: 0,
  diyPromptText1: summaryDiy1PromptText,
  diyPromptText2: "Create a bullet-point summary of the key points from this video in {language}:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
  diyPromptText3: "Analyze the main themes and ideas in this video in {language}:\n\n{videoTitle}\n\n{textTranscript}",
  language: Language.SimplifiedChinese,
  autoTtsSpeak: false,
  autoGenerate: false,
  autoDownload: false,
  generateSubtitleType: SubtitleType.Translation,
};

export const defaultLlmModel: ILlmSettings = {
  modelName: "gemini-1.5-flash",
  maxTokens: 4096,
  temperature: 0,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  userApiKey: "",
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
    language: Language.SimplifiedChinese,
  },
  summary: {
    ...defaultSummarySettings,
    promptType: 0,
    diyPromptText2: "hi",
    diyPromptText3: "hello",
    language: Language.SimplifiedChinese,
    autoTtsSpeak: false,
    autoGenerate: false,
    generateSubtitleType: SubtitleType.Translation,
  },
  llm: {
    ...defaultLlmModel,
    userApiKey: "test-api-key",
  },
  tts: {
    ...defaultTtsSettings,
    rate: 1.5,
    apiType: ApiType.Chrome,
    voiceName: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaochenNeural)",
    voiceNameRobinson: "Microsoft Server Speech Text to Speech Voice (zh-CN, YunzeNeural)",
  },
};

export enum InitialSettingsType {
  TEST = "test",
  DEFAULT = "default",
}

export function getInitSettings(settingsType: InitialSettingsType): IAbstractSettings {
  return settingsType === InitialSettingsType.DEFAULT ? defaultSettings : testSettings;
}


