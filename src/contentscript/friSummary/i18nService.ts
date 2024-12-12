import { i18n } from '../../common/i18n';
import { summaryState } from './friSummaryState';
import { Language } from '../../common/ISettings';

export interface II18nService {
    setLanguage: (language: Language) => Promise<void>;
    getMessage: (key: string) => string;
}

class I18nService implements II18nService {
    private static instance: I18nService;

    private constructor() {}

    public static getInstance(): I18nService {
        if (!I18nService.instance) {
            I18nService.instance = new I18nService();
        }
        return I18nService.instance;
    }

    async setLanguage(language: Language): Promise<void> {
        await i18n.loadLocale(language);
        summaryState.setDisplayLanguage(language);
        // Dispatch event for components to update
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
    }

    getMessage(key: string): string {
        return i18n.getMessage(key);
    }
}

export const i18nService = I18nService.getInstance();
