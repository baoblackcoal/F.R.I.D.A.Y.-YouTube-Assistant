import { Language, ISummarySettings, ILlmSettings } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { defaultPromptText } from '../prompts/defaultPromptText';
import './css/basePage.css';
import './css/summaryPage.css';
import { i18n, I18nService } from '../common/i18n';
import { common } from '../common/common';
import { ISummaryPageDialog, SummaryPageDialog } from './summaryPageDialog';
import { geminiAPI } from '../common/geminiApi';
import { Toast } from '../common/toast';

export interface ISummaryPageView {
  updatePromptVisibility(promptType: number): void;
  updateApiKeySection(isCommonKey: boolean, apiKey: string): void;
  getFormValues(): {
    apiKeyType: string;
    geminiApiKey: string;
    promptType: number;
    language: string;
    autoTtsSpeak: boolean;
    autoSummary: boolean;
    diyPromptText1: string;
    diyPromptText2: string;
    diyPromptText3: string;
  };
  initialize(settings: ISummarySettings, llmSettings: ILlmSettings): void;
  getElement(): HTMLElement;
  updateI18n(): void;
}

export class SummaryPageView implements ISummaryPageView {
  private container: HTMLElement;
  private dialog: ISummaryPageDialog;

  constructor(
    private readonly onSettingsChangeToSave: () => Promise<void>,
    private readonly onPromptEdit: (promptId: number, value: string) => void,
  ) {
    this.container = document.createElement('div');
    this.container.className = 'page-container';
    this.dialog = new SummaryPageDialog(this.container, this.onPromptEdit, i18n);
    this.createLayout();
  }

  private createLayout(): void {
    this.container.appendChild(this.createApiKeySection());
    this.container.appendChild(this.createLanguageSection());
    this.container.appendChild(this.createAutoSettingsSection());
    this.container.appendChild(this.createPromptSection());

    this.attachApiKeyEventListeners();
    this.attachLanguageChangeEventListeners();
    this.attachCheckboxEventListeners();
  }

  private attachCheckboxEventListeners(): void {
    // Attach event listeners to checkboxes
    const autoSummaryCheckbox = this.container.querySelector('#autoSummary') as HTMLInputElement;
    autoSummaryCheckbox.addEventListener('change', () => this.onSettingsChangeToSave());

    const autoTtsSpeakCheckbox = this.container.querySelector('#autoTtsSpeak') as HTMLInputElement;
    autoTtsSpeakCheckbox.addEventListener('change', () => this.onSettingsChangeToSave());
  }

  private async attachLanguageChangeEventListeners(): Promise<void> {
    // Listen for language changes from other pages
    window.addEventListener('generalLanguageChanged', async (event: Event) => {
      const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
      const generalSettings = await settingsManager.getGeneralSettings();
      if (generalSettings.syncLanguage) {
        const customEvent = event as CustomEvent<{language: Language}>;
        const { language } = customEvent.detail;
        languageSelect.value = language;
        await this.onSettingsChangeToSave();
      }
    });

    // Listen for language changes from this page
    const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
    languageSelect.addEventListener('change', async (event: Event) => {
      const generalSettings = await settingsManager.getGeneralSettings();
      generalSettings.syncLanguage = false;
      await settingsManager.setGeneralSettings(generalSettings);
      await this.onSettingsChangeToSave();
      window.dispatchEvent(new CustomEvent('generalLanguageSyncChanged', {
        detail: { syncLanguage: generalSettings.syncLanguage }
      }));
    });
  }

  private createApiKeySection(): HTMLElement {
    const section = document.createElement('div');
    section.id = 'apiKeySection';
    section.className = 'section';
    section.innerHTML = `
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
      <button id="testApiKey" class="base-button">${i18n.getMessage('option_summary_test_button')}</button>
      
      <div id="apiKeyInfoCommonKey" class="api-key-info api-key-info-common">
        <p class="mb-2"><strong>${i18n.getMessage('option_summary_common_key_info_title')}</strong></p>
        <p>${i18n.getMessage('option_summary_common_key_description')}</p>
        <ul class="list-disc ml-4 mt-2">
          <li>${i18n.getMessage('option_summary_common_key_limit_rpm')}</li>
          <li>${i18n.getMessage('option_summary_common_key_limit_tpm')}</li>
          <li>${i18n.getMessage('option_summary_common_key_limit_rpd')}</li>
        </ul>
        <p class="mt-2">${i18n.getMessage('option_summary_gemini_flash_1_5_pricing')}
          <a href="https://ai.google.dev/pricing#1_5flash" target="_blank" rel="noopener noreferrer">
            Gemini Flash 1.5 Pricing
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
        <p class="mt-2">${i18n.getMessage('option_summary_custom_key_description')} <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
            Google Cloud Console
          </a>
        </p>
      </div>
    `;
    return section;
  }

  private createLanguageSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `
      <label class="label">${i18n.getMessage('option_summary_language_label')}</label>
      <select id="language" class="select">
        ${Object.values(Language).map(lang => `
          <option value="${lang}">${i18n.getLanguageLabel(lang)}</option>
        `).join('')}
      </select>
    `;
    return section;
  }

  private createAutoSettingsSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoSummary" class="checkbox-input">
        <label for="autoSummary" class="checkbox-label">${i18n.getMessage('option_summary_auto_summary')}</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoTtsSpeak" class="checkbox-input">
        <label for="autoTtsSpeak" class="checkbox-label">${i18n.getMessage('option_summary_auto_tts')}</label>
      </div>
    `;
    return section;
  }

  private createPromptSection(): HTMLElement {
    const section = document.createElement('div');
    section.id = 'promptSection';
    section.className = 'section';
    section.innerHTML = `
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
                      class="textarea-field readonly">${defaultPromptText}</textarea>
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
    return section;
  }

  public updatePromptVisibility(promptType: number): void {
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

  public updateApiKeySection(isCommonKey: boolean, apiKey: string): void {
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const commonKeyInfo = this.container.querySelector('#apiKeyInfoCommonKey') as HTMLElement;
    const yourKeyInfo = this.container.querySelector('#apiKeyInfoYourKey') as HTMLElement;

    let displayKey = '';
    if (apiKey !== '') {
      displayKey = apiKey.replace(/.{6}$/, '******');
    }
    apiKeyInput.value = displayKey;
    if (isCommonKey) {
      apiKeyInput.readOnly = true;
    } else {
      apiKeyInput.readOnly = false;
    }

    commonKeyInfo.style.display = isCommonKey ? 'block' : 'none';
    yourKeyInfo.style.display = isCommonKey ? 'none' : 'block';
  }

  public getFormValues() {
    const inputs = {
      apiKeyType: this.container.querySelector('input[name="apiKeyType"]:checked') as HTMLInputElement,
      geminiApiKey: this.container.querySelector('#geminiApiKey') as HTMLInputElement,
      promptType: this.container.querySelector('#promptType') as HTMLSelectElement,
      language: this.container.querySelector('#language') as HTMLSelectElement,
      autoTtsSpeak: this.container.querySelector('#autoTtsSpeak') as HTMLInputElement,
      autoSummary: this.container.querySelector('#autoSummary') as HTMLInputElement,
      diyPromptText1: this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement,
      diyPromptText2: this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement,
      diyPromptText3: this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement,
    };

    return {
      apiKeyType: inputs.apiKeyType.value,
      geminiApiKey: inputs.geminiApiKey.value,
      promptType: parseInt(inputs.promptType.value),
      language: inputs.language.value,
      autoTtsSpeak: inputs.autoTtsSpeak.checked,
      autoSummary: inputs.autoSummary.checked,
      diyPromptText1: inputs.diyPromptText1.value,
      diyPromptText2: inputs.diyPromptText2.value,
      diyPromptText3: inputs.diyPromptText3.value,
    };
  }

  private async handleApiKeyChange(target: HTMLElement): Promise<void> {
    const isCommonKey = (target as HTMLInputElement).value === 'Common Key';
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    
    await this.onSettingsChangeToSave();
    
    const llmSettings = await settingsManager.getLlmSettings();
    const apiKey = common.getApiKey(llmSettings);
    // if (isCommonKey) {
    //     // apiKeyInput.value = 'AIzaSyDkPJhsoRJcLvbYurWIWtf_***********';
    //     // apiKeyInput.value = 'AIzaSyDkPJhsoRJcLvbYurWIWtf_n50izLzSGN4';
    //     // apiKeyInput.readOnly = true;
    // } else {    
    //   // const llmSettings = await settingsManager.getLlmSettings();
    //   // apiKeyInput.value = llmSettings.userApiKey || '';
    //   // apiKeyInput.readOnly = false;
    // }
    
    this.updateApiKeySection(isCommonKey, apiKey);
  }

  private async onTestApiKey(): Promise<void> {
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const testButton = this.container.querySelector('#testApiKey') as HTMLButtonElement;
    
    // Disable the test button while testing
    testButton.disabled = true;
    testButton.textContent = i18n.getMessage('option_summary_testing');
    
    try {
        // Get the current API key
        const llmSettings = await settingsManager.getLlmSettings();
        const apiKey = common.getApiKey(llmSettings);
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

    // Handle geminiApiKey input change
    const geminiApiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    geminiApiKeyInput.addEventListener('change', async () => {
      const key = geminiApiKeyInput.value.trim();
      if (key) {
        const llmSettings = await settingsManager.getLlmSettings();
        llmSettings.userApiKey = key;
        await settingsManager.setLlmSettings(llmSettings);
      }
    });

    // Handle prompt editing
    const promptTypeSelect = this.container.querySelector('#promptType') as HTMLSelectElement;
    promptTypeSelect.addEventListener('change', (e) => {
      const newType = parseInt((e.target as HTMLSelectElement).value);
      this.updatePromptVisibility(newType);
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

  public async initialize(settings: ISummarySettings, llmSettings: ILlmSettings): Promise<void> {
    // Initialize form values
    const inputs = {
      promptType: this.container.querySelector('#promptType') as HTMLSelectElement,
      language: this.container.querySelector('#language') as HTMLSelectElement,
      autoTtsSpeak: this.container.querySelector('#autoTtsSpeak') as HTMLInputElement,
      autoSummary: this.container.querySelector('#autoSummary') as HTMLInputElement,
      diyPromptText1: this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement,
      diyPromptText2: this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement,
      diyPromptText3: this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement,
    };

    inputs.promptType.value = settings.promptType.toString();
    inputs.language.value = settings.language;
    inputs.autoTtsSpeak.checked = settings.autoTtsSpeak;
    inputs.autoSummary.checked = settings.autoSummary;
    inputs.diyPromptText1.value = settings.diyPromptText1;
    inputs.diyPromptText2.value = settings.diyPromptText2;
    inputs.diyPromptText3.value = settings.diyPromptText3;

    // Initialize API key section
    const commonKeyRadio = this.container.querySelector('#apiKeyTypeCommonKey') as HTMLInputElement;
    const yourKeyRadio = this.container.querySelector('#apiKeyTypeYourKey') as HTMLInputElement;
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    const isCommonKey = llmSettings.isCommonKey;
    
    const apiKey = common.getApiKey(llmSettings);
    if (isCommonKey) {
      commonKeyRadio.checked = true;
      apiKeyInput.readOnly = true;
    } else {
      yourKeyRadio.checked = true;
      apiKeyInput.readOnly = false;
    }
    
    this.updateApiKeySection(isCommonKey, apiKey);
    this.updatePromptVisibility(settings.promptType);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public updateI18n(): void {
    // API Key Section
    const apiKeyElements = {
        apiKeyLabel: this.container.querySelector('#apiKeySection .label'),
        commonKeyLabel: this.container.querySelector('[for="apiKeyTypeCommonKey"]'),
        yourKeyLabel: this.container.querySelector('[for="apiKeyTypeYourKey"]'),
        testButton: this.container.querySelector('#testApiKey'),
        commonKeyInfoTitle: this.container.querySelector('#apiKeyInfoCommonKey strong'),
        commonKeyDescription: this.container.querySelector('#apiKeyInfoCommonKey > p:nth-child(2)'),
        commonKeyLimitRpm: this.container.querySelector('#apiKeyInfoCommonKey li:nth-child(1)'),
        commonKeyLimitTpm: this.container.querySelector('#apiKeyInfoCommonKey li:nth-child(2)'),
        commonKeyLimitRpd: this.container.querySelector('#apiKeyInfoCommonKey li:nth-child(3)'),
        commonKeyMoreInfo: this.container.querySelector('#apiKeyInfoCommonKey > p:nth-child(4)'),
        yourKeyInfoTitle: this.container.querySelector('#apiKeyInfoYourKey strong'),
        yourKeyBenefitsTitle: this.container.querySelector('#apiKeyInfoYourKey > p:nth-child(2)'),
        yourKeyBenefitLimits: this.container.querySelector('#apiKeyInfoYourKey li:nth-child(1)'),
        yourKeyBenefitQuota: this.container.querySelector('#apiKeyInfoYourKey li:nth-child(2)'),
        yourKeyBenefitControl: this.container.querySelector('#apiKeyInfoYourKey li:nth-child(3)'),
        yourKeyMoreInfo: this.container.querySelector('#apiKeyInfoYourKey > p:nth-child(4)')
    };

    // Language Section
    const languageElements = {
        languageLabel: this.container.querySelector('#language')?.previousElementSibling
    };

    // Auto Settings Section
    const autoSettingsElements = {
        autoSummaryLabel: this.container.querySelector('[for="autoSummary"]'),
        autoTtsSpeakLabel: this.container.querySelector('[for="autoTtsSpeak"]')
    };

    // Prompt Section
    const promptElements = {
        promptTypeLabel: this.container.querySelector('#promptTypeSection .label'),
        defaultOption: this.container.querySelector('#promptType option[value="0"]'),
        defaultPromptLabel: this.container.querySelector('#defaultPrompt .label'),
        dialogTitle: this.container.querySelector('#dialogPromptTitle'),
        dialogVariablesTitle: this.container.querySelector('.prompt-info-title'),
        dialogVariableTitle: this.container.querySelector('.prompt-info-list li:nth-child(1)'),
        dialogVariableTranscript: this.container.querySelector('.prompt-info-list li:nth-child(2)'),
        dialogVariableLanguage: this.container.querySelector('.prompt-info-list li:nth-child(3)'),
        dialogSaveButton: this.container.querySelector('#dialogSave'),
        dialogCancelButton: this.container.querySelector('#dialogCancel')
    };

    // Update API Key Section
    if (apiKeyElements.apiKeyLabel) {
        apiKeyElements.apiKeyLabel.textContent = i18n.getMessage('option_summary_api_key_section');
    }
    if (apiKeyElements.commonKeyLabel) {
        apiKeyElements.commonKeyLabel.textContent = i18n.getMessage('option_summary_common_key');
    }
    if (apiKeyElements.yourKeyLabel) {
        apiKeyElements.yourKeyLabel.textContent = i18n.getMessage('option_summary_your_key');
    }
    if (apiKeyElements.testButton) {
        apiKeyElements.testButton.textContent = i18n.getMessage('option_summary_test_button');
    }
    if (apiKeyElements.commonKeyInfoTitle) {
        apiKeyElements.commonKeyInfoTitle.textContent = i18n.getMessage('option_summary_common_key_info_title');
    }
    if (apiKeyElements.commonKeyDescription) {
        apiKeyElements.commonKeyDescription.textContent = i18n.getMessage('option_summary_common_key_description');
    }
    if (apiKeyElements.commonKeyLimitRpm) {
        apiKeyElements.commonKeyLimitRpm.textContent = i18n.getMessage('option_summary_common_key_limit_rpm');
    }
    if (apiKeyElements.commonKeyLimitTpm) {
        apiKeyElements.commonKeyLimitTpm.textContent = i18n.getMessage('option_summary_common_key_limit_tpm');
    }
    if (apiKeyElements.commonKeyLimitRpd) {
        apiKeyElements.commonKeyLimitRpd.textContent = i18n.getMessage('option_summary_common_key_limit_rpd');
    }
    if (apiKeyElements.commonKeyMoreInfo) {
        apiKeyElements.commonKeyMoreInfo.innerHTML = `${i18n.getMessage('option_summary_gemini_flash_1_5_pricing')}
        <a href="https://ai.google.dev/pricing#1_5flash" target="_blank" rel="noopener noreferrer">
          Gemini Flash 1.5 Pricing
        </a>`;
    }
    if (apiKeyElements.yourKeyInfoTitle) {
        apiKeyElements.yourKeyInfoTitle.textContent = i18n.getMessage('option_summary_custom_key_title');
    }
    if (apiKeyElements.yourKeyBenefitsTitle) {
        apiKeyElements.yourKeyBenefitsTitle.textContent = i18n.getMessage('option_summary_custom_key_benefits');
    }
    if (apiKeyElements.yourKeyBenefitLimits) {
        apiKeyElements.yourKeyBenefitLimits.textContent = i18n.getMessage('option_summary_custom_key_benefit_limits');
    }
    if (apiKeyElements.yourKeyBenefitQuota) {
        apiKeyElements.yourKeyBenefitQuota.textContent = i18n.getMessage('option_summary_custom_key_benefit_quota');
    }
    if (apiKeyElements.yourKeyBenefitControl) {
        apiKeyElements.yourKeyBenefitControl.textContent = i18n.getMessage('option_summary_custom_key_benefit_control');
    }
    if (apiKeyElements.yourKeyMoreInfo) {
        apiKeyElements.yourKeyMoreInfo.innerHTML = `${i18n.getMessage('option_summary_custom_key_description')} <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
        Google Cloud Console
      </a>`;
    }

    // Update Language Section
    if (languageElements.languageLabel) {
        languageElements.languageLabel.textContent = i18n.getMessage('option_summary_language_label');
    }

    // Update Auto Settings Section
    if (autoSettingsElements.autoSummaryLabel) {
        autoSettingsElements.autoSummaryLabel.textContent = i18n.getMessage('option_summary_auto_summary');
    }
    if (autoSettingsElements.autoTtsSpeakLabel) {
        autoSettingsElements.autoTtsSpeakLabel.textContent = i18n.getMessage('option_summary_auto_tts');
    }

    // Update Prompt Section
    if (promptElements.promptTypeLabel) {
        promptElements.promptTypeLabel.textContent = i18n.getMessage('option_summary_prompt_type');
    }
    if (promptElements.defaultOption) {
        promptElements.defaultOption.textContent = i18n.getMessage('option_summary_prompt_default');
    }
    if (promptElements.defaultPromptLabel) {
        promptElements.defaultPromptLabel.textContent = i18n.getMessage('option_summary_prompt_default_readonly');
    }
    if (promptElements.dialogTitle) {
        promptElements.dialogTitle.textContent = i18n.getMessage('option_summary_prompt_edit_dialog_title');
    }
    if (promptElements.dialogVariablesTitle) {
        promptElements.dialogVariablesTitle.textContent = i18n.getMessage('option_summary_prompt_variables_title');
    }
    if (promptElements.dialogVariableTitle) {
        promptElements.dialogVariableTitle.textContent = i18n.getMessage('option_summary_prompt_variable_title');
    }
    if (promptElements.dialogVariableTranscript) {
        promptElements.dialogVariableTranscript.textContent = i18n.getMessage('option_summary_prompt_variable_transcript');
    }
    if (promptElements.dialogVariableLanguage) {
        promptElements.dialogVariableLanguage.textContent = i18n.getMessage('option_summary_prompt_variable_language');
    }
    if (promptElements.dialogSaveButton) {
        promptElements.dialogSaveButton.textContent = i18n.getMessage('option_summary_prompt_save');
    }
    if (promptElements.dialogCancelButton) {
        promptElements.dialogCancelButton.textContent = i18n.getMessage('option_summary_prompt_cancel');
    }

    // Update Custom Prompt Options and Labels
    [1, 2, 3].forEach(i => {
        const option = this.container.querySelector(`#promptType option[value="${i}"]`);
        const label = this.container.querySelector(`#diyPrompt${i} .label`);
        const editButton = this.container.querySelector(`#editPrompt${i}`);

        if (option) {
            option.textContent = i18n.getMessageWithParams('option_summary_prompt_custom', { number: i.toString() });
        }
        if (label) {
            label.textContent = i18n.getMessageWithParams('option_summary_prompt_custom_label', { number: i.toString() });
        }
        if (editButton) {
            editButton.textContent = i18n.getMessage('option_summary_prompt_edit');
        }
    });

    // Update dialog i18n
    this.dialog.updateI18n(i18n);
  }
}