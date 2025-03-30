import { IGeneralSettings, Language } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { i18n } from '../common/i18n';
import './css/basePage.css';
import './css/generalPage.css';

export class GeneralPage {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'page-container';
    this.container.innerHTML = `
      <div id="welcome-section" class="welcome-section section"></div>
      <div id="language-section" class="section"></div>
    `;

    this.updateI18nAndAttachEvent();
    
    i18n.attachI18nEvent({
      eventId: 'generalPage',
      callback: async (language: Language) => {
        this.updateI18nAndAttachEvent();
      }
    });

    window.addEventListener('generalLanguageSyncChanged', () => {
      this.syncLanguageCheckboxFromWindowEvent();
    });
  }

  private updateI18nAndAttachEvent(): void {
    this.updatePageContent();
    this.loadCurrentLanguage();
    this.loadSyncLanguageCheckbox();
    this.attachChangeEventListeners();
  }

  private async syncLanguageCheckboxFromWindowEvent(): Promise<void> {
    const generalSetting = await settingsManager.getGeneralSettings();
    const summarySetting = await settingsManager.getSummarySettings();

    const sync = generalSetting.language === summarySetting.language;
    const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = sync;
    }
    generalSetting.syncLanguage = sync;
    await settingsManager.setGeneralSettings(generalSetting);
  }

  private updatePageContent(): void {
    // Update welcome section
    const welcomeSection = this.container.querySelector('#welcome-section');
    if (welcomeSection) {
      welcomeSection.innerHTML = `
        <img src="friday_logo_&_ytb.png" alt="Friday" class="h-24 mx-auto">
        <div class="welcome-messages">
          <p>${i18n.getMessage('option_general_welcome_greeting')}</p>
          <p>${i18n.getMessage('option_general_assistant_description')}</p>
          <p>${i18n.getMessage('option_general_mission_statement')}</p>
          <p>${i18n.getMessage('option_general_features_intro')}</p>
          <ul class="feature-list">
            <li>${i18n.getMessage('option_general_feature_summarize')}</li>
            <li>${i18n.getMessage('option_general_feature_translate')}</li>
            <li>${i18n.getMessage('option_general_feature_tts')}</li>
            <li>${i18n.getMessage('option_general_feature_more')} 
                <a href="https://github.com/baoblackcoal/Friday-YouTube-Assistant" 
                   target="_blank" 
                   rel="noopener noreferrer">${i18n.getMessage('option_general_open_source')}</a>
            </li>
          </ul>
        </div>
      `;
    }

    const languageSection = this.container.querySelector('#language-section');
    if (languageSection) {
      languageSection.innerHTML = `
        <label class="label" id="language-label">${i18n.getMessage('option_general_language_label')}</label>
        <select id="language-selector" class="select">
          ${Object.values(Language).map(lang => 
            `<option value="${lang}">${i18n.getLanguageLabel(lang)}</option>`
          ).join('')}
        </select>

        <div class="checkbox-wrapper">
          <input type="checkbox" id="sync-language" class="checkbox-input">
          <label for="sync-language" class="checkbox-label" id="sync-language-label">
            ${i18n.getMessage('option_general_sync_language_label')}
          </label>
        </div>
      `;
    }

  }

  private async loadCurrentLanguage(): Promise<void> {
    const result = await settingsManager.getGeneralSettings();
    const currentLanguage = result.language || Language.English;
    
    const languageSelector = this.container.querySelector('#language-selector') as HTMLSelectElement;
    if (languageSelector) {
      languageSelector.value = currentLanguage;
    }

  }

  private async loadSyncLanguageCheckbox(): Promise<void> {
    const result = await settingsManager.getGeneralSettings();
    const sync = result.syncLanguage || false;

    const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = sync;
    }
  }

  private async updateAndSaveLanguageSettings(language: Language, sync: boolean): Promise<void> {
    try {
      const generalSettings: IGeneralSettings = {
        language: language,
        syncLanguage: sync
      };

      await settingsManager.setGeneralSettings(generalSettings);
    } catch (error) {
      console.log('Failed to change language:', error);
    }
  }

  private async handleLanguageChange(event: Event): Promise<void> {
    const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
    const sync = checkbox.checked || false;

    const select = event.target as HTMLSelectElement;
    const newLanguage = select.value as Language;

    await this.updateAndSaveLanguageSettings(newLanguage, sync);
    
    window.dispatchEvent(new CustomEvent('generalLanguageChanged', {
      detail: { language: newLanguage }
    }));     
  }

  private async handleLanguageSyncChange(event: Event): Promise<void> {    
    const select = this.container.querySelector('#language-selector') as HTMLSelectElement;
    const language = select.value as Language;

    const sync = (event.target as HTMLInputElement).checked;

    await this.updateAndSaveLanguageSettings(language, sync);

    // must dispatch generalLanguageChanged event if saveLanguageSettings is successful
    if (sync) {
      const generalSettings = await settingsManager.getGeneralSettings();
      const newLanguage = generalSettings.language;
      window.dispatchEvent(new CustomEvent('generalLanguageChanged', {
        detail: { language: newLanguage }
      }));    
    }
  }


  private attachChangeEventListeners(): void {
    const languageSelector = this.container.querySelector('#language-selector');
    if (languageSelector) {
      languageSelector.addEventListener('change', (e) => this.handleLanguageChange(e));
    }

    const checkbox = this.container.querySelector('#sync-language');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => this.handleLanguageSyncChange(e));
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
