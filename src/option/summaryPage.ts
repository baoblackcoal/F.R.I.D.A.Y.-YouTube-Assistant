import { Language, defaultSummarySettings, SummarySettings } from '../common/settings';
import { defaultPromptText } from '../prompts/defaultPromptText';
import { settingsManager } from '../common/settingsManager';

export class SummaryPage {
  private container: HTMLElement;
  private settings: SummarySettings;
  private llmSettings: any; // Replace with proper interface

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'p-6 space-y-6';
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
    controls.className = 'space-y-6';

    // API Key Input
    const apiKeySection = document.createElement('div');
    apiKeySection.className = 'space-y-2';
    apiKeySection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">Gemini API Key</label>
      <input type="text" id="geminiApiKey" 
             class="w-full px-3 py-2 border rounded-md"
             value="${this.llmSettings.apiKey || ''}">
    `;

    // Language Selection
    const languageSection = document.createElement('div');
    languageSection.className = 'space-y-2';
    languageSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">Summary Language</label>
      <select id="language" class="w-full p-2 border rounded-md">
        ${Object.entries(Language).map(([key, value]) => `
          <option value="${value}" ${this.settings.language === value ? 'selected' : ''}>
            ${key}
          </option>
        `).join('')}
      </select>
    `;

    // Auto Settings
    const autoSettingsSection = document.createElement('div');
    autoSettingsSection.className = 'space-y-4';
    autoSettingsSection.innerHTML = `
      <div class="flex items-center space-x-2">
        <input type="checkbox" id="autoSummary" class="rounded" 
               ${this.settings.autoSummary ? 'checked' : ''}>
        <label for="autoSummary">Auto-generate summary when video loads</label>
      </div>
      <div class="flex items-center space-x-2">
        <input type="checkbox" id="autoTtsSpeak" class="rounded"
               ${this.settings.autoTtsSpeak ? 'checked' : ''}>
        <label for="autoTtsSpeak">Stop video and speak summary automatically</label>
      </div>
    `;

    // Prompt Settings
    const promptSection = document.createElement('div');
    promptSection.className = 'space-y-4';
    promptSection.innerHTML = `
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Prompt Type</label>
        <select id="promptType" class="w-full p-2 border rounded-md">
          <option value="0" ${this.settings.promptType === 0 ? 'selected' : ''}>Default</option>
          <option value="1" ${this.settings.promptType === 1 ? 'selected' : ''}>Custom Prompt 1</option>
          <option value="2" ${this.settings.promptType === 2 ? 'selected' : ''}>Custom Prompt 2</option>
          <option value="3" ${this.settings.promptType === 3 ? 'selected' : ''}>Custom Prompt 3</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Default Prompt (Read-only)</label>
        <div class="truncate-wrapper">
          <textarea id="defaultPromptText" rows="2" readonly
                    class="w-full p-2 border rounded-md bg-gray-50">${defaultPromptText}</textarea>
          <button class="expand-btn" data-target="defaultPromptText">Expand</button>
        </div>
      </div>

      ${[1, 2, 3].map(i => `
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700">Custom Prompt ${i}</label>
          <div class="truncate-wrapper">
            <textarea id="diyPromptText${i}" rows="2"
                      class="w-full p-2 border rounded-md">${this.settings[`diyPromptText${i}` as keyof SummarySettings] || ''}</textarea>
            <button class="expand-btn" data-target="diyPromptText${i}">Expand</button>
          </div>
        </div>
      `).join('')}
    `;

    // Prompt Variables Info
    const promptInfo = document.createElement('div');
    promptInfo.className = 'bg-gray-50 p-4 rounded-md mt-4';
    promptInfo.innerHTML = `
      <p class="text-sm text-gray-700 mb-2">Available variables for custom prompts:</p>
      <ul class="list-disc list-inside text-sm text-gray-600">
        <li><code>{videoTitle}</code>: The title of the YouTube video</li>
        <li><code>{textTranscript}</code>: The full transcript of the video</li>
        <li><code>{language}</code>: The language of the video</li>
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
    // Handle textarea expansion
    const expandButtons = this.container.querySelectorAll('.expand-btn');
    expandButtons.forEach(button => {
      button.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const targetId = target.getAttribute('data-target');
        if (targetId) {
          const textarea = this.container.querySelector(`#${targetId}`) as HTMLTextAreaElement;
          const isExpanded = textarea.classList.toggle('expanded');
          target.textContent = isExpanded ? 'Collapse' : 'Expand';
          textarea.rows = isExpanded ? 6 : 2;
        }
      });
    });

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
