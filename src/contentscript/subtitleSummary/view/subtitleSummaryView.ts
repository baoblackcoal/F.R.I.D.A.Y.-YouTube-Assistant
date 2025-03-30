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
import { ISubtitleTranslate, SubtitleTranslate } from '../subtitleTranslate';
import { getSearchParam } from '../../searchParam';
import { i18nService } from '../../friSummary/i18nService';
import { Toast } from '../../../common/toast';
import { FriSummary } from '../../friSummary/friSummary';
import { SrtButtonHandler } from '../srtGenerate';

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
        if (!SubtitleSummaryView.instance) {
            SubtitleSummaryView.instance = new SubtitleSummaryView();
        }
        return SubtitleSummaryView.instance;
    }

    async init(): Promise<void> {
        this.generating = false;
        await this.reloadPage();
        await listenToMessages();
        await this.resetWhenPageChange();
        initializeButtons(this.tts, this);
        // Initialize SRT button handler
        SrtButtonHandler.getInstance().init();
        this.handleTtsSpeakingText();
        updateSummaryStatus("...", FridayStatus.Init);
        setTimeout(() => {
            updateSummaryStatus("Waiting...", FridayStatus.Waiting);
        }, 1000);
        
        await this.handleAutoSummary();
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

    public checkGenerateContent(): [boolean, string] {
        const text = (document.querySelector("#fri-summary-content") as HTMLElement).innerText;
        if (!text || text === " ") {
            return [false, ""];
        }
        return [true, text];    
    }

    public checkGenerateContentAndToast(): [boolean, string] {
        const [hasContent, text] = this.checkGenerateContent();
        if (!hasContent) {
            Toast.show({
                type: 'info',
                message: i18nService.getMessage('summary-popup-generate-first-tip')
            });
        } 
        return [hasContent, text];
    }

    async manualStartGenerate(): Promise<void> {
        this.generating = true;
        const maualStart = true;
        await this.handleAutoSummary(maualStart);
    }

    public reInitContent(): void {
        const content = document.querySelector("#fri-summary-content") as HTMLElement;
        if (content) {
            content.innerHTML = "";
        }
    }

    private async handleAutoSummary(maualStart: boolean = false): Promise<void> {
        const settings = await getSettings();
        if (settings.summary.autoGenerate || maualStart) {
            this.generating = true;
            const generating = await subtitleSummaryHandle(this.getVideoId(), SubtitleTranslate.getInstance());
            if (!generating) {
                this.generating = false;
            }
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
        // // Create a new button element
        // const logo = document.createElement('img');
        // logo.id = 'ytbs_summary_logo';
        // logo.src = chrome.runtime.getURL('friday_logo_48.png');
        // logo.style.width = '32px';

        // // Add a click event listener for custom functionality
        // logo.addEventListener('click', () => {
        //     // alert('Summary button clicked!'); // Replace with desired functionality
        // });
        
        // // Insert the button after the logo element
        // logoElement.insertAdjacentElement('afterend', logo);
    }

}

const view = SubtitleSummaryView.getInstance();

export async function handleSubtitleSummaryView(): Promise<void> {
    await view.init();
}

export function resetHighlightText(): void {
    view.resetHighlightText();
}
