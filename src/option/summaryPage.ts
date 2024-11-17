import { defaultSummarySettings } from '../common/settings';
import { Language, ISummarySettings, ILlmSettings } from '../common/ISettings';
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
    this.init();

    window.addEventListener('languageChanged', async (event: Event) => {
      const customEvent = event as CustomEvent<{language: Language}>;
      const { language } = customEvent.detail;
      await i18n.loadLocale(language);
      this.view.updateI18n();
    });
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.view.initialize(this.summarySettings, this.llmSettings);
  }

  private async loadSettings(): Promise<void> {
    this.llmSettings = await settingsManager.getLlmSettings();
    this.summarySettings = await settingsManager.getSummarySettings();
  }

  private async handleSettingsChange(): Promise<void> {
    const formValues = this.view.getFormValues();
    
    const summarySettings: ISummarySettings = {
      promptType: formValues.promptType,
      diyPromptText1: formValues.diyPromptText1,
      diyPromptText2: formValues.diyPromptText2,
      diyPromptText3: formValues.diyPromptText3,
      language: formValues.language as Language,
      autoTtsSpeak: formValues.autoTtsSpeak,
      autoSummary: formValues.autoSummary,
    };

    const isUserKey = formValues.apiKeyType === 'Your Key';
    if (isUserKey) {
      await settingsManager.setLlmSettings({ 
        ...await settingsManager.getLlmSettings(),
        isCommonKey: false 
      });
    } else {
      await settingsManager.setLlmSettings({ 
        ...await settingsManager.getLlmSettings(), 
        isCommonKey: true 
      });
    }
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
