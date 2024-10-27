import { GeneralPageConfig, Language } from './types';
import { welcomeImage } from '../assets/welcome-image';

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
    this.container.className = 'p-6 space-y-8';
    this.init();
  }

  private createWelcomeSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'welcome-section text-center';

    const img = document.createElement('img');
    img.src = this.config.welcomeImage;
    img.className = 'mx-auto w-[500px] h-[200px] object-cover rounded-lg';
    img.alt = 'Welcome to YouTube Summary';

    const label = document.createElement('h2');
    label.className = 'text-2xl font-bold mt-4';
    label.textContent = 'Welcome to YouTube Summary';

    section.appendChild(img);
    section.appendChild(label);

    return section;
  }

  private createLanguageSelector(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'language-section space-y-4';

    const select = document.createElement('select');
    select.className = 'w-full p-2 border rounded-md';
    select.id = 'language-selector';

    this.config.languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.label;
      select.appendChild(option);
    });

    const checkbox = document.createElement('div');
    checkbox.className = 'flex items-center space-x-2';
    checkbox.innerHTML = `
      <input type="checkbox" id="sync-language" class="rounded">
      <label for="sync-language">Sync language settings for TTS and LLM summary</label>
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
