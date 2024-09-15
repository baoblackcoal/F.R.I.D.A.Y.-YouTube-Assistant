import { TtsSettings, defaultTtsSettings } from './common';

document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    const voiceSelect = document.getElementById('voiceName') as HTMLSelectElement;
    const speedSelect = document.getElementById('speed') as HTMLSelectElement;
    const pitchSelect = document.getElementById('pitch') as HTMLSelectElement;
    const volumeInput = document.getElementById('volume') as HTMLInputElement;
    const testButton = document.getElementById('test') as HTMLButtonElement;
    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    const resetButton = document.getElementById('reset') as HTMLButtonElement;

    let settingsTemp: TtsSettings = { ...defaultTtsSettings };

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
        const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
        const pitchOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
        speedSelect.innerHTML = '';
        pitchSelect.innerHTML = '';

        speedOptions.forEach((value) => {
            const speedOption = document.createElement('option');
            speedOption.value = value.toString();
            speedOption.textContent = `${value}X`;
            speedSelect.appendChild(speedOption);
        });

        pitchOptions.forEach((value) => {
            const pitchOption = document.createElement('option');
            pitchOption.value = value.toString();
            pitchOption.textContent = `${value}X`;
            pitchSelect.appendChild(pitchOption);
        });

        speedSelect.value = settingsTemp.rate.toString();
        pitchSelect.value = settingsTemp.pitch.toString();
    }

    function loadSavedSettings() {
        chrome.storage.sync.get(['ttsSettings'], (items) => {
            const settings = items.ttsSettings as TtsSettings || { ...defaultTtsSettings };
            languageSelect.value = settings.language || '';
            voiceSelect.value = settings.voiceName || '';
            speedSelect.value = settings.rate.toString();
            pitchSelect.value = settings.pitch.toString();
            volumeInput.value = settings.volume.toString();
            settingsTemp = settings;

            chrome.tts.getVoices((voices) => populateVoiceOptions(voices));
        });
    }

    function saveSettings() {
        const settings: TtsSettings = {
            language: languageSelect.value,
            voiceName: languageSelect.value === '' ? '' : voiceSelect.value,
            rate: parseFloat(speedSelect.value),
            pitch: parseFloat(pitchSelect.value),
            volume: parseFloat(volumeInput.value)
        };
        settingsTemp = settings;
        chrome.storage.sync.set({ ttsSettings: settings });
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
        chrome.tts.stop();
    });

    resetButton.addEventListener('click', () => {
        const defaultSettings: TtsSettings = { ...defaultTtsSettings };
        chrome.storage.sync.set({ ttsSettings: defaultSettings }, () => {
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
});