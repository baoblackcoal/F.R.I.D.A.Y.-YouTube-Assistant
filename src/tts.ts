import { TtsSettings, defaultTtsSettings, speedOptions as TtsSpeedOptions, pitchOptions as TtsPitchOptions } from './common/settings';
import { settingsManager } from './common/settingsManager';

document.addEventListener('DOMContentLoaded', async () => {
    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    const voiceSelect = document.getElementById('voiceName') as HTMLSelectElement;
    const speedSelect = document.getElementById('speed') as HTMLSelectElement;
    const pitchSelect = document.getElementById('pitch') as HTMLSelectElement;
    const volumeInput = document.getElementById('volume') as HTMLInputElement;
    const testButton = document.getElementById('test') as HTMLButtonElement;
    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    const resetButton = document.getElementById('reset') as HTMLButtonElement;

    let settingsTemp: TtsSettings = await settingsManager.getTtsSettings();

    chrome.tts.getVoices((voices: chrome.tts.TtsVoice[]) => {
        populateLanguageOptions(voices);
        populateVoiceOptions(voices);
        populateSpeedAndPitchOptions();
        languageSelect.addEventListener('change', () => {
            populateVoiceOptions(voices);
            populateSpeedAndPitchOptions();
            saveSettings();
        });
        loadSavedSettings();
    });

    function populateLanguageOptions(voices: chrome.tts.TtsVoice[]) {
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
    }

    function populateVoiceOptions(voices: chrome.tts.TtsVoice[]) {
        const selectedLanguage = languageSelect.value;
        voiceSelect.innerHTML = '';

        if (selectedLanguage === '') 
            voiceSelect.innerHTML = '<option value="">Default</option>';

        voices.forEach((voice) => {
            if (voice.lang && voice.lang.startsWith(selectedLanguage) && voice.voiceName) {
                const option = document.createElement('option');
                option.value = voice.voiceName;
                option.textContent = `${voice.voiceName} (${voice.lang})`;
                voiceSelect.appendChild(option);
            }
        });

        if (selectedLanguage === '') {
            voiceSelect.value = '';
        }
    }

    function populateSpeedAndPitchOptions() {
        speedSelect.innerHTML = '';
        pitchSelect.innerHTML = '';

        TtsSpeedOptions.forEach((value) => {
            const speedOption = document.createElement('option');
            speedOption.value = value.toString();
            speedOption.textContent = `${value}X`;
            speedSelect.appendChild(speedOption);
        });

        TtsPitchOptions.forEach((value) => {
            const pitchOption = document.createElement('option');
            pitchOption.value = value.toString();
            pitchOption.textContent = `${value}X`;
            pitchSelect.appendChild(pitchOption);
        });

        speedSelect.value = settingsTemp.rate.toString();
        pitchSelect.value = settingsTemp.pitch.toString();
    }

    async function loadSavedSettings() {
        const settings = await settingsManager.getTtsSettings();
        languageSelect.value = settings.language || '';
        voiceSelect.value = settings.voiceName || '';
        speedSelect.value = settings.rate.toString();
        pitchSelect.value = settings.pitch.toString();
        volumeInput.value = settings.volume.toString();
        settingsTemp = settings;

        chrome.tts.getVoices((voices) => populateVoiceOptions(voices));
    }

    async function saveSettings() {
        const settings: TtsSettings = {
            language: languageSelect.value,
            voiceName: languageSelect.value === '' ? '' : voiceSelect.value,
            rate: parseFloat(speedSelect.value),
            pitch: parseFloat(pitchSelect.value),
            volume: parseFloat(volumeInput.value)
        };
        settingsTemp = settings;
        await settingsManager.setTtsSettings(settings);
    }

    [languageSelect, voiceSelect, speedSelect, pitchSelect, volumeInput].forEach(
        (element) => element.addEventListener('change', saveSettings)
    );

    testButton.addEventListener('click', () => {
        fetch('languageStrings.json')
            .then(response => response.json())
            .then(languageStrings => {
                const selectedLanguage = languageSelect.value;
                const testText = languageStrings[selectedLanguage] || "Good day, world! May your moments be filled with peace.";
                console.log(testText);

                chrome.runtime.sendMessage({
                    action: 'speak',
                    text: testText,
                });
            })
            .catch(error => console.error('Error loading language strings:', error));
    });

    stopButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'ttsStop',
        });
    });

    resetButton.addEventListener('click', async () => {
        const defaultSettings: TtsSettings = { ...defaultTtsSettings };
        await settingsManager.setTtsSettings(defaultSettings);
        languageSelect.value = defaultSettings.language;
        voiceSelect.value = defaultSettings.voiceName;
        speedSelect.value = defaultSettings.rate.toString();
        pitchSelect.value = defaultSettings.pitch.toString();
        volumeInput.value = defaultSettings.volume.toString();
        chrome.tts.getVoices((voices) => {
            populateLanguageOptions(voices);
            populateVoiceOptions(voices);
        });
    });
});