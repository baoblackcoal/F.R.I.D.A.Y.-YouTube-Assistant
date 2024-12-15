import { Env, common } from './common';
import { globalConfig } from './config';
import {  defaultTtsSettings, defaultSummarySettings, defaultLlmModel, getInitSettings, InitialSettingsType } from './settings';
import {  ITtsSettings, ISummarySettings, ILlmSettings, Language, IAbstractSettings, IGeneralSettings } from './ISettings';

export interface ISettingsManager {
  setTtsSettings(settings: ITtsSettings): Promise<void>;
  getTtsSettings(): Promise<ITtsSettings>;
  setSummarySettings(settings: ISummarySettings): Promise<void>;
  getSummarySettings(): Promise<ISummarySettings>;
  setLlmSettings(settings: ILlmSettings): Promise<void>;
  getLlmSettings(): Promise<ILlmSettings>;
  initializeSettingsWhenInstalled(): Promise<void>;
  getSettings(): Promise<IAbstractSettings>;
  saveSettings(): Promise<void>;
  resetSettings(): Promise<void>;
  getGeneralSettings(): Promise<IGeneralSettings>;
  setGeneralSettings(settings: IGeneralSettings): Promise<void>;
}

class ChromeSettingsManager implements ISettingsManager {
  //constructor
  private initSettings: IAbstractSettings;

  constructor() {
    const env: Env = common.getEnvironment();
    console.log("environment = "+env);
    if (env === Env.Prod) {
      this.initSettings = getInitSettings(InitialSettingsType.DEFAULT);
    } else {
      this.initSettings = getInitSettings(globalConfig.devInitialSettingsType);
    }
  }

  async getSettings(): Promise<IAbstractSettings> {
    const ttsSettings = await this.getTtsSettings();
    const summarySettings = await this.getSummarySettings();
    const llmSettings = await this.getLlmSettings();
    const generalSettings = await this.getGeneralSettings();

    const settings: IAbstractSettings = {
      general: generalSettings,
      tts: ttsSettings,
      summary: summarySettings,
      llm: llmSettings
    };

    return settings;
  }

  async getGeneralSettings(): Promise<IGeneralSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('generalSettings', (result) => {
        resolve(result.generalSettings || this.initSettings.general);
      });
    });
  }

  async setGeneralSettings(settings: IGeneralSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ generalSettings: settings }, resolve);
    });
  }

  async saveSettings(): Promise<void> {
    await this.setSummarySettings(this.initSettings.summary);
    await this.setLlmSettings(this.initSettings.llm);
    await this.setTtsSettings(this.initSettings.tts);
  }

  async resetSettings(): Promise<void> {
    await this.setSummarySettings(defaultSummarySettings);
    await this.setLlmSettings(defaultLlmModel);
    await this.setTtsSettings(defaultTtsSettings);
  }

  async initializeSettingsWhenInstalled(): Promise<void> {   
    await this.setSummarySettings(this.initSettings.summary);
    await this.setLlmSettings(this.initSettings.llm);
    await this.setTtsSettings(this.initSettings.tts);
  }
  
  async setTtsSettings(settings: ITtsSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ttsSettings: settings }, resolve);
    });
  }

  async getTtsSettings(): Promise<ITtsSettings> {
    return new Promise((resolve) => {

      chrome.storage.sync.get('ttsSettings', (result) => {
        resolve(result.ttsSettings || this.initSettings.tts);
      });
    });
  }

  async setSummarySettings(settings: ISummarySettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ summarySettings: settings }, resolve);
    });
  }

  async getSummarySettings(): Promise<ISummarySettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('summarySettings', (result) => {
        resolve(result.summarySettings || this.initSettings.summary);
      });
    });
  }

  async setLlmSettings(settings: ILlmSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ llmSettings: settings }, resolve);
    });
  }

  async getLlmSettings(): Promise<ILlmSettings> {
    return new Promise((resolve) => {
      chrome.storage.sync.get('llmSettings', (result) => {
        resolve(result.llmSettings || this.initSettings.llm);
      });
    });
  }

}


export const settingsManager: ISettingsManager = new ChromeSettingsManager();