import { IGeneralSettings, Language } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import './css/basePage.css';
import './css/generalPage.css';

interface LocaleMessages {
  [key: string]: {
    message: string;
  };
}

export class GeneralPage {
  private container: HTMLElement;
  private messages: LocaleMessages = {};
  private readonly languageLabels: Record<Language, string> = {
    [Language.English]: 'English',
    [Language.SimplifiedChinese]: '简体中文',
    [Language.TraditionalChinese]: '繁體中文'
  };

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'page-container';
    this.init();
    this.loadCurrentLanguage();
  }

  private getMessage(key: string): string {
    const message = this.messages[key]?.message;
    if (message) {
      return message;
    } else {
      return key;
    }
  }

  private async loadLocale(language: Language): Promise<void> {
    try {
      const response = await fetch(`_locales/${language}/messages.json`);
      this.messages = await response.json();
      this.updatePageContent();
    } catch (error) {
      console.error('Failed to load locale:', error);
      // Fallback to English if loading fails
      if (language !== Language.English) {
        await this.loadLocale(Language.English);
      }
    }
  }

  private updatePageContent(): void {
    // Update welcome section
    const welcomeSection = this.container.querySelector('#welcome-section');
    if (welcomeSection) {
      welcomeSection.innerHTML = `
        <img src="friday_logo_128.png" alt="F.R.I.D.A.Y." class="h-24 w-24 mx-auto">
        <h2 class="text-2xl font-bold mt-4 text-primary">${this.getMessage('extension_name')}</h2>
        <div class="welcome-messages">
          <p>${this.getMessage('welcome_greeting')}</p>
          <p>${this.getMessage('assistant_description')}</p>
          <p>${this.getMessage('mission_statement')}</p>
          <p>${this.getMessage('features_intro')}</p>
          <ul class="feature-list">
            <li>${this.getMessage('feature_summarize')}</li>
            <li>${this.getMessage('feature_translate')}</li>
            <li>${this.getMessage('feature_tts')}</li>
            <li>${this.getMessage('feature_more')} 
                <a href="https://github.com/baoblackcoal/F.R.I.D.A.Y.-YouTube-Assistant" 
                   target="_blank" 
                   rel="noopener noreferrer">${this.getMessage('open_source')}</a>.
            </li>
          </ul>
        </div>
      `;
    }

    // Update language selector label
    const languageLabel = this.container.querySelector('#language-label');
    if (languageLabel) {
      languageLabel.textContent = this.getMessage('language_label');
    }

    // Update sync language checkbox label
    const syncLanguageCheckbox = this.container.querySelector('#sync-language-label');
    if (syncLanguageCheckbox) {
      syncLanguageCheckbox.textContent = this.getMessage('sync_language_label');
    }
  }

  private async loadCurrentLanguage(): Promise<void> {
    const result = await settingsManager.getGeneralSettings();
    const currentLanguage = result.language || Language.English;
    
    const languageSelector = this.container.querySelector('#language-selector') as HTMLSelectElement;
    if (languageSelector) {
      languageSelector.value = currentLanguage;
    }

    await this.loadLocale(currentLanguage);
  }

  private async handleLanguageChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newLanguage = select.value as Language;

    try {
      const generalSettings: IGeneralSettings = {
        language: newLanguage,
        syncLanguageLlmAndTts: (this.container.querySelector('#sync-language-selector') as HTMLInputElement)?.checked || false
      };

      // Save the selected language
      await settingsManager.setGeneralSettings(generalSettings);
      
      // Load and apply the new locale
      await this.loadLocale(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  private createWelcomeSection(): HTMLElement {
    const section = document.createElement('div');
    section.id = 'welcome-section';
    section.className = 'welcome-section section';
    // Initial content will be updated by updatePageContent
    return section;
  }

  private createLanguageSelector(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'section';

    wrapper.innerHTML = `
      <label class="label" id="language-label">${this.getMessage('language_label')}</label>
      <select id="language-selector" class="select">
        ${Object.values(Language).map(lang => 
          `<option value="${lang}">${this.languageLabels[lang]}</option>`
        ).join('')}
      </select>
    `;

    const languageSelector = wrapper.querySelector('#language-selector');
    if (languageSelector) {
      languageSelector.addEventListener('change', (e) => this.handleLanguageChange(e));
    }
    
    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox-wrapper';
    checkbox.innerHTML = `
      <input type="checkbox" id="sync-language" class="checkbox-input">
      <label for="sync-language" class="checkbox-label" id="sync-language-label">${this.getMessage('sync_language_label')}</label>
    `;

    wrapper.appendChild(checkbox);

    return wrapper;
  }

  private init(): void {
    this.container.appendChild(this.createWelcomeSection());
    this.container.appendChild(this.createLanguageSelector());
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
