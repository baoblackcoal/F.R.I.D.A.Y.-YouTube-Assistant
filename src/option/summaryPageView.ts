import { Language, ISummarySettings, ILlmSettings } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { summaryDefaultPromptText } from '../prompts/defaultPromptText';
import './css/basePage.css';
import './css/summaryPage.css';
import { i18n, I18nService } from '../common/i18n';
import { common } from '../common/common';
import { ISummaryPageDialog, SummaryPageDialog } from './summaryPageDialog';
import { geminiAPI } from '../common/geminiApi';
import { Toast } from '../common/toast';
// import { II18n } from './options';

export interface ISummaryPageView {
  loadPromptVisibility(promptType: number): void;
  loadApiKeySection(isCommonKey: boolean, apiKey: string): void;
  getFormValues(): {
    apiKeyType: string;
    geminiApiKey: string;
    promptType: number;
    language: string;
    autoTtsSpeak: boolean;
    autoSummary: boolean;
    autoDownload: boolean;
    diyPromptText1: string;
    diyPromptText2: string;
    diyPromptText3: string;
  };
  load(settings: ISummarySettings, llmSettings: ILlmSettings): void;
  getElement(): HTMLElement;
}

export class SummaryPageView implements ISummaryPageView {
  private container: HTMLElement;
  private dialog: ISummaryPageDialog;
  generalLanguageAttach: boolean = false;

  constructor(
    private readonly onSettingsChangeToSave: () => Promise<void>,
    private readonly onPromptEdit: (promptId: number, value: string) => void,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'page-container';
    this.dialog = new SummaryPageDialog(this.container, this.onPromptEdit, i18n);
    this.createLayout();
    this.attachLanguageChangeFromGeneralPage();
  }

  private async createLayout(): Promise<void> {
    this.container.innerHTML = `<div id="apiKeySection" class="section"></div>
      <div id="languageSection" class="section"></div>
      <div id="autoSettingsSection" class="section"></div>
      <div id="promptSection" class="section"></div>
    `;
    
    await this.updateI18nAndAttachEvent();
  }

  private attachCheckboxEventListeners(): void {
    // Attach event listeners to checkboxes
    const autoSummaryCheckbox = this.container.querySelector('#autoSummary') as HTMLInputElement;
    autoSummaryCheckbox.addEventListener('change', () => this.onSettingsChangeToSave());

    const autoTtsSpeakCheckbox = this.container.querySelector('#autoTtsSpeak') as HTMLInputElement;
    autoTtsSpeakCheckbox.addEventListener('change', () => this.onSettingsChangeToSave());

    const autoDownloadCheckbox = this.container.querySelector('#autoDownload') as HTMLInputElement;
    autoDownloadCheckbox.addEventListener('change', () => this.onSettingsChangeToSave());
  }

  attachLanguageChangeFromGeneralPage(): void {
    i18n.attachI18nEvent({
      eventId: 'summaryPageView',
      callback: async (language: Language) => {
        const generalSettings = await settingsManager.getGeneralSettings();
        if (generalSettings.syncLanguage) {
          const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
          languageSelect.value = language;
          await this.onSettingsChangeToSave();
          await this.updateI18nAndAttachEvent();
        }
      }
    });
  }

  private async attachLanguageChangeEventListeners(): Promise<void> {
    // // Listen for language changes from other pages
    // this.attachLanguageChangeFromGeneralPage();

    // Listen for language changes from this page
    const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
    languageSelect.addEventListener('change', async (event: Event) => {
      await this.onSettingsChangeToSave();
      window.dispatchEvent(new CustomEvent('generalLanguageSyncChanged', {}));
    });
  }

  private updateApiKeySectionI18n(): void {
    const section = this.container.querySelector('#apiKeySection');
    section!.innerHTML = `
      <label class="label">${i18n.getMessage('option_summary_api_key_section')}</label>
      <div class="radio-wrapper">
        <input type="radio" name="apiKeyType" id="apiKeyTypeCommonKey" value="Common Key" class="radio-input">
        <label for="apiKeyTypeCommonKey" class="radio-label">
          ${i18n.getMessage('option_summary_common_key')}
        </label>

        <input type="radio" name="apiKeyType" id="apiKeyTypeYourKey" value="Your Key" class="radio-input">
        <label for="apiKeyTypeYourKey" class="radio-label">
          ${i18n.getMessage('option_summary_your_key')}
        </label>
      </div>
      <input type="text" id="geminiApiKey" class="input-field">
      <div class="button-container">
        <button id="testApiKey" class="base-button">${i18n.getMessage('option_summary_test_button')}</button>
        <button id="saveGeminiApiKey" class="base-button">${i18n.getMessage('option_summary_prompt_save')}</button>
      </div>
      
      <div id="apiKeyInfoCommonKey" class="api-key-info api-key-info-common">
        <p class="mb-2"><strong>${i18n.getMessage('option_summary_common_key_info_title')}</strong></p>
        <p>${i18n.getMessage('option_summary_common_key_description')}</p>
        <ul class="list-disc ml-4 mt-2">
          <li>${i18n.getMessage('option_summary_common_key_limit_rpm')}</li>
          <li>${i18n.getMessage('option_summary_common_key_limit_tpm')}</li>
          <li>${i18n.getMessage('option_summary_common_key_limit_rpd')}</li>
        </ul>
        <p class="mt-2">${i18n.getMessage('option_summary_gemini_flash_1_5_pricing')}
          <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer">
            Gemini Developer API Pricing
          </a>
        </p>
      </div>

      <div id="apiKeyInfoYourKey" class="api-key-info api-key-info-custom">
        <p class="mb-2"><strong>${i18n.getMessage('option_summary_custom_key_title')}</strong></p>

        <p class="mt-2">${i18n.getMessage('option_summary_custom_key_benefits')}</p>
        <ul class="list-disc ml-4 mt-2">
          <li>${i18n.getMessage('option_summary_custom_key_benefit_limits')}</li>
          <li>${i18n.getMessage('option_summary_custom_key_benefit_quota')}</li>
          <li>${i18n.getMessage('option_summary_custom_key_benefit_control')}</li>
        </ul>
        <p class="mt-2">${i18n.getMessage('option_summary_custom_key_description')} <a href="https://aistudio.google.com/u/0/apikey" target="_blank" rel="noopener noreferrer">
            Google AI Studio
          </a>
        </p>
      </div>
    `;
  }

  private updateLanguageSectionI18n() {
    const section = this.container.querySelector('#languageSection');
    section!.innerHTML = `
      <label class="label">${i18n.getMessage('option_summary_language_label')}</label>
      <select id="language" class="select">
        ${Object.values(Language).map(lang => `
          <option value="${lang}">${i18n.getLanguageLabel(lang)}</option>
        `).join('')}
      </select>
    `;
  }

  private updateAutoSettingsSectionI18n() {
    const section = this.container.querySelector('#autoSettingsSection');
    section!.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoSummary" class="checkbox-input">
        <label for="autoSummary" class="checkbox-label">${i18n.getMessage('option_summary_auto_summary')}</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoTtsSpeak" class="checkbox-input">
        <label for="autoTtsSpeak" class="checkbox-label">${i18n.getMessage('option_summary_auto_tts')}</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoDownload" class="checkbox-input">
        <label for="autoDownload" class="checkbox-label">${i18n.getMessage('option_summary_auto_download')}</label>
      </div>
    `;
  }

  private updatePromptSectionI18n() {
    const section = this.container.querySelector('#promptSection');
    section!.innerHTML = `
      <div id="promptTypeSection" class="sub-section">
        <label class="label">${i18n.getMessage('option_summary_prompt_type')}</label>
        <select id="promptType" class="select">
          <option value="0">${i18n.getMessage('option_summary_prompt_default')}</option>
          <option value="1">${i18n.getMessageWithParams('option_summary_prompt_custom', { number: '1' })}</option>
          <option value="2">${i18n.getMessageWithParams('option_summary_prompt_custom', { number: '2' })}</option>
          <option value="3">${i18n.getMessageWithParams('option_summary_prompt_custom', { number: '3' })}</option>
        </select>
      </div>

      <div id="promptContentSection">
        <div id="defaultPrompt" class="sub-section prompt-content">
          <label class="label">${i18n.getMessage('option_summary_prompt_default_readonly')}</label>
          <div class="truncate-wrapper">
            <textarea id="defaultPromptText" rows="12" readonly
                      class="textarea-field readonly">${summaryDefaultPromptText}</textarea>
          </div>
        </div>

        ${[1, 2, 3].map(i => `
          <div id="diyPrompt${i}" class="sub-section prompt-content" style="display: none;">
            <label class="label">${i18n.getMessageWithParams('option_summary_prompt_custom', { number: i.toString() })}</label>
            <div class="truncate-wrapper">
              <textarea id="diyPromptText${i}" rows="12" readonly
                        class="textarea-field"></textarea>
            </div>
            <button id="editPrompt${i}" class="base-button edit-prompt-btn">${i18n.getMessage('option_summary_prompt_edit')}</button>
          </div>
        `).join('')}
      </div>
    `;
  }

  public loadPromptVisibility(promptType: number): void {
    const allPrompts = this.container.querySelectorAll('.prompt-content');
    allPrompts.forEach(prompt => (prompt as HTMLElement).style.display = 'none');

    if (promptType === 0) {
      const defaultPrompt = this.container.querySelector('#defaultPrompt') as HTMLElement;
      defaultPrompt.style.display = 'block';
    } else {
      const customPrompt = this.container.querySelector(`#diyPrompt${promptType}`) as HTMLElement;
      customPrompt.style.display = 'block';
    }
  }

  public loadApiKeySection(isCommonKey: boolean, apiKey: string): void {
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const commonKeyInfo = this.container.querySelector('#apiKeyInfoCommonKey') as HTMLElement;
    const yourKeyInfo = this.container.querySelector('#apiKeyInfoYourKey') as HTMLElement;
    const saveButton = this.container.querySelector('#saveGeminiApiKey') as HTMLElement;

    let displayKey = '';
    if (apiKey !== '') {
      displayKey = '*'.repeat(apiKey.length);
    }
    apiKeyInput.value = displayKey;
    
    if (isCommonKey) {
      apiKeyInput.readOnly = true;
      saveButton.style.display = 'none';
    } else {
      apiKeyInput.readOnly = false;
      saveButton.style.display = 'none'; // Initially hide save button even for custom key
    }

    commonKeyInfo.style.display = isCommonKey ? 'block' : 'none';
    yourKeyInfo.style.display = isCommonKey ? 'none' : 'block';
  }

  public getFormValues() {
    return {
      apiKeyType: (this.container.querySelector('input[name="apiKeyType"]:checked') as HTMLInputElement)?.value,
      geminiApiKey: (this.container.querySelector('#geminiApiKey') as HTMLInputElement)?.value,
      promptType: parseInt((this.container.querySelector('#promptType') as HTMLSelectElement)?.value || '0'),
      language: (this.container.querySelector('#language') as HTMLSelectElement)?.value,
      autoTtsSpeak: (this.container.querySelector('#autoTtsSpeak') as HTMLInputElement)?.checked,
      autoSummary: (this.container.querySelector('#autoSummary') as HTMLInputElement)?.checked,
      autoDownload: (this.container.querySelector('#autoDownload') as HTMLInputElement)?.checked,
      diyPromptText1: (this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement)?.value,
      diyPromptText2: (this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement)?.value,
      diyPromptText3: (this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement)?.value,
    };
  }

  private async handleApiKeyChange(target: HTMLElement): Promise<void> {
    const isCommonKey = (target as HTMLInputElement).value === 'Common Key';
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    
    await this.onSettingsChangeToSave();
    
    const summarySettings = await settingsManager.getSummarySettings();
    const apiKey = await common.getApiKey(summarySettings);
    
    this.loadApiKeySection(isCommonKey, apiKey);
  }

  private async saveUserGeminiApiKey(): Promise<void> {
    const geminiApiKey = this.getFormValues().geminiApiKey;
    await chrome.storage.sync.set({ geminiApiKey: geminiApiKey });
    Toast.show({
      type: 'success',
      message: i18n.getMessage('tip_save_success')
    });
  }

  private async onTestApiKey(): Promise<void> {
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const testButton = this.container.querySelector('#testApiKey') as HTMLButtonElement;
    
    // Disable the test button while testing
    testButton.disabled = true;
    testButton.textContent = i18n.getMessage('option_summary_testing');
    
    try {
        // Get the current API key
        const summarySettings = await settingsManager.getSummarySettings();
        let apiKey = '';
        if (summarySettings.isCommonKey) {
            apiKey = await common.getApiKey(summarySettings);
        } else {
            apiKey = apiKeyInput.value.trim();
            if (apiKey.includes('*')) {
                const geminiApiKey = await chrome.storage.sync.get('geminiApiKey');
                apiKey = geminiApiKey.geminiApiKey;
            }
        }
        if (!apiKey) {
            throw new Error(i18n.getMessage('option_summary_api_key_empty'));
        }

        // Set the API key and try a simple test request
        const isValid = await geminiAPI.testApiKey(apiKey);
        
        if (isValid) {
            Toast.show({
                type: 'success',
                message: i18n.getMessage('option_summary_api_key_valid')
            });
        } else {
            throw new Error(i18n.getMessage('option_summary_api_key_invalid'));
        }
    } catch (error) {
        Toast.show({
            type: 'error',
            message: error instanceof Error ? error.message : i18n.getMessage('option_summary_api_key_invalid')
        });
    } finally {
        // Re-enable the test button and restore original text
        testButton.disabled = false;
        testButton.textContent = i18n.getMessage('option_summary_test_button');
    }
  }

  private attachApiKeyEventListeners(): void {
    // Handle form changes
    this.container.addEventListener('change', async (e) => {
      const target = e.target as HTMLElement;      
      // Special handling for API key type radio buttons
      if (target.getAttribute('name') === 'apiKeyType') {
        await this.handleApiKeyChange(target);
      }      
    });

    //handle testApiKey button
    const testApiKeyButton = this.container.querySelector('#testApiKey') as HTMLButtonElement;
    testApiKeyButton.addEventListener('click', async () => {
      await this.onTestApiKey();
    });

    //handle saveGeminiApiKey button
    const saveGeminiApiKeyButton = this.container.querySelector('#saveGeminiApiKey') as HTMLButtonElement;
    saveGeminiApiKeyButton.addEventListener('click', async () => {
      await this.saveUserGeminiApiKey();
      saveGeminiApiKeyButton.style.display = 'none'; // Hide after saving
    });

    // Handle geminiApiKey input change
    const geminiApiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    let originalApiKey = geminiApiKeyInput.value;
    
    geminiApiKeyInput.addEventListener('input', async () => {
      const saveButton = this.container.querySelector('#saveGeminiApiKey') as HTMLElement;
      const isYourKey = (this.container.querySelector('#apiKeyTypeYourKey') as HTMLInputElement).checked;
      const currentValue = geminiApiKeyInput.value.trim();
      
      // Show save button only if using custom key and value has changed
      if (isYourKey && currentValue !== originalApiKey) {
        saveButton.style.display = 'block';
      } else {
        saveButton.style.display = 'none';
      }
    });

    // Handle prompt editing
    const promptTypeSelect = this.container.querySelector('#promptType') as HTMLSelectElement;
    promptTypeSelect.addEventListener('change', (e) => {
      const newType = parseInt((e.target as HTMLSelectElement).value);
      this.loadPromptVisibility(newType);
    });

    // Update prompt editing event handlers
    [1, 2, 3].forEach(i => {
      const editBtn = this.container.querySelector(`#editPrompt${i}`) as HTMLButtonElement;
      editBtn?.addEventListener('click', () => {
        const promptTextarea = this.container.querySelector(`#diyPromptText${i}`) as HTMLTextAreaElement;
        this.dialog.showDialog(i, promptTextarea.value);
      });
    });
  }

  public async load(settings: ISummarySettings, llmSettings: ILlmSettings): Promise<void> {
    // Initialize form values
    const inputs = {
      promptType: this.container.querySelector('#promptType') as HTMLSelectElement,
      language: this.container.querySelector('#language') as HTMLSelectElement,
      autoTtsSpeak: this.container.querySelector('#autoTtsSpeak') as HTMLInputElement,
      autoSummary: this.container.querySelector('#autoSummary') as HTMLInputElement,
      autoDownload: this.container.querySelector('#autoDownload') as HTMLInputElement,
      diyPromptText1: this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement,
      diyPromptText2: this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement,
      diyPromptText3: this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement,
    };

    inputs.promptType.value = settings.promptType.toString();
    inputs.language.value = settings.language;
    inputs.autoTtsSpeak.checked = settings.autoTtsSpeak;
    inputs.autoSummary.checked = settings.autoGenerate;
    inputs.autoDownload.checked = settings.autoDownload;
    inputs.diyPromptText1.value = settings.diyPromptText1;
    inputs.diyPromptText2.value = settings.diyPromptText2;
    inputs.diyPromptText3.value = settings.diyPromptText3;

    // Initialize API key section
    const commonKeyRadio = this.container.querySelector('#apiKeyTypeCommonKey') as HTMLInputElement;
    const yourKeyRadio = this.container.querySelector('#apiKeyTypeYourKey') as HTMLInputElement;
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const isCommonKey = settings.isCommonKey;
    
    const apiKey = await common.getApiKey(settings);
    if (isCommonKey) {
      commonKeyRadio.checked = true;
      apiKeyInput.readOnly = true;
    } else {
      yourKeyRadio.checked = true;
      apiKeyInput.readOnly = false;
    }
    this.loadApiKeySection(isCommonKey, apiKey);
    this.loadPromptVisibility(settings.promptType);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public async updateI18nAndAttachEvent(): Promise<void>   {
    this.updateApiKeySectionI18n();
    this.updateLanguageSectionI18n();
    this.updateAutoSettingsSectionI18n();
    this.updatePromptSectionI18n();

    const summarySettings = await settingsManager.getSummarySettings();
    const llmSettings = await settingsManager.getLlmSettings(); 
    this.load(summarySettings, llmSettings);

    this.attachApiKeyEventListeners();
    this.attachLanguageChangeEventListeners();
    this.attachCheckboxEventListeners();

    // Update dialog i18n
    this.dialog.updateI18nAndAttachEvent(i18n);
  }
}