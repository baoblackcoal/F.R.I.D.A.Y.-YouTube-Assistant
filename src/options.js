import { Language, defaultSummarySettings, defaultPromptText } from './common';

document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    const bgColorInput = document.getElementById('bgColor');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const promptTypeSelect = document.getElementById('promptType');
    const defaultPromptTextInput = document.getElementById('defaultPromptText');
    const diyPromptText1Input = document.getElementById('diyPromptText1');
    const diyPromptText2Input = document.getElementById('diyPromptText2');
    const diyPromptText3Input = document.getElementById('diyPromptText3');
    const languageSelect = document.getElementById('language');

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
            promptTypeSelect.value = data.summarySettings.promptType;
            diyPromptText1Input.value = data.summarySettings.diyPromptText1 || defaultSummarySettings.diyPromptText1;
            diyPromptText2Input.value = data.summarySettings.diyPromptText2 || defaultSummarySettings.diyPromptText2;
            diyPromptText3Input.value = data.summarySettings.diyPromptText3 || defaultSummarySettings.diyPromptText3;
            languageSelect.value = data.summarySettings.language || defaultSummarySettings.language;
        } else {
            // If no saved settings, use default values
            diyPromptText1Input.value = defaultSummarySettings.diyPromptText1;
            diyPromptText2Input.value = defaultSummarySettings.diyPromptText2;
            diyPromptText3Input.value = defaultSummarySettings.diyPromptText3;
            languageSelect.value = defaultSummarySettings.language;
        }
        
        populateLanguageSelect();
        if (data.Language) {
            languageSelect.value = data.Language;
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
    function toggleExpand(event) {
        const targetId = event.target.getAttribute('data-target');
        const textarea = document.getElementById(targetId);
        const isExpanded = textarea.classList.toggle('expanded');
        event.target.textContent = isExpanded ? 'Collapse' : 'Expand';
        textarea.rows = isExpanded ? 6 : 2;
    }

    // Add click event listeners to expand buttons
    expandButtons.forEach(button => {
        button.addEventListener('click', toggleExpand);
    });
});
