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

    const img = document.createElement('img');
    img.src = this.config.welcomeImage;
    img.alt = 'Welcome to YouTube Summary';

    const label = document.createElement('h2');
    label.textContent = 'Welcome to YouTube Summary';

    section.appendChild(img);
    section.appendChild(label);

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
