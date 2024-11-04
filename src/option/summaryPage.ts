import { defaultSummarySettings } from '../common/settings';
import { Language, ISummarySettings } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { ISummaryPageView, SummaryPageView } from './summaryPageView';

export class SummaryPage {
  private view: ISummaryPageView;
  private settings: ISummarySettings;
  private llmSettings: any;

  constructor() {
    this.settings = { ...defaultSummarySettings };
    this.view = new SummaryPageView(
      this.handleSettingsChange.bind(this),
      this.handlePromptEdit.bind(this)
    );
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.view.initialize(this.settings, this.llmSettings);
  }

  private async loadSettings(): Promise<void> {
    this.settings = await settingsManager.getSummarySettings();
    this.llmSettings = await settingsManager.getLlmSettings();
  }

  private async handleSettingsChange(): Promise<void> {
    const formValues = this.view.getFormValues();
    
    const summarySettings: ISummarySettings = {
      promptType: formValues.promptType,
      diyPromptText1: formValues.diyPromptText1,
      diyPromptText2: formValues.diyPromptText2,
      diyPromptText3: formValues.diyPromptText3,
      language: formValues.language,
      autoTtsSpeak: formValues.autoTtsSpeak,
      autoSummary: formValues.autoSummary,
    };

    await settingsManager.setLlmSettings({ 
      ...this.llmSettings, 
      apiKey: formValues.geminiApiKey 
    });
    await settingsManager.setSummarySettings(summarySettings);

    this.settings = summarySettings;
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
