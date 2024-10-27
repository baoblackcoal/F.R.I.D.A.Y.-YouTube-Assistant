import { TtsSettings, defaultTtsSettings, speedOptions as TtsSpeedOptions, pitchOptions as TtsPitchOptions, ApiType } from '../common/settings';
import { settingsManager } from '../common/settingsManager';
import { TTSSpeak, VoiceInfo } from '../contentscript/ttsSpeak';
import { listenToMessages } from '../contentscript/msTtsService';
import { MessageObserver } from '../utils/messageObserver';
import { ITtsMessage } from '../utils/messageQueue';

export class TTSPage {
  private container: HTMLElement;
  private settings: TtsSettings;
  private tts: TTSSpeak;
  private messageObserver: MessageObserver;
  private azureTtsListend: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'p-6 space-y-6';
    this.tts = TTSSpeak.getInstance();
    this.messageObserver = MessageObserver.getInstance();
    this.settings = { ...defaultTtsSettings };
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadSettings();
    this.createTTSControls();
    await this.loadTtsVoices();
    this.attachEventListeners();
  }

  private async loadSettings(): Promise<void> {
    this.settings = await settingsManager.getTtsSettings();
  }

  private async loadTtsVoices(): Promise<void> {
    if (this.settings.apiType === ApiType.Azure && !this.azureTtsListend) {
      this.azureTtsListend = true;
      await this.messageObserver.updateObserverType();
      listenToMessages();
    }

    this.tts.getVoiceNames((voices: VoiceInfo[]) => {
      this.populateLanguageOptions(voices);
      this.populateVoiceOptions(voices);
      this.populateSpeedAndPitchOptions();
      this.populateTtsTypeOptions();
    });
  }

  private createTTSControls(): void {
    const controls = document.createElement('div');
    controls.className = 'space-y-6';

    // TTS Type Selection
    const ttsTypeSection = document.createElement('div');
    ttsTypeSection.className = 'space-y-2';
    ttsTypeSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">TTS Type</label>
      <select id="ttsType" class="w-full p-2 border rounded-md">
      </select>
    `;

    // Language Selection
    const languageSection = document.createElement('div');
    languageSection.className = 'space-y-2';
    languageSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">Language</label>
      <select id="language" class="w-full p-2 border rounded-md">
      </select>
    `;

    // Voice Selection
    const voiceSection = document.createElement('div');
    voiceSection.className = 'space-y-2';
    voiceSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">Voice</label>
      <select id="voiceName" class="w-full p-2 border rounded-md">
      </select>
    `;

    // Speed and Pitch Controls
    const speedPitchSection = document.createElement('div');
    speedPitchSection.className = 'grid grid-cols-2 gap-4';
    speedPitchSection.innerHTML = `
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Speed</label>
        <select id="speed" class="w-full p-2 border rounded-md"></select>
      </div>
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Pitch</label>
        <select id="pitch" class="w-full p-2 border rounded-md"></select>
      </div>
    `;

    // Volume Control
    const volumeSection = document.createElement('div');
    volumeSection.className = 'space-y-2';
    volumeSection.innerHTML = `
      <label class="block text-sm font-medium text-gray-700">Volume</label>
      <input type="range" id="volume" min="0" max="1" step="0.1" value="${this.settings.volume}"
             class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
    `;

    // Test Controls
    const testSection = document.createElement('div');
    testSection.className = 'flex space-x-4 mt-6';
    testSection.innerHTML = `
      <button id="test" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Test Voice
      </button>
      <button id="stop" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
        Stop
      </button>
      <button id="reset" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
        Reset
      </button>
    `;

    controls.appendChild(ttsTypeSection);
    controls.appendChild(languageSection);
    controls.appendChild(voiceSection);
    controls.appendChild(speedPitchSection);
    controls.appendChild(volumeSection);
    controls.appendChild(testSection);

    this.container.appendChild(controls);
  }

  private populateTtsTypeOptions(): void {
    const ttsTypeSelect = this.container.querySelector('#ttsType') as HTMLSelectElement;
    ttsTypeSelect.innerHTML = '';
    
    Object.values(ApiType).forEach((apiType) => {
      const option = document.createElement('option');
      option.textContent = apiType;
      option.value = apiType;
      ttsTypeSelect.appendChild(option);
    });
    
    ttsTypeSelect.value = this.settings.apiType;
  }

  private populateLanguageOptions(voices: VoiceInfo[]): void {
    const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
    const languages = new Set<string>();
    
    voices.forEach((voice) => {
      if (voice.lang) {
        const languageCode = voice.lang.split('-')[0];
        languages.add(languageCode);
      }
    });

    languageSelect.innerHTML = '<option value="">Default</option>';
    languages.forEach((language) => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      languageSelect.appendChild(option);
    });

    languageSelect.value = this.settings.language;
  }

  private populateVoiceOptions(voices: VoiceInfo[]): void {
    const voiceSelect = this.container.querySelector('#voiceName') as HTMLSelectElement;
    const selectedLanguage = (this.container.querySelector('#language') as HTMLSelectElement).value;
    
    voiceSelect.innerHTML = selectedLanguage === '' ? '<option value="">Default</option>' : '';

    voices.forEach((voice) => {
      if (voice.lang && voice.lang.startsWith(selectedLanguage) && voice.voiceName) {
        const option = document.createElement('option');
        option.value = voice.voiceName;
        option.textContent = `${voice.voiceName} (${voice.lang})`;
        voiceSelect.appendChild(option);
      }
    });

    voiceSelect.value = this.settings.voiceName;
  }

  private populateSpeedAndPitchOptions(): void {
    const speedSelect = this.container.querySelector('#speed') as HTMLSelectElement;
    const pitchSelect = this.container.querySelector('#pitch') as HTMLSelectElement;

    speedSelect.innerHTML = '';
    pitchSelect.innerHTML = '';

    TtsSpeedOptions.forEach((value) => {
      const option = document.createElement('option');
      option.value = value.toString();
      option.textContent = `${value}X`;
      speedSelect.appendChild(option);
    });

    TtsPitchOptions.forEach((value) => {
      const option = document.createElement('option');
      option.value = value.toString();
      option.textContent = `${value}X`;
      pitchSelect.appendChild(option);
    });

    speedSelect.value = this.settings.rate.toString();
    pitchSelect.value = this.settings.pitch.toString();
  }

  private attachEventListeners(): void {
    const ttsTypeSelect = this.container.querySelector('#ttsType') as HTMLSelectElement;
    const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
    const voiceSelect = this.container.querySelector('#voiceName') as HTMLSelectElement;
    const speedSelect = this.container.querySelector('#speed') as HTMLSelectElement;
    const pitchSelect = this.container.querySelector('#pitch') as HTMLSelectElement;
    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;
    const testButton = this.container.querySelector('#test') as HTMLButtonElement;
    const stopButton = this.container.querySelector('#stop') as HTMLButtonElement;
    const resetButton = this.container.querySelector('#reset') as HTMLButtonElement;

    ttsTypeSelect.addEventListener('change', async () => {
      this.settings.apiType = ttsTypeSelect.value as ApiType;
      this.settings.language = '';
      this.settings.voiceName = '';
      languageSelect.value = '';
      voiceSelect.value = '';
      await this.saveSettings();
      await this.loadTtsVoices();

      const message: ITtsMessage = { action: 'reloadPage' };
      chrome.runtime.sendMessage(message);
      
      await this.tts.speak(' '); // update messageObserver
    });

    languageSelect.addEventListener('change', async () => {
      this.settings.language = languageSelect.value;
      if (voiceSelect.value === '') {
        voiceSelect.value = '';
      }
      await this.saveSettings();
      this.tts.getVoiceNames((voices) => this.populateVoiceOptions(voices));
    });

    [voiceSelect, speedSelect, pitchSelect, volumeInput].forEach((element) => {
      element.addEventListener('change', async () => {
        await this.saveSettings();
      });
    });

    testButton.addEventListener('click', async () => {
      try {
        const response = await fetch('languageStrings.json');
        const languageStrings = await response.json();
        const testText = languageStrings[this.settings.language] || 
          "Good day, world! May your moments be filled with peace.";
        
        await this.tts.resetStreamSpeak();
        await this.tts.speak(testText);
      } catch (error) {
        console.error('Error loading language strings:', error);
      }
    });

    stopButton.addEventListener('click', () => {
      this.tts.stop();
    });

    resetButton.addEventListener('click', async () => {
      this.settings = { ...defaultTtsSettings };
      await this.saveSettings();
      
      languageSelect.value = this.settings.language;
      voiceSelect.value = this.settings.voiceName;
      speedSelect.value = this.settings.rate.toString();
      pitchSelect.value = this.settings.pitch.toString();
      volumeInput.value = this.settings.volume.toString();
      
      this.tts.getVoiceNames((voices) => {
        this.populateLanguageOptions(voices);
        this.populateVoiceOptions(voices);
      });
    });
  }

  private async saveSettings(): Promise<void> {
    const ttsTypeSelect = this.container.querySelector('#ttsType') as HTMLSelectElement;
    const languageSelect = this.container.querySelector('#language') as HTMLSelectElement;
    const voiceSelect = this.container.querySelector('#voiceName') as HTMLSelectElement;
    const speedSelect = this.container.querySelector('#speed') as HTMLSelectElement;
    const pitchSelect = this.container.querySelector('#pitch') as HTMLSelectElement;
    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;

    const settings: TtsSettings = {
      apiType: ttsTypeSelect.value as ApiType,
      language: languageSelect.value,
      voiceName: voiceSelect.value,
      rate: parseFloat(speedSelect.value),
      pitch: parseFloat(pitchSelect.value),
      volume: parseFloat(volumeInput.value),
    };

    this.settings = settings;
    await settingsManager.setTtsSettings(settings);
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
