// import { Language } from './ISettings';
// import { settingsManager } from './settingsManager';
import { Language } from './friSummaryState.js';

interface LocaleMessages {
  [key: string]: {
    message: string;
  };
}


interface I18nEvent {
  eventId: string;
  callback: (language: Language) => Promise<void>;
}


export class I18nService {
  private static instance: I18nService;
  private messages: LocaleMessages = {};
  private currentLanguage: Language = Language.English;
  private i18nEvents: I18nEvent[] = [];

  private readonly languageLabels: Record<Language, string> = {
    [Language.English]: 'English',
    [Language.SimplifiedChinese]: '简体中文',
    [Language.TraditionalChinese]: '繁體中文'
  };

  private constructor() {
    this.onGeneralLanguageChanged();
  }

  public async init(): Promise<void> {
    await this.loadLocaleByGeneralSettings();
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  private async loadLocaleByGeneralSettings(): Promise<void> {
    // const result = await settingsManager.getGeneralSettings();
    // const currentLanguage = result.language || Language.English;
    // await this.loadLocale(currentLanguage);
  }

  private onGeneralLanguageChanged() {
    window.addEventListener('generalLanguageChanged', async (event: Event) => {
      const customEvent = event as CustomEvent<{language: Language}>;
      const { language } = customEvent.detail;
      await i18n.loadLocale(language);
      this.i18nEvents.forEach(event => {
        event.callback(language);
      });
    });
  }

  public async attachI18nEvent(event: I18nEvent): Promise<void> {
    if (!this.i18nEvents.find(e => e.eventId === event.eventId)) {
      this.i18nEvents.push(event);
    }
  }

  public getMessage(key: string): string {
    const message = this.messages[key]?.message;
    return message || `${key} not found`;
  }

  public getMessageWithParams(key: string, params: Record<string, string>): string {
    const message = this.messages[key]?.message;
    return message ? message.replace(/{(\w+)}/g, (_, p) => params[p] || `{${p}}`) : `${key} not found`;
  }

  public getLanguageLabel(language: Language): string {
    return this.languageLabels[language];
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  public async loadLocale(language: Language): Promise<void> {
    try {
      const response = await fetch(`_locales/${language}/messages.json`);
      this.messages = await response.json();
      const responseContent = await fetch(`_locales/${language}/messagesContent.json`);
      const messagesContent = await responseContent.json();
      this.messages = { ...this.messages, ...messagesContent };

      this.currentLanguage = language;
    } catch (error) {
      console.log('Failed to load locale:', error);
      // Fallback to English if loading fails
      if (language !== Language.English) {
        await this.loadLocale(Language.English);
      }
    }
  }
}

export const i18n = I18nService.getInstance(); 