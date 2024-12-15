import { copyTextToClipboard } from '../../copy';
import { createToast } from './utils';
import { getVideoTitle } from '../subtitleSummary';

// Interfaces
interface IPopupHandler {
    open(anchor: HTMLElement): void;
    close(): void;
}

export class MorePopupHandler implements IPopupHandler {
    private popupId = "ytbs_more_popup";

    open(anchor: HTMLElement): void {
        this.close(); // Remove existing popup if any

        const popupHtml = `
            <div id="${this.popupId}" style="position: absolute; background-color: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 9999;">
                <button id="ytbs_popup_copy">Copy</button>
                <button id="ytbs_popup_download">Download</button>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHtml);

        const popup = document.getElementById(this.popupId);
        if (popup) {
            const rect = anchor.getBoundingClientRect();
            popup.style.top = `${rect.bottom + window.scrollY}px`;
            popup.style.left = `${rect.left + window.scrollX}px`;

            document.getElementById("ytbs_popup_copy")?.addEventListener("click", this.handleCopy);
            document.getElementById("ytbs_popup_download")?.addEventListener("click", this.handleDownload);

            document.addEventListener('click', this.closePopupOnClickOutside);
        }
    }

    close(): void {
        const existingPopup = document.getElementById(this.popupId);
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    private closePopupOnClickOutside = (event: MouseEvent): void => {
        const popup = document.getElementById(this.popupId);
        if (popup && !popup.contains(event.target as Node)) {
            this.close();
            document.removeEventListener('click', this.closePopupOnClickOutside);
        }
    }

    private handleCopy = async (): Promise<void> => {
        const text = (document.querySelector("#fri-summary-content") as HTMLElement).innerText;
        await copyTextToClipboard(text);
        createToast("Content copied to clipboard!");
    }

    private handleDownload = async (): Promise<void> => {
        const text = (document.querySelector("#fri-summary-content") as HTMLElement).innerText;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const videoTitle = await getVideoTitle();
        a.download = `${videoTitle}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        createToast("Content downloaded!");
    }
}