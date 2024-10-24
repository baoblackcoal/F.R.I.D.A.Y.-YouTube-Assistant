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
const DEFAULT_COLOR = "white";
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
        await listenToMessages();
        await this.resetWhenPageChange();
        initializeButtons(this.tts, this);
        this.handleTtsSpeakingText();
        await this.handleAutoSummary(videoId, subtitleTranslate);
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