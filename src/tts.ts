import { defaultTtsSettings, speedOptions as TtsSpeedOptions, pitchOptions as TtsPitchOptions } from './common/settings';
import { ITtsSettings, ApiType } from './common/ISettings';
import { settingsManager } from './common/settingsManager';
import { ITtsMessage } from './utils/messageQueue';
import { TTSSpeak, VoiceInfo } from './common/ttsSpeak';
import { listenToMessages } from './common/msTtsService';
import { MsTtsApi } from './common/msTtsApi';
import { MessageObserver } from './utils/messageObserver';

const tts = TTSSpeak.getInstance(); 
let azureTtsListend = false;               

document.addEventListener('DOMContentLoaded', async () => {
    const ttsTypeSelect = document.getElementById('ttsType') as HTMLSelectElement;
    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    const voiceSelect = document.getElementById('voiceName') as HTMLSelectElement;
    const voiceSelectRobinson = document.getElementById('voiceNameRobinson') as HTMLSelectElement;
    const speedSelect = document.getElementById('speed') as HTMLSelectElement;
    const pitchSelect = document.getElementById('pitch') as HTMLSelectElement;
    const volumeInput = document.getElementById('volume') as HTMLInputElement;
    const testButton = document.getElementById('test') as HTMLButtonElement;
    const stopButton = document.getElementById('stop') as HTMLButtonElement;
    const resetButton = document.getElementById('reset') as HTMLButtonElement;

    let settingsTemp: ITtsSettings = await settingsManager.getTtsSettings();
    const messageObserver = MessageObserver.getInstance();



    async function loadTtsVoices() {  
        const settings = await settingsManager.getTtsSettings();
        if (settings.apiType === ApiType.Azure && !azureTtsListend) {
            azureTtsListend = true;
            await messageObserver.updateObserverType();
            listenToMessages();            
        }        


        tts.getVoiceNames((voices: VoiceInfo[]) => {
            populateLanguageOptions(voices);
            populateVoiceOptions(voices);
            populateSpeedAndPitchOptions();
            populateTtsTypeOptions();
            // languageSelect.addEventListener('change', () => {
            //     populateVoiceOptions(voices);
            //     populateSpeedAndPitchOptions();
            //     saveSettings();
            // });
            // ttsTypeSelect.addEventListener('change', () => {
            //     populateLanguageOptions(voices);
            //     populateVoiceOptions(voices);
            //     populateSpeedAndPitchOptions();
            //     saveSettings();
            // });
            loadSavedSettings();
        });
    }

    loadTtsVoices();

    
    function populateTtsTypeOptions() {
        ttsTypeSelect.innerHTML = '';
        Object.values(ApiType).forEach((apiType) => {
            const option = document.createElement('option');
            option.textContent = apiType;
            ttsTypeSelect.appendChild(option);
        });
        ttsTypeSelect.value = settingsTemp.apiType;
    }
    
    ttsTypeSelect.addEventListener('change', () => {
        settingsTemp.apiType = ttsTypeSelect.value as ApiType;
        settingsTemp.language = '';
        settingsTemp.voiceName = '';
        languageSelect.value = '';
        voiceSelect.value = '';
        saveSettings();
        loadTtsVoices();
        
        //send message to background to reload page
        const message: ITtsMessage = { action: 'reloadPage' };
        chrome.runtime.sendMessage(message);

        tts.speak(' ');//update messageObserver
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

        languageSelect.value = settingsTemp.language;
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
        } else {
            voiceSelect.value = settingsTemp.voiceName;
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
        voiceSelectRobinson.value = settings.voiceNameRobinson || '';
        speedSelect.value = settings.rate.toString();
        pitchSelect.value = settings.pitch.toString();
        volumeInput.value = settings.volume.toString();
        settingsTemp = settings;

        chrome.tts.getVoices((voices) => populateVoiceOptions(voices));
    }

    async function saveSettings() {
        const settings: ITtsSettings = {
            apiType: ttsTypeSelect.value as ApiType,
            language: languageSelect.value,
            voiceName: voiceSelect.value,
            voiceNameRobinson: voiceSelectRobinson.value,
            rate: parseFloat(speedSelect.value),
            pitch: parseFloat(pitchSelect.value),
            volume: parseFloat(volumeInput.value),
        };
        settingsTemp = settings;
        await settingsManager.setTtsSettings(settings);
    }

    languageSelect.addEventListener('change', () => {
        if (voiceSelect.value === '') {
            voiceSelect.value = '';
        }
        saveSettings();
    });

    [voiceSelect, speedSelect, pitchSelect, volumeInput].forEach(
        (element) => element.addEventListener('change', saveSettings)
    );

    testButton.addEventListener('click', () => {
        fetch('languageStrings.json')
            .then(response => response.json())
            .then(async (languageStrings) => {
                const selectedLanguage = languageSelect.value;
                const testText = languageStrings[selectedLanguage] || "Good day, world! May your moments be filled with peace.";
                console.log(testText);

                const message: ITtsMessage = {
                    action: 'speak',
                    text: testText,
                };
                await tts.resetStreamSpeak();
                await tts.speak(testText);
            })
            .catch(error => console.log('Error loading language strings:', error));
    });

    stopButton.addEventListener('click', () => {
        tts.stop();
    });

    resetButton.addEventListener('click', async () => {
        const defaultSettings: ITtsSettings = { ...defaultTtsSettings };
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