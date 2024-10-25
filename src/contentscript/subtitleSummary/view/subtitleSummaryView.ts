import { TTSSpeak } from '../../ttsSpeak';
import { settingsManager } from '../../../common/settingsManager';
import { subtitleSummaryHandle } from '../subtitleSummary';
import { listenToMessages } from '../../../contentscript/msTtsService';
import { MessageObserver } from '../../../utils/messageObserver';
import { ITtsMessage } from '../../../utils/messageQueue';
import { responseOk } from '../../../common/common';
import { getSettings } from './utils';
import { initializeButtons } from './buttonHandlers';
import { waitForElm } from '../../utils';
import { subtitleTranslate } from '../subtitleTranslate';

// Constants
const HIGHLIGHT_COLOR = "yellow";
const DEFAULT_COLOR = "transparent";
const TIMEOUT_MS = 5000;

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
        await this.reloadPage();
        await listenToMessages();
        await this.resetWhenPageChange();
        initializeButtons(this.tts, this);
        this.handleTtsSpeakingText();
        await this.handleAutoSummary(videoId, subtitleTranslate);
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

    getCurrentIndex(): number {
        return this.currentReadIndex;
    }

    private async handleAutoSummary(videoId: string, subtitleTranslate: (videoId: string) => Promise<void>): Promise<void> {
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
            console.error('Error resetting page:', error);
        }
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
            <div id="ytbs_summary_status" style="
                margin-bottom: 12px;
                color: var(--yt-spec-text-secondary);
                font-size: 13px;
            "> </div>
            <div class="ytbs_content" style="
                color: var(--yt-spec-text-primary);
                line-height: 1.6;
                padding: 8px 0;
            "> </div>    
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
