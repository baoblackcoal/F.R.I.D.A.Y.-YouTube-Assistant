import { welcomeImage } from '../assets/welcome-image';
import './css/basePage.css';
import './css/generalPage.css';

export interface GeneralPageConfig {
  welcomeImage: string;
  languages: Language[];
}

export interface Language {
  code: string;
  label: string;
}

export class GeneralPage {
  private container: HTMLElement;
  private config: GeneralPageConfig = {
    welcomeImage: welcomeImage,
    languages: [
      { code: 'en', label: 'English' },
      { code: 'zh-CN', label: 'Simplified Chinese' },
      // Add more languages...
    ]
  };

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'general-page-container';
    this.init();
  }

  private createWelcomeSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'welcome-section';

    section.innerHTML = `
      <img src="friday_logo_128.png" alt="F.R.I.D.A.Y." class="h-24 w-24 mx-auto ">
      <h2 class="text-2xl font-bold mt-4">F.R.I.D.A.Y. YouTube Assistant</h2>
      <p class="">Hello! I'm F.R.I.D.A.Y.</p>
      <p class="mt-4 font-medium ">Your personal YouTube assistant.</p>
      <p class="mt-4 font-medium ">I can help you summarize YouTube videos, read them aloud, and more!</p>
    `;
    return section;
  }

  private createLanguageSelector(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-section';

    wrapper.innerHTML = `
      <label class="label">Language</label>
      <select id="language-selector" class="select-field">
      </select>
    `;

    const select = wrapper.querySelector('#language-selector') as HTMLSelectElement;

    this.config.languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.label;
      select.appendChild(option);
    });

    const checkbox = document.createElement('div');
    checkbox.className = 'checkbox-wrapper';
    checkbox.innerHTML = `
      <input type="checkbox" id="sync-language" class="checkbox-input">
      <label for="sync-language" class="checkbox-label">Sync language settings for TTS and LLM summary</label>
    `;

    wrapper.appendChild(select);
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
