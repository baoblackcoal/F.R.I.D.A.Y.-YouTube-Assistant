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
    this.init();
    this.loadCurrentLanguage();
    this.loadSyncLanguageCheckbox();
    this.attachLanguageSyncChangeEventListeners();
  }

  private updatePageContent(): void {
    // Update welcome section
    const welcomeSection = this.container.querySelector('#welcome-section');
    if (welcomeSection) {
      welcomeSection.innerHTML = `
        <img src="friday_logo_&_ytb.png" alt="F.R.I.D.A.Y." class="h-24 mx-auto">
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
                <a href="https://github.com/baoblackcoal/F.R.I.D.A.Y.-YouTube-Assistant" 
                   target="_blank" 
                   rel="noopener noreferrer">${i18n.getMessage('option_general_open_source')}</a>
            </li>
          </ul>
        </div>
      `;
    }

    // Update language selector label
    const languageLabel = this.container.querySelector('#language-label');
    if (languageLabel) {
      languageLabel.textContent = i18n.getMessage('option_general_language_label');
    }

    // Update sync language checkbox label
    const syncLanguageCheckbox = this.container.querySelector('#sync-language-label');
    if (syncLanguageCheckbox) {
      syncLanguageCheckbox.textContent = i18n.getMessage('option_general_sync_language_label');
    }
  }

  private async loadCurrentLanguage(): Promise<void> {
    const result = await settingsManager.getGeneralSettings();
    const currentLanguage = result.language || Language.English;
    
    const languageSelector = this.container.querySelector('#language-selector') as HTMLSelectElement;
    if (languageSelector) {
      languageSelector.value = currentLanguage;
    }

    await i18n.loadLocale(currentLanguage);
    this.updatePageContent();
  }

  private async attachLanguageSyncChangeEventListeners(): Promise<void> {
    window.addEventListener('generalLanguageSyncChanged', async (event: Event) => {
      const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
      const settings = await settingsManager.getGeneralSettings();
      checkbox.checked = settings.syncLanguage;
    });
  }

  private async loadSyncLanguageCheckbox(): Promise<void> {
    const result = await settingsManager.getGeneralSettings();
    const sync = result.syncLanguage || false;

    const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = sync;
    }
  }

  private async saveLanguageSettings(): Promise<void> {
    const select = this.container.querySelector('#language-selector') as HTMLSelectElement;
    const newLanguage = select.value as Language;

    const checkbox = this.container.querySelector('#sync-language') as HTMLInputElement;
    const sync = checkbox.checked || false;

    try {
      const generalSettings: IGeneralSettings = {
        language: newLanguage,
        syncLanguage: sync
      };

      await settingsManager.setGeneralSettings(generalSettings);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  private async handleLanguageChange(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newLanguage = select.value as Language;
     
    await this.saveLanguageSettings();
    await i18n.loadLocale(newLanguage);     
  
    this.updatePageContent();
    
    window.dispatchEvent(new CustomEvent('generalLanguageChanged', {
      detail: { language: newLanguage }
    }));     
  }

  private async handleLanguageSyncChange(event: Event): Promise<void> {    
    await this.saveLanguageSettings();

    // must dispatch generalLanguageChanged event if saveLanguageSettings is successful
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const generalSettings = await settingsManager.getGeneralSettings();
      const newLanguage = generalSettings.language;
      window.dispatchEvent(new CustomEvent('generalLanguageChanged', {
        detail: { language: newLanguage }
      }));    
    }
  }

  private createWelcomeSection(): HTMLElement {
    const section = document.createElement('div');
    section.id = 'welcome-section';
    section.className = 'welcome-section section';
    return section;
  }

  private createLanguageSelector(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'section';

    wrapper.innerHTML = `
      <label class="label" id="language-label">${i18n.getMessage('option_general_language_label')}</label>
      <select id="language-selector" class="select">
        ${Object.values(Language).map(lang => 
          `<option value="${lang}">${i18n.getLanguageLabel(lang)}</option>`
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
      <label for="sync-language" class="checkbox-label" id="sync-language-label">
        ${i18n.getMessage('option_general_sync_language_label')}
      </label>
    `;
    const checkboxInput = checkbox.querySelector('#sync-language');
    if (checkboxInput) {
      checkboxInput.addEventListener('change', (e) => this.handleLanguageSyncChange(e));
    }

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
