import { AbstractSettings, Language } from '../../../common/settings';
import { TTSSpeak } from '../../ttsSpeak';
import { settingsManager } from '../../../common/settingsManager';
import { getVideoTitle, subtitleSummaryHandle } from '../subtitleSummary';
import { logTime, waitForElm } from '../../utils';
import { subtitleTranslate } from '../subtitleTranslate';
import { copyTextToClipboard } from '../../copy';
import { listenToMessages } from '../../msTtsService';
import { MessageObserver } from '../../../utils/messageObserver';
import { ITtsMessage } from '../../../utils/messageQueue';
import { responseOk } from '../../../common/common';

// Interfaces
interface IButtonHandler {
    init(): void;
    update(): Promise<void>;
}

interface IPopupHandler {
    open(anchor: HTMLElement): void;
    close(): void;
}

// Constants
const HIGHLIGHT_COLOR = "yellow";
const DEFAULT_COLOR = "white";
const TIMEOUT_MS = 5000;

// Utility functions
const createToast = (message: string): void => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const getSettings = async (): Promise<AbstractSettings> => {
    return await settingsManager.getSettings();
};

// Main view class
export class SubtitleSummaryView {
    private tts: TTSSpeak;
    private messageObserver: MessageObserver;
    private currentHighlightNode: HTMLElement | null = null;
    private currentReadIndex = 0;

    constructor() {
        this.tts = TTSSpeak.getInstance();
        this.messageObserver = MessageObserver.getInstance();
    }

    async init(videoId: string): Promise<void> {
        await listenToMessages();
        await this.resetWhenPageChange();
        this.initializeButtons();
        this.handleTtsSpeakingText();
        await this.handleAutoSummary(videoId);
    }

    getCurrentIndex(): number {
        return this.currentReadIndex;
    }

    private initializeButtons(): void {
        new SpeakButtonHandler(this.tts).init();
        new AutoSpeakButtonHandler().init();
        new LanguageButtonHandler().init();
        new SettingsButtonHandler().init();
        new SummaryToggleButtonHandler().init();
        new MoreButtonHandler().init();
        new PlayPauseButtonHandler(this.tts, this).init();
        new AutoSummaryButtonHandler().init();
    }

    private async handleAutoSummary(videoId: string): Promise<void> {
        const settings = await getSettings();
        if (settings.summary.autoSummary) {
            subtitleSummaryHandle(videoId, subtitleTranslate);
        } else {
            const ytbsContent = document.querySelector(".ytbs_content") as HTMLElement;
            if (ytbsContent) {
                ytbsContent.innerHTML = "Summary disabled.";
            }
        }
    }

    private handleTtsSpeakingText(): void {
        this.messageObserver.addObserverTtsMessage({ action: 'ttsSpeakingText' }, (message: ITtsMessage) => {
            const ttsTextIndex = message.index ?? 0;
            this.currentReadIndex = ttsTextIndex;

            const ytbsContent = document.querySelector(".ytbs_content") as HTMLElement;
            ytbsContent.childNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    const speakIndex = Number(node.getAttribute('speak-index'));
                    if (speakIndex === ttsTextIndex) {
                        this.currentHighlightNode = node;
                        node.style.backgroundColor = HIGHLIGHT_COLOR;
                    } else {
                        node.style.backgroundColor = DEFAULT_COLOR;
                    }
                }
            });
        });
    }

    resetHighlightText(): void {
        if (this.currentHighlightNode) {
            this.currentHighlightNode.style.backgroundColor = DEFAULT_COLOR;
        }
        this.currentHighlightNode = null;
    }

    private async resetWhenPageChange(): Promise<void> {
        try {
            await Promise.race([
                new Promise<void>((resolve, reject) => {
                    const message: ITtsMessage = { action: 'resetWhenPageChange' };
                    this.messageObserver.notifyObserversTtsMessage(message, (response) => {
                        response === responseOk ? resolve() : reject(new Error('Failed to reset when page change'));
                    });
                }),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), TIMEOUT_MS))
            ]);
        } catch (error) {
            console.error('Error resetting page:', error);
        }
    }
}

// Button Handlers
class SpeakButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_speak";
    private tts: TTSSpeak;

    constructor(tts: TTSSpeak) {
        this.tts = tts;
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            setInterval(this.update.bind(this), 3000);
        }
    }

    async update(): Promise<void> {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.textContent = await this.tts.isSpeaking() ? "Speaking..." : "Speak";
        }
    }

    private async handleClick(): Promise<void> {
        if (await this.tts.isSpeaking()) {
            await this.tts.stop();
        } else {
            await this.tts.resetStreamSpeak();
            this.speakContent();
        }
        await this.update();
    }

    private speakContent(): void {
        const parser = new DOMParser();
        const content = document.querySelector(".ytbs_content") as HTMLElement;
        if (content) {
            Array.from(content.children).forEach((node) => {
                if (node instanceof HTMLElement) {
                    const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                    const text = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                    this.tts.speak(text, speakIndex);
                }
            });
        }
    }
}

class AutoSpeakButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_auto_speak";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            this.update();
        }
    }

    async update(): Promise<void> {
        const button = document.getElementById(this.buttonId);
        if (button) {
            const settings = await getSettings();
            button.textContent = settings.summary.autoTtsSpeak ? "Auto Speak: ON" : "Auto Speak: OFF";
        }
    }

    private async handleClick(): Promise<void> {
        const settings = await getSettings();
        settings.summary.autoTtsSpeak = !settings.summary.autoTtsSpeak;
        await settingsManager.setSummarySettings(settings.summary);
        await this.update();
        window.location.reload();
    }
}

class LanguageButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_language";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            this.update();
        }
    }

    async update(): Promise<void> {
        const button = document.getElementById(this.buttonId);
        if (button) {
            const settings = await getSettings();
            button.textContent = settings.summary.language;
        }
    }

    private async handleClick(): Promise<void> {
        const settings = await getSettings();
        const currentLanguage = settings.summary.language as Language;
        const languages = Object.values(Language) as Language[];
        const nextLanguageIndex = (languages.indexOf(currentLanguage) + 1) % languages.length;
        settings.summary.language = languages[nextLanguageIndex];
        await settingsManager.setSummarySettings(settings.summary);
        await this.update();
    }
}

class SettingsButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_settings";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: 'openOptionsPage' });
            });
        }
    }

    async update(): Promise<void> {
        // No update needed for this button
    }
}

class SummaryToggleButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_summary_btn";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
        }
    }

    async update(): Promise<void> {
        // No update needed for this button
    }

    private handleClick(): void {
        const container = document.querySelector(".yt_ai_summary_container") as HTMLElement;
        if (container) {
            container.style.display = container.style.display === "none" ? "block" : "none";
        }
    }
}

class MoreButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_more_btn";
    private popupHandler: MorePopupHandler;

    constructor() {
        this.popupHandler = new MorePopupHandler();
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", (event) => {
                event.stopPropagation();
                this.popupHandler.open(button);
            });
        }
    }

    async update(): Promise<void> {
        // No update needed for this button
    }
}

class MorePopupHandler implements IPopupHandler {
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
        const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
        await copyTextToClipboard(text);
        createToast("Content copied to clipboard!");
    }

    private handleDownload = async (): Promise<void> => {
        const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
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

class PlayPauseButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_play_pause";
    private tts: TTSSpeak;
    private subtitleSummaryView: SubtitleSummaryView;

    constructor(tts: TTSSpeak, subtitleSummaryView: SubtitleSummaryView) {
        this.tts = tts;
        this.subtitleSummaryView = subtitleSummaryView;
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            setInterval(this.update.bind(this), 3000);
        }
    }

    async update(): Promise<void> {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.textContent = await this.tts.isSpeaking() ? "Pause" : "Play";
        }
    }

    private async handleClick(): Promise<void> {
        if (await this.tts.isSpeaking()) {
            await this.tts.stop();
        } else {
            await this.tts.resetStreamSpeak();
            this.resumeSpeaking();
        }
        await this.update();
    }

    private resumeSpeaking(): void {
        const parser = new DOMParser();
        const content = document.querySelector(".ytbs_content") as HTMLElement;
        if (content) {
            Array.from(content.children).forEach((node) => {
                if (node instanceof HTMLElement) {
                    const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                    if (speakIndex >= this.subtitleSummaryView.getCurrentIndex()) {
                        const text = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                        this.tts.speak(text, speakIndex);
                    }
                }
            });
        }
    }
}

class AutoSummaryButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_auto_summary";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            this.update();
        }
    }

    async update(): Promise<void> {
        const button = document.getElementById(this.buttonId);
        if (button) {
            const settings = await getSettings();
            button.textContent = settings.summary.autoSummary ? "Summary: ON" : "Summary: OFF";
        }
    }

    private async handleClick(): Promise<void> {
        const settings = await getSettings();
        settings.summary.autoSummary = !settings.summary.autoSummary;
        await settingsManager.setSummarySettings(settings.summary);
        await this.update();
        window.location.reload();
    }
}

// Helper functions
export function insertSummaryButtonView(): void {
    const buttonHtml = `<button id="ytbs_summary_btn" style="display: inline-block; font-size: 14px; line-height: 36px; padding: 0px 20px; margin: 0px 8px 3px; background-color: lightgrey; border-radius: 20px; transition: background-color 0.3s, transform 0.3s; cursor: pointer; transform: scale(1);" onmouseover="this.style.backgroundColor='grey';" onmouseout="this.style.backgroundColor='lightgrey';" onmousedown="this.style.backgroundColor='darkgrey'; this.style.transform='scale(0.95)';" onmouseup="this.style.backgroundColor='grey'; this.style.transform='scale(1)';">Summary</button>`;
    waitForElm('#top-level-buttons-computed').then((elm) => {
        elm.insertAdjacentHTML("afterbegin", buttonHtml);
    });
}

export function getSubtitleSummaryView(): string {
    return `
        <div class="ytbs_container" style="font-size: 15px; background-color: rgb(255, 255, 255);  padding:6px;">
            <div id="ytbs_control_panel" style="justify-content: space-between; margin-bottom: 10px;">
                <button id="ytbs_auto_summary">Summary</button>
                <button id="ytbs_auto_speak">Auto Speak</button>
                <button id="ytbs_play_pause">Pause</button>
                <button id="ytbs_speak">Speak</button>
                <button id="ytbs_language">English</button>
                <button id="ytbs_settings">Settings</button>
                <button id="ytbs_more_btn">More</button>
            </div>
            <div id="ytbs_summary_status" style="margin-bottom: 10px;"> </div>
            <div class="ytbs_content"> </div>    
        </div>
    `;
}

const view = new SubtitleSummaryView();
export async function handleSubtitleSummaryView(videoId: string): Promise<void> {
    await view.init(videoId);
}

export function resetHighlightText(): void {
    view.resetHighlightText();
}