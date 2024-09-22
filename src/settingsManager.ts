import { Env, getEnvironment } from './common';
import { globalConfig } from './config';
import { TtsSettings, SummarySettings, LlmSettings, Language, defaultTtsSettings, defaultSummarySettings, defaultLlmModel, getInitSettings, AbstractSettings, InitialSettingsType } from './settings';

export interface SettingsManager {
  setTtsSettings(settings: TtsSettings): Promise<void>;
  getTtsSettings(): Promise<TtsSettings>;
  setSummarySettings(settings: SummarySettings): Promise<void>;
  getSummarySettings(): Promise<SummarySettings>;
  setLlmSettings(settings: LlmSettings): Promise<void>;
  getLlmSettings(): Promise<LlmSettings>;
  initializeSettingsWhenInstalled(): Promise<void>;
}

class ChromeSettingsManager implements SettingsManager {
  //constructor
  private initSettings: AbstractSettings;

  constructor() {
    const env = getEnvironment();
    console.log("environment = "+env);
    if (env == Env.Prod) {
      this.initSettings = getInitSettings(InitialSettingsType.DEFAULT);
    } else {
      this.initSettings = getInitSettings(globalConfig.devInitialSettingsType);
    }
  }

  async initializeSettingsWhenInstalled(): Promise<void> {   
    await this.setSummarySettings(this.initSettings.summary);
    await this.setLlmSettings(this.initSettings.llm);
    await this.setTtsSettings(this.initSettings.tts);
  }
  
  async setTtsSettings(settings: TtsSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ttsSettings: settings }, resolve);
    });
  }

  async getTtsSettings(): Promise<TtsSettings> {
    return new Promise((resolve) => {

      chrome.storage.sync.get('ttsSettings', (result) => {
        resolve(result.ttsSettings || this.initSettings.tts);
      });
    });
  }

  async setSummarySettings(settings: SummarySettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ summarySettings: settings }, resolve);
    });
  }

  async getSummarySettings(): Promise<SummarySettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('summarySettings', (result) => {
        resolve(result.summarySettings || this.initSettings.summary);
      });
    });
  }

  async setLlmSettings(settings: LlmSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ llmSettings: settings }, resolve);
    });
  }

  async getLlmSettings(): Promise<LlmSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('llmSettings', (result) => {
        resolve(result.llmSettings || this.initSettings.llm);
      });
    });
  }

}


export const settingsManager: SettingsManager = new ChromeSettingsManager();