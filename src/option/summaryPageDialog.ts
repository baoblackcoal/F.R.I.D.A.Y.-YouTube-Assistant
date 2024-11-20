import { I18nService } from '../common/i18n';

export interface ISummaryPageDialog {
    showDialog(promptId: number, currentValue: string): void;
    initialize(): void;
    updateI18n(i18n: I18nService): void;
}

export class SummaryPageDialog implements ISummaryPageDialog {
    private dialog!: HTMLDialogElement;
    
    constructor(
        private readonly container: HTMLElement,
        private readonly onPromptEdit: (promptId: number, value: string) => void,
        private readonly i18n: I18nService
    ) {
        this.createDialog();
        this.attachEventListeners();
    }

    private createDialog(): void {
        const dialogHTML = `
            <dialog id="promptEditDialog" class="prompt-edit-dialog">
                <div class="dialog-content">
                    <h2 id="dialogPromptTitle" class="dialog-title">${this.i18n.getMessage('option_summary_prompt_edit_dialog_title')}</h2>
                    <div class="prompt-info">
                        <p class="prompt-info-title">${this.i18n.getMessage('option_summary_prompt_variables_title')}</p>
                        <ul class="prompt-info-list">
                            <li><code class="code-text">{videoTitle}</code>: ${this.i18n.getMessage('option_summary_prompt_variable_title')}</li>
                            <li><code class="code-text">{textTranscript}</code>: ${this.i18n.getMessage('option_summary_prompt_variable_transcript')}</li>
                            <li><code class="code-text">{language}</code>: ${this.i18n.getMessage('option_summary_prompt_variable_language')}</li>
                        </ul>
                    </div>
                    <textarea id="dialogPromptText" rows="20" class="dialog-textarea"></textarea>
                    <div class="dialog-buttons">
                        <button id="dialogSave" class="base-button">${this.i18n.getMessage('option_summary_prompt_save')}</button>
                        <button id="dialogCancel" class="base-button secondary">${this.i18n.getMessage('option_summary_prompt_cancel')}</button>
                    </div>
                </div>
            </dialog>
        `;
        this.container.insertAdjacentHTML('beforeend', dialogHTML);
        this.dialog = this.container.querySelector('#promptEditDialog') as HTMLDialogElement;
    }

    private attachEventListeners(): void {
        const saveBtn = this.dialog.querySelector('#dialogSave');
        const cancelBtn = this.dialog.querySelector('#dialogCancel');

        saveBtn?.addEventListener('click', () => {
            const promptId = parseInt(this.dialog.getAttribute('data-prompt-id') || '0');
            const dialogTextarea = this.dialog.querySelector('#dialogPromptText') as HTMLTextAreaElement;
            this.onPromptEdit(promptId, dialogTextarea.value);
            this.dialog.close();
        });

        cancelBtn?.addEventListener('click', () => {
            this.dialog.close();
        });
    }

    public showDialog(promptId: number, currentValue: string): void {
        const dialogTextarea = this.dialog.querySelector('#dialogPromptText') as HTMLTextAreaElement;
        dialogTextarea.value = currentValue;
        this.dialog.setAttribute('data-prompt-id', promptId.toString());
        this.dialog.showModal();
    }

    public initialize(): void {
        // Any initialization logic if needed
    }

    public updateI18n(i18n: I18nService): void {
        const elements = {
            dialogTitle: this.dialog.querySelector('#dialogPromptTitle'),
            dialogVariablesTitle: this.dialog.querySelector('.prompt-info-title'),
            dialogVariableTitle: this.dialog.querySelector('.prompt-info-list li:nth-child(1)'),
            dialogVariableTranscript: this.dialog.querySelector('.prompt-info-list li:nth-child(2)'),
            dialogVariableLanguage: this.dialog.querySelector('.prompt-info-list li:nth-child(3)'),
            dialogSaveButton: this.dialog.querySelector('#dialogSave'),
            dialogCancelButton: this.dialog.querySelector('#dialogCancel')
        };

        if (elements.dialogTitle) {
            elements.dialogTitle.textContent = i18n.getMessage('option_summary_prompt_edit_dialog_title');
        }
        if (elements.dialogVariablesTitle) {
            elements.dialogVariablesTitle.textContent = i18n.getMessage('option_summary_prompt_variables_title');
        }
        if (elements.dialogVariableTitle) {
            elements.dialogVariableTitle.textContent = i18n.getMessage('option_summary_prompt_variable_title');
        }
        if (elements.dialogVariableTranscript) {
            elements.dialogVariableTranscript.textContent = i18n.getMessage('option_summary_prompt_variable_transcript');
        }
        if (elements.dialogVariableLanguage) {
            elements.dialogVariableLanguage.textContent = i18n.getMessage('option_summary_prompt_variable_language');
        }
        if (elements.dialogSaveButton) {
            elements.dialogSaveButton.textContent = i18n.getMessage('option_summary_prompt_save');
        }
        if (elements.dialogCancelButton) {
            elements.dialogCancelButton.textContent = i18n.getMessage('option_summary_prompt_cancel');
        }
    }
} 