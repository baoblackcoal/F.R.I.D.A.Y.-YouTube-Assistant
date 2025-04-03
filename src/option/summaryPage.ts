import { defaultSummarySettings } from '../common/settings';
import { Language, ISummarySettings, ILlmSettings, SubtitleType } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { ISummaryPageView, SummaryPageView } from './summaryPageView';
import { i18n } from '../common/i18n';

export class SummaryPage {
  private view: ISummaryPageView;
  private summarySettings: ISummarySettings;
  private llmSettings!: ILlmSettings;

  constructor() {
    this.summarySettings = { ...defaultSummarySettings };
    this.view = new SummaryPageView(
      this.handleSettingsChange.bind(this),
      this.handlePromptEdit.bind(this),
    );
  }

  saveUserGeminiApiKey(): void {
    const geminiApiKey = this.view.getFormValues().geminiApiKey;
    chrome.storage.sync.set({ geminiApiKey: geminiApiKey });
  }

  private async handleSettingsChange(): Promise<void> {
    const formValues = this.view.getFormValues();
    const oldSettings = await settingsManager.getSummarySettings();    
    const isCommonKey = formValues.apiKeyType === 'Common Key';
    
    const summarySettings: ISummarySettings = {
      isCommonKey: isCommonKey,
      promptType: formValues.promptType,
      diyPromptText1: formValues.diyPromptText1,
      diyPromptText2: formValues.diyPromptText2,
      diyPromptText3: formValues.diyPromptText3,
      language: formValues.language as Language,
      autoTtsSpeak: formValues.autoTtsSpeak,
      autoGenerate: formValues.autoSummary,
      autoDownload: formValues.autoDownload,
      generateSubtitleType: oldSettings.generateSubtitleType,
    };

    console.log('summarySettings', summarySettings);                                                                                                    
    await settingsManager.setSummarySettings(summarySettings);
  }

  private async handlePromptEdit(promptId: number, value: string): Promise<void> {
    const promptTextarea = document.querySelector(`#diyPromptText${promptId}`) as HTMLTextAreaElement;
    promptTextarea.value = value;
    await this.handleSettingsChange();
  }

  public getElement(): HTMLElement {
    return this.view.getElement();
  }
}
