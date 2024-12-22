import { TTSSpeak } from '../../../common/ttsSpeak';
import { settingsManager } from '../../../common/settingsManager';
import { subtitleSummaryHandle, updateSummaryStatus } from '../subtitleSummary';
import { listenToMessages } from '../../../common/msTtsService';
import { MessageObserver } from '../../../utils/messageObserver';
import { ITtsMessage } from '../../../utils/messageQueue';
import { FridayStatus, responseOk } from '../../../common/common';
import { getSettings } from './utils';
import { initializeButtons } from './buttonHandlers';
import { waitForElm } from '../../utils';
import { subtitleTranslate } from '../subtitleTranslate';
import { getSearchParam } from '../../searchParam';

// Constants
const HIGHLIGHT_COLOR = "lightskyblue";
const DEFAULT_COLOR = "transparent";
const TIMEOUT_MS = 5000;

// Main view class
export class SubtitleSummaryView {
    private static instance: SubtitleSummaryView;
    private tts: TTSSpeak;
    private messageObserver: MessageObserver;
    private currentHighlightNode: HTMLElement | null = null;
    private currentReadIndex = 0;
    private generating = false;

    private constructor() {
        this.tts = TTSSpeak.getInstance();
        this.messageObserver = MessageObserver.getInstance();
    }

    static getInstance(): SubtitleSummaryView {
        // singleton
        if (!SubtitleSummaryView.instance) {
            SubtitleSummaryView.instance = new SubtitleSummaryView();
        }
        return SubtitleSummaryView.instance;
    }

    async init(): Promise<void> {
        await this.reloadPage();
        await listenToMessages();
        await this.resetWhenPageChange();
        initializeButtons(this.tts, this);
        this.handleTtsSpeakingText();
        updateSummaryStatus("...", FridayStatus.Init);
        setTimeout(() => {
            updateSummaryStatus("Waiting...", FridayStatus.Waiting);
        }, 3000);
        
        await this.handleAutoSummary(subtitleTranslate);
    }

    //reload page when background send reloadPage message "reloadPage"
    async reloadPage(): Promise<void> {
        const message: ITtsMessage = { action: 'reloadPage' };
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'reloadPage') {
                window.location.reload();
            }
        });
    }

    private getVideoId(): string {
        return getSearchParam(window.location.href).v || '';
    }

    getCurrentIndex(): number {
        return this.currentReadIndex;
    }

    getGenerating(): boolean {
        return this.generating;
    }

    async manualStartGenerate(): Promise<void> {
        this.generating = true;
        const maualStart = true;
        await this.handleAutoSummary(subtitleTranslate, maualStart);
    }

    private async handleAutoSummary(subtitleTranslate: (videoId: string) => Promise<void>, maualStart: boolean = false): Promise<void> {
        const settings = await getSettings();
        if (settings.summary.autoGenerate || maualStart) {
            this.generating = true;
            subtitleSummaryHandle(this.getVideoId(), subtitleTranslate);
        }         
    }

    private handleTtsSpeakingText(): void {
        this.messageObserver.addObserverTtsMessage({ action: 'ttsSpeakingText' }, (message: ITtsMessage) => {
            const ttsTextIndex = message.index ?? 0;
            this.currentReadIndex = ttsTextIndex;

            const ytbsContent = document.querySelector("#fri-summary-content") as HTMLElement;
            ytbsContent.childNodes.forEach((node) => {
                if (node instanceof HTMLElement) {
                    const speakIndex = Number(node.getAttribute('speak-index'));
                    if (speakIndex === ttsTextIndex) {
                        this.currentHighlightNode = node;
                        node.style.backgroundColor = HIGHLIGHT_COLOR;
                        node.style.color = "black";
                    } else {
                        node.style.backgroundColor = DEFAULT_COLOR;
                        node.style.color = "var(--yt-spec-text-primary)";
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
            console.log('Error resetting page:', error);
        }
    }
}

// Helper functions
export function insertSummaryButtonView(): void {
    // const buttonHtml = `<button id="ytbs_summary_btn" style="display: inline-block; font-size: 14px; line-height: 36px; padding: 0px 20px; margin: 0px 8px 3px; background-color: lightgrey; border-radius: 20px; transition: background-color 0.3s, transform 0.3s; cursor: pointer; transform: scale(1);" onmouseover="this.style.backgroundColor='grey';" onmouseout="this.style.backgroundColor='lightgrey';" onmousedown="this.style.backgroundColor='darkgrey'; this.style.transform='scale(0.95)';" onmouseup="this.style.backgroundColor='grey'; this.style.transform='scale(1)';">Summary</button>`;
    const logoElement = document.getElementById('logo');
    const fridayLogo = document.getElementById('ytbs_summary_logo');

    if (logoElement && !fridayLogo) {
        // Create a new button element
        const logo = document.createElement('img');
        logo.id = 'ytbs_summary_logo';
        logo.src = chrome.runtime.getURL('friday_logo_48.png');
        logo.style.width = '32px';

        // Add a click event listener for custom functionality
        logo.addEventListener('click', () => {
            // alert('Summary button clicked!'); // Replace with desired functionality
        });
        
        // Insert the button after the logo element
        logoElement.insertAdjacentElement('afterend', logo);
    }

}

export function getSubtitleSummaryView(): string {
    return `
        <div class="ytbs_container" style="
            font-family: 'Roboto', sans-serif;
            font-size: 15px;           
        ">
            <div id="ytbs_control_panel" style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                align-items: center;
                gap: 12px;
            ">
                <div class="ytbs_left_controls" style="display: flex; gap: 8px;">
                    <button id="ytbs_play_pause" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">Pause</button>
                    <button id="ytbs_speak" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">Speak</button>
                    <button id="ytbs_language" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">English</button>
                </div>

                <div id="ytbs_summary_title" style="
                    color: var(--yt-spec-text-primary);
                    font-size: 16px;
                    font-weight: 500;
                    flex-grow: 1;
                    text-align: center;
                    width: auto;
                ">YouTube Summary</div>

                <div class="ytbs_right_controls" style="display: flex; gap: 8px;">
                    <button id="ytbs_auto_summary" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">Summary</button>
                    <button id="ytbs_auto_speak" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">Auto Speak</button>
                    <button id="ytbs_settings" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">Settings</button>
                    <button id="ytbs_more_btn" style="
                        background-color: var(--yt-spec-badge-chip-background);
                        color: var(--yt-spec-text-primary);
                        border: none;
                        border-radius: 18px;
                        padding: 8px 16px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    ">More</button>
                </div>
            </div>

        </div>
    `;
}

const view = SubtitleSummaryView.getInstance();

export async function handleSubtitleSummaryView(): Promise<void> {
    await view.init();
}

export function resetHighlightText(): void {
    view.resetHighlightText();
}
