import { TtsSettings, SummarySettings, LlmSettings, Language, defaultTtsSettings, defaultSummarySettings, defaultLlmModel } from './common';

export interface SettingsManager {
  setTtsSettings(settings: TtsSettings): Promise<void>;
  getTtsSettings(): Promise<TtsSettings>;
  setSummarySettings(settings: SummarySettings): Promise<void>;
  getSummarySettings(): Promise<SummarySettings>;
  setLlmSettings(settings: LlmSettings): Promise<void>;
  getLlmSettings(): Promise<LlmSettings>;
  initializeDefaultSettings(): Promise<void>;
}

class ChromeSettingsManager implements SettingsManager {
  async setTtsSettings(settings: TtsSettings): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ ttsSettings: settings }, resolve);
    });
  }

  async getTtsSettings(): Promise<TtsSettings> {
    return new Promise((resolve) => {

      chrome.storage.sync.get('ttsSettings', (result) => {
        resolve(result.ttsSettings || defaultTtsSettings);
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
        resolve(result.summarySettings || defaultSummarySettings);
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
        resolve(result.llmSettings || defaultLlmModel);
      });
    });
  }

  async initializeDefaultSettings(): Promise<void> {
    await this.setSummarySettings(defaultSummarySettings);
    await this.setLlmSettings(defaultLlmModel);
    await this.setTtsSettings(defaultTtsSettings);
  }
}

export const settingsManager: SettingsManager = new ChromeSettingsManager();