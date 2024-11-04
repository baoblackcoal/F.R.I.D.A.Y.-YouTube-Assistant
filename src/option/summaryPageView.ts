import { Language, ISummarySettings } from '../common/ISettings';
import { settingsManager } from '../common/settingsManager';
import { defaultPromptText } from '../prompts/defaultPromptText';
import './css/basePage.css';
import './css/summaryPage.css';

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
  initialize(settings: ISummarySettings, llmSettings: any): void;
  getElement(): HTMLElement;
}

export class SummaryPageView implements ISummaryPageView {
  private container: HTMLElement;
  private dialog!: HTMLDialogElement;

  constructor(
    private readonly onSettingsChange: () => void,
    private readonly onPromptEdit: (promptId: number, value: string) => void
  ) {
    this.container = document.createElement('div');
    this.container.className = 'page-container';
    this.createLayout();
  }

  private createLayout(): void {
    this.container.appendChild(this.createApiKeySection());
    this.container.appendChild(this.createLanguageSection());
    this.container.appendChild(this.createAutoSettingsSection());
    this.container.appendChild(this.createPromptSection());

    this.createPromptEditDialog();
    this.attachEventListeners();
  }

  private createApiKeySection(): HTMLElement {
    const section = document.createElement('div');
    section.id = 'apiKeySection';
    section.className = 'section';
    section.innerHTML = `
      <label class="label">Gemini API Key</label>
      <div class="radio-wrapper">
        <input type="radio" name="apiKeyType" id="apiKeyTypeCommonKey" value="Common Key">
        <label for="apiKeyTypeCommonKey" class="radio-label">Common Key</label>

        <input type="radio" name="apiKeyType" id="apiKeyTypeYourKey" value="Your Key">
        <label for="apiKeyTypeYourKey" class="radio-label">Your Key</label>
      </div>
      <input type="text" id="geminiApiKey" class="input-field">
      <button id="testApiKey" class="base-button">Test</button>
      
      <div id="apiKeyInfoCommonKey" class="api-key-info api-key-info-common">
        <p class="mb-2"><strong>Common Key Information:</strong></p>
        <p>Use the Common Key, which is a shared key with the following limits:</p>
        <ul class="list-disc ml-4 mt-2">
          <li>15 requests per minute (RPM)</li>
          <li>1 million tokens per minute (TPM)</li>
          <li>1,500 requests per day (RPD)</li>
        </ul>
        <p class="mt-2">For more details, refer to the 
          <a href="https://ai.google.dev/pricing#1_5flash" target="_blank" rel="noopener noreferrer">
            Gemini Flash 1.5 Pricing
          </a>
        </p>
      </div>

      <div id="apiKeyInfoYourKey" class="api-key-info api-key-info-custom">
        <p class="mb-2"><strong>Custom API Key Setup:</strong></p>
        <p>Get your personal API key from the 
          <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
            Google Cloud Console
          </a>
        </p>
        <p class="mt-2">Using your own API key provides:</p>
        <ul class="list-disc ml-4 mt-2">
          <li>Higher rate limits</li>
          <li>Independent quota management</li>
          <li>Better control over API usage</li>
        </ul>
      </div>
    `;
    return section;
  }

  private createLanguageSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `
      <label class="label">Summary Language</label>
      <select id="language" class="select">
        ${Object.entries(Language).map(([key, value]) => `
          <option value="${value}">${key}</option>
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
        <label for="autoSummary" class="checkbox-label">Auto-generate summary when video loads</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoTtsSpeak" class="checkbox-input">
        <label for="autoTtsSpeak" class="checkbox-label">Stop video and speak summary automatically</label>
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
        <label class="label">Prompt Type</label>
        <select id="promptType" class="select">
          <option value="0">Default</option>
          <option value="1">Custom Prompt 1</option>
          <option value="2">Custom Prompt 2</option>
          <option value="3">Custom Prompt 3</option>
        </select>
      </div>

      <div id="promptContentSection">
        <div id="defaultPrompt" class="sub-section prompt-content">
          <label class="label">Default Prompt (Read-only)</label>
          <div class="truncate-wrapper">
            <textarea id="defaultPromptText" rows="15" readonly
                      class="textarea-field readonly">${defaultPromptText}</textarea>
          </div>
        </div>

        ${[1, 2, 3].map(i => `
          <div id="diyPrompt${i}" class="sub-section prompt-content" style="display: none;">
            <label class="label">Custom Prompt ${i}</label>
            <div class="truncate-wrapper">
              <textarea id="diyPromptText${i}" rows="15" readonly
                        class="textarea-field"></textarea>
            </div>
            <button id="editPrompt${i}" class="base-button edit-prompt-btn">Edit</button>
          </div>
        `).join('')}
      </div>
    `;
    return section;
  }

  private createPromptEditDialog(): void {
    const dialogHTML = `
      <dialog id="promptEditDialog" class="prompt-edit-dialog">
        <div class="dialog-content">
          <h2 id="dialogPromptTitle" class="dialog-title">Edit Custom Prompt</h2>
          <div class="prompt-info">
            <p class="prompt-info-title">Available variables for custom prompts:</p>
            <ul class="prompt-info-list">
              <li><code class="code-text">{videoTitle}</code>: The title of the YouTube video</li>
              <li><code class="code-text">{textTranscript}</code>: The full transcript of the video</li>
              <li><code class="code-text">{language}</code>: The language of the video</li>
            </ul>
          </div>
          <textarea id="dialogPromptText" rows="20" class="dialog-textarea"></textarea>
          <div class="dialog-buttons">
            <button id="dialogSave" class="base-button">Save</button>
            <button id="dialogCancel" class="base-button secondary">Cancel</button>
          </div>
        </div>
      </dialog>
    `;
    this.container.insertAdjacentHTML('beforeend', dialogHTML);
    this.dialog = this.container.querySelector('#promptEditDialog') as HTMLDialogElement;
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

    if (isCommonKey) {
      apiKeyInput.value = 'AIzaSyDkPJhsoRJcLvbYurWIWtf_n50izLzSGN4';
      apiKeyInput.readOnly = true;
    } else {
      apiKeyInput.value = apiKey || '';
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

  private attachEventListeners(): void {
    // Handle form changes
    this.container.addEventListener('change', async (e) => {
      const target = e.target as HTMLElement;
      
      // Special handling for API key type radio buttons
      const isCommonKey = (target as HTMLInputElement).value === 'Common Key';
      if (target.getAttribute('name') === 'apiKeyType') {
        const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
        
        if (isCommonKey) {
            apiKeyInput.value = 'AIzaSyDkPJhsoRJcLvbYurWIWtf_***********';
            // apiKeyInput.value = 'AIzaSyDkPJhsoRJcLvbYurWIWtf_n50izLzSGN4';
            apiKeyInput.readOnly = true;
        } else {    
          const llmSettings = await settingsManager.getLlmSettings();
          apiKeyInput.value = llmSettings.apiKey || '';
          apiKeyInput.readOnly = false;
        }
        
        this.updateApiKeySection(isCommonKey, apiKeyInput.value);
      }
      
      if (!isCommonKey) {
        this.onSettingsChange();
      }
    });

    // Handle prompt editing
    const promptTypeSelect = this.container.querySelector('#promptType') as HTMLSelectElement;
    promptTypeSelect.addEventListener('change', (e) => {
      const newType = parseInt((e.target as HTMLSelectElement).value);
      this.updatePromptVisibility(newType);
    });

    // Handle edit buttons
    [1, 2, 3].forEach(i => {
      const editBtn = this.container.querySelector(`#editPrompt${i}`) as HTMLButtonElement;
      editBtn?.addEventListener('click', () => {
        const promptTextarea = this.container.querySelector(`#diyPromptText${i}`) as HTMLTextAreaElement;
        const dialogTextarea = this.dialog.querySelector('#dialogPromptText') as HTMLTextAreaElement;
        dialogTextarea.value = promptTextarea.value;
        this.dialog.setAttribute('data-prompt-id', i.toString());
        this.dialog.showModal();
      });
    });

    // Handle dialog buttons
    const saveBtn = this.dialog.querySelector('#dialogSave');
    const cancelBtn = this.dialog.querySelector('#dialogCancel');

    saveBtn?.addEventListener('click', () => {
      const promptId = parseInt(this.dialog.getAttribute('data-prompt-id') || '0');
      const dialogTextarea = this.dialog.querySelector('#dialogPromptText') as HTMLTextAreaElement;
      this.onPromptEdit(promptId, dialogTextarea.value);
      this.dialog.close();
    });

    cancelBtn?.addEventListener('click', () => {
      this.dialog.close();
    });
  }

  public initialize(settings: ISummarySettings, llmSettings: any): void {
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
    const isCommonKey = !llmSettings.apiKey || llmSettings.apiKey === 'AIzaSyDkPJhsoRJcLvbYurWIWtf_n50izLzSGN4';
    const commonKeyRadio = this.container.querySelector('#apiKeyTypeCommonKey') as HTMLInputElement;
    const yourKeyRadio = this.container.querySelector('#apiKeyTypeYourKey') as HTMLInputElement;
    const apiKeyInput = this.container.querySelector('#geminiApiKey') as HTMLInputElement;
    
    if (isCommonKey) {
      commonKeyRadio.checked = true;
      apiKeyInput.readOnly = true;
    } else {
      yourKeyRadio.checked = true;
      apiKeyInput.readOnly = false;
    }
    
    this.updateApiKeySection(isCommonKey, llmSettings.apiKey);
    this.updatePromptVisibility(settings.promptType);
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}