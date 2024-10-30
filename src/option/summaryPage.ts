import { Language, defaultSummarySettings, SummarySettings } from '../common/settings';
import { defaultPromptText } from '../prompts/defaultPromptText';
import { settingsManager } from '../common/settingsManager';
import './css/basePage.css';
import './css/summaryPage.css';

export class SummaryPage {
  private container: HTMLElement;
  private settings: SummarySettings;
  private llmSettings: any;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'summary-container';
    this.settings = { ...defaultSummarySettings };
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.createSummaryControls();
    this.attachEventListeners();
  }

  private async loadSettings(): Promise<void> {
    this.settings = await settingsManager.getSummarySettings();
    this.llmSettings = await settingsManager.getLlmSettings();
  }

  private createSummaryControls(): void {
    const controls = document.createElement('div');
    controls.className = 'controls-container';

    // API Key Input
    const apiKeySection = document.createElement('div');
    apiKeySection.className = 'section';
    apiKeySection.innerHTML = `
      <label class="label">Gemini API Key</label>
      <input type="text" id="geminiApiKey" 
             class="input-field"
             value="${this.llmSettings.apiKey || ''}">
    `;

    // Language Selection
    const languageSection = document.createElement('div');
    languageSection.className = 'section';
    languageSection.innerHTML = `
      <label class="label">Summary Language</label>
      <select id="language" class="select-field">
        ${Object.entries(Language).map(([key, value]) => `
          <option value="${value}" ${this.settings.language === value ? 'selected' : ''}>
            ${key}
          </option>
        `).join('')}
      </select>
    `;

    // Auto Settings
    const autoSettingsSection = document.createElement('div');
    autoSettingsSection.className = 'section';
    autoSettingsSection.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoSummary" class="checkbox-input" 
               ${this.settings.autoSummary ? 'checked' : ''}>
        <label for="autoSummary" class="checkbox-label">Auto-generate summary when video loads</label>
      </div>
      <div class="checkbox-wrapper">
        <input type="checkbox" id="autoTtsSpeak" class="checkbox-input"
               ${this.settings.autoTtsSpeak ? 'checked' : ''}>
        <label for="autoTtsSpeak" class="checkbox-label">Stop video and speak summary automatically</label>
      </div>
    `;

    // Prompt Settings
    const promptSection = document.createElement('div');
    promptSection.className = 'section';
    promptSection.innerHTML = `
      <div class="section">
        <label class="label">Prompt Type</label>
        <select id="promptType" class="select-field">
          <option value="0" ${this.settings.promptType === 0 ? 'selected' : ''}>Default</option>
          <option value="1" ${this.settings.promptType === 1 ? 'selected' : ''}>Custom Prompt 1</option>
          <option value="2" ${this.settings.promptType === 2 ? 'selected' : ''}>Custom Prompt 2</option>
          <option value="3" ${this.settings.promptType === 3 ? 'selected' : ''}>Custom Prompt 3</option>
        </select>
      </div>

      <div class="section">
        <label class="label">Default Prompt (Read-only)</label>
        <div class="truncate-wrapper">
          <textarea id="defaultPromptText" rows="2" readonly
                    class="textarea-field readonly">${defaultPromptText}</textarea>
        </div>
      </div>

      ${[1, 2, 3].map(i => `
        <div class="section">
          <label class="label">Custom Prompt ${i}</label>
          <div class="truncate-wrapper">
            <textarea id="diyPromptText${i}" rows="2"
                      class="textarea-field">${this.settings[`diyPromptText${i}` as keyof SummarySettings] || ''}</textarea>
          </div>
        </div>
      `).join('')}
    `;

    // Prompt Variables Info
    const promptInfo = document.createElement('div');
    promptInfo.className = 'prompt-info';
    promptInfo.innerHTML = `
      <p class="prompt-info-title">Available variables for custom prompts:</p>
      <ul class="prompt-info-list">
        <li><code class="code-text">{videoTitle}</code>: The title of the YouTube video</li>
        <li><code class="code-text">{textTranscript}</code>: The full transcript of the video</li>
        <li><code class="code-text">{language}</code>: The language of the video</li>
      </ul>
    `;

    controls.appendChild(apiKeySection);
    controls.appendChild(languageSection);
    controls.appendChild(autoSettingsSection);
    controls.appendChild(promptSection);
    controls.appendChild(promptInfo);

    this.container.appendChild(controls);
  }

  private attachEventListeners(): void {
    // Handle settings changes
    const inputs = {
      geminiApiKey: this.container.querySelector('#geminiApiKey') as HTMLInputElement,
      promptType: this.container.querySelector('#promptType') as HTMLSelectElement,
      language: this.container.querySelector('#language') as HTMLSelectElement,
      autoTtsSpeak: this.container.querySelector('#autoTtsSpeak') as HTMLInputElement,
      autoSummary: this.container.querySelector('#autoSummary') as HTMLInputElement,
      diyPromptText1: this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement,
      diyPromptText2: this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement,
      diyPromptText3: this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement,
    };

    // Auto-save on change
    Object.values(inputs).forEach(input => {
      input.addEventListener('change', async () => {
        await this.saveSettings();
      });
    });
  }

  private async saveSettings(): Promise<void> {
    const inputs = {
      geminiApiKey: this.container.querySelector('#geminiApiKey') as HTMLInputElement,
      promptType: this.container.querySelector('#promptType') as HTMLSelectElement,
      language: this.container.querySelector('#language') as HTMLSelectElement,
      autoTtsSpeak: this.container.querySelector('#autoTtsSpeak') as HTMLInputElement,
      autoSummary: this.container.querySelector('#autoSummary') as HTMLInputElement,
      diyPromptText1: this.container.querySelector('#diyPromptText1') as HTMLTextAreaElement,
      diyPromptText2: this.container.querySelector('#diyPromptText2') as HTMLTextAreaElement,
      diyPromptText3: this.container.querySelector('#diyPromptText3') as HTMLTextAreaElement,
    };

    const summarySettings: SummarySettings = {
      promptType: parseInt(inputs.promptType.value),
      diyPromptText1: inputs.diyPromptText1.value,
      diyPromptText2: inputs.diyPromptText2.value,
      diyPromptText3: inputs.diyPromptText3.value,
      language: inputs.language.value,
      autoTtsSpeak: inputs.autoTtsSpeak.checked,
      autoSummary: inputs.autoSummary.checked,
    };

    await settingsManager.setLlmSettings({ 
      ...this.llmSettings, 
      apiKey: inputs.geminiApiKey.value 
    });
    await settingsManager.setSummarySettings(summarySettings);

    this.settings = summarySettings;
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
