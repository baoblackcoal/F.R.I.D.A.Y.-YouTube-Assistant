import { Language, defaultSummarySettings, defaultPromptText } from './settings';

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    const bgColorInput = document.getElementById('bgColor') as HTMLInputElement;
    const geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
    const promptTypeSelect = document.getElementById('promptType') as HTMLSelectElement;
    const defaultPromptTextInput = document.getElementById('defaultPromptText') as HTMLTextAreaElement;
    const diyPromptText1Input = document.getElementById('diyPromptText1') as HTMLTextAreaElement;
    const diyPromptText2Input = document.getElementById('diyPromptText2') as HTMLTextAreaElement;
    const diyPromptText3Input = document.getElementById('diyPromptText3') as HTMLTextAreaElement;
    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    const ttsSpeakCheckbox = document.getElementById('ttsSpeak') as HTMLInputElement;
    const stopVideoFirstCheckbox = document.getElementById('stopVideoFirst') as HTMLInputElement;

    populateLanguageSelect();

    // Set the default prompt text
    defaultPromptTextInput.value = defaultPromptText;

    // Load saved options
    chrome.storage.sync.get(['bgColor', 'geminiApiKey', 'summarySettings'], (data) => {
        if (data.bgColor) {
            bgColorInput.value = data.bgColor;
        }
        if (data.geminiApiKey) {
            geminiApiKeyInput.value = data.geminiApiKey;
        }
        if (data.summarySettings) {
            promptTypeSelect.value = data.summarySettings.promptType.toString();
            diyPromptText1Input.value = data.summarySettings.diyPromptText1 || defaultSummarySettings.diyPromptText1;
            diyPromptText2Input.value = data.summarySettings.diyPromptText2 || defaultSummarySettings.diyPromptText2;
            diyPromptText3Input.value = data.summarySettings.diyPromptText3 || defaultSummarySettings.diyPromptText3;
            languageSelect.value = data.summarySettings.language || defaultSummarySettings.language;
            ttsSpeakCheckbox.checked = data.summarySettings.ttsSpeak || defaultSummarySettings.ttsSpeak;
            stopVideoFirstCheckbox.checked = data.summarySettings.stopVideoFirst || defaultSummarySettings.stopVideoFirst;
        } else {
            // If no saved settings, use default values
            diyPromptText1Input.value = defaultSummarySettings.diyPromptText1;
            diyPromptText2Input.value = defaultSummarySettings.diyPromptText2;
            diyPromptText3Input.value = defaultSummarySettings.diyPromptText3;
            languageSelect.value = defaultSummarySettings.language;
            ttsSpeakCheckbox.checked = defaultSummarySettings.ttsSpeak;
            stopVideoFirstCheckbox.checked = defaultSummarySettings.stopVideoFirst;
        }
    });

    function populateLanguageSelect() {
        Object.entries(Language).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = key;
            languageSelect.appendChild(option);
        });
    }

    // Save options
    saveBtn.addEventListener('click', () => {
        const bgColor = bgColorInput.value;
        const geminiApiKey = geminiApiKeyInput.value;
        const summarySettings = {
            promptType: parseInt(promptTypeSelect.value),
            diyPromptText1: diyPromptText1Input.value,
            diyPromptText2: diyPromptText2Input.value,
            diyPromptText3: diyPromptText3Input.value,
            language: languageSelect.value,
            ttsSpeak: ttsSpeakCheckbox.checked,
            stopVideoFirst: stopVideoFirstCheckbox.checked,
        };

        chrome.storage.sync.set({ bgColor, geminiApiKey, summarySettings }, () => {
            console.log('Options saved');
            // Show a save confirmation message
            const saveConfirmation = document.createElement('div');
            saveConfirmation.textContent = 'Options saved!';
            saveConfirmation.className = 'save-confirmation';
            document.body.appendChild(saveConfirmation);
            setTimeout(() => {
                saveConfirmation.remove();
            }, 2000);
        });
    });

    const expandButtons = document.querySelectorAll('.expand-btn');

    // Function to toggle textarea expansion
    function toggleExpand(event: Event) {
        const target = event.target as HTMLElement;
        const targetId = target.getAttribute('data-target');
        if (targetId) {
            const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
            const isExpanded = textarea.classList.toggle('expanded');
            target.textContent = isExpanded ? 'Collapse' : 'Expand';
            textarea.rows = isExpanded ? 6 : 2;
        }
    }

    // Add click event listeners to expand buttons
    expandButtons.forEach(button => {
        button.addEventListener('click', toggleExpand);
    });
});