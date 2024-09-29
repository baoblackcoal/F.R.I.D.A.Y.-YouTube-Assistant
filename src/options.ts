import { Language, defaultSummarySettings, SummarySettings } from './settings';
import { defaultPromptText } from "./prompts/defaultPromptText";
import { settingsManager } from './settingsManager';

document.addEventListener('DOMContentLoaded', async () => {
    const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
    const geminiApiKeyInput = document.getElementById('geminiApiKey') as HTMLInputElement;
    const promptTypeSelect = document.getElementById('promptType') as HTMLSelectElement;
    const defaultPromptTextInput = document.getElementById('defaultPromptText') as HTMLTextAreaElement;
    const diyPromptText1Input = document.getElementById('diyPromptText1') as HTMLTextAreaElement;
    const diyPromptText2Input = document.getElementById('diyPromptText2') as HTMLTextAreaElement;
    const diyPromptText3Input = document.getElementById('diyPromptText3') as HTMLTextAreaElement;
    const languageSelect = document.getElementById('language') as HTMLSelectElement;
    const stopVideoFirstCheckbox = document.getElementById('autoTtsSpeak') as HTMLInputElement;

    populateLanguageSelect();

    // Set the default prompt text
    defaultPromptTextInput.value = defaultPromptText;

    // Load saved options
    const summarySettings = await settingsManager.getSummarySettings();
    const ttsSettings = await settingsManager.getTtsSettings();
    const llmSettings = await settingsManager.getLlmSettings();

    geminiApiKeyInput.value = llmSettings.apiKey || '';
    promptTypeSelect.value = summarySettings.promptType.toString();
    diyPromptText1Input.value = summarySettings.diyPromptText1 || defaultSummarySettings.diyPromptText1;
    diyPromptText2Input.value = summarySettings.diyPromptText2 || defaultSummarySettings.diyPromptText2;
    diyPromptText3Input.value = summarySettings.diyPromptText3 || defaultSummarySettings.diyPromptText3;
    languageSelect.value = summarySettings.language || defaultSummarySettings.language;
    stopVideoFirstCheckbox.checked = summarySettings.autoTtsSpeak || defaultSummarySettings.autoTtsSpeak;

    function populateLanguageSelect() {
        Object.entries(Language).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = key;
            languageSelect.appendChild(option);
        });
    }

    // Save options
    saveBtn.addEventListener('click', async () => {
        const geminiApiKey = geminiApiKeyInput.value;
        //  implement SummarySettings
        const summarySettings: SummarySettings = {
            promptType: parseInt(promptTypeSelect.value),
            diyPromptText1: diyPromptText1Input.value,
            diyPromptText2: diyPromptText2Input.value,
            diyPromptText3: diyPromptText3Input.value,
            language: languageSelect.value,
            autoTtsSpeak: stopVideoFirstCheckbox.checked,
        };


        await settingsManager.setLlmSettings({ ...llmSettings, apiKey: geminiApiKey });
        await settingsManager.setSummarySettings(summarySettings);

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