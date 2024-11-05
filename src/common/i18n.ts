import { Language } from './ISettings';

interface LocaleMessages {
  [key: string]: {
    message: string;
  };
}

export class I18nService {
  private static instance: I18nService;
  private messages: LocaleMessages = {};
  private currentLanguage: Language = Language.English;

  private readonly languageLabels: Record<Language, string> = {
    [Language.English]: 'English',
    [Language.SimplifiedChinese]: '简体中文',
    [Language.TraditionalChinese]: '繁體中文'
  };

  private constructor() {}

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public getMessage(key: string): string {
    const message = this.messages[key]?.message;
    return message || `${key} not found`;
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
      this.currentLanguage = language;
    } catch (error) {
      console.error('Failed to load locale:', error);
      // Fallback to English if loading fails
      if (language !== Language.English) {
        await this.loadLocale(Language.English);
      }
    }
  }
}

export const i18n = I18nService.getInstance(); 