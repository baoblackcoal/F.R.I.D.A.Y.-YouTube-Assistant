/// <reference types="chrome"/>
import { Env, getEnvironment } from './common';
import { settingsManager } from "./settingsManager";
import {  ISettingsManager } from './settingsManager'; // Import interfaces

// Define interfaces for key components
interface ITtsService {
    speakText(text: string, streamTextIndex?: number, playVideo?: () => void, isStream?: boolean): Promise<void>;
    handleStreamText(text: string, streamTextIndex: number, playVideo: () => void): Promise<void>;
}

// TTS Service Implementation
class TtsService implements ITtsService {
    private speakTextArray: string[] = [];
    private lastStreamText: string = '';
    private isProcessing: boolean = false;
    private stopStreamSpeakFlag: boolean = false;
    private settingsManager: ISettingsManager;

    constructor(settingsManager: ISettingsManager) {
        this.settingsManager = settingsManager;
    }

    async speakText(text: string, streamTextIndex: number = 0, playVideo: () => void = () => {}, isStream: boolean = false): Promise<void> {
        if (isStream) {
            await this.handleStreamText(text, streamTextIndex, playVideo);
        } else {
            const settings = await this.settingsManager.getTtsSettings();
            console.log(`(Background)TTS Speaking text: ${text}`);
            chrome.tts.stop();
            chrome.tts.speak(text, {
                rate: settings.rate,
                pitch: settings.pitch,
                volume: settings.volume,
                voiceName: settings.voiceName,
                onEvent: (event: chrome.tts.TtsEvent) => {
                    if (event.type === 'end') {
                        console.log('(Background)TTS Speaking finished');
                        playVideo();
                    }
                }
            });
        }
    }

    async handleStreamText(text: string, streamTextIndex: number, playVideo: () => void): Promise<void> {
        if (this.stopStreamSpeakFlag) {
            return;
        }

        if (text.length == 0) {
            return;
        }
        this.lastStreamText += text;

        if (this.lastStreamText.includes('\n')) {
            const textSegments = this.lastStreamText.split('\n');
            this.lastStreamText = textSegments[textSegments.length - 1];
            for (let i = 0; i < textSegments.length - 1; i++) {
                this.speakTextArray.push(textSegments[i]);
                this.speakNextText(playVideo);
            }
        }
    }

    private async speakNextText(playVideo: () => void): Promise<void> {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;

        while (this.speakTextArray.length > 0) {
            while (await new Promise(resolve => chrome.tts.isSpeaking(resolve))) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const settings = await this.settingsManager.getTtsSettings();
            const text = this.speakTextArray.shift();
            if (text != null) {
                chrome.tts.speak(text, {
                    rate: settings.rate,
                    pitch: settings.pitch,
                    volume: settings.volume,
                    voiceName: settings.voiceName,
                    onEvent: (event: chrome.tts.TtsEvent) => {
                        if (event.type === 'end') {
                            if (this.speakTextArray.length > 0) {
                                this.speakNextText(playVideo);
                            } else {
                                this.lastStreamText = '';
                                playVideo();
                            }
                        }
                    }
                });
            }
        }
        this.isProcessing = false;
    }

    stopStreamSpeak() {
        this.stopStreamSpeakFlag = true;
        this.speakTextArray = [];
        chrome.tts.stop();
    }

    resetStreamSpeak() {
        this.speakTextArray = [];
        this.stopStreamSpeakFlag = false;
    }
}

// Initialize TTS Service
const ttsService = new TtsService(settingsManager);

// Extension first installed
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Extension installed");
    await settingsManager.initializeSettingsWhenInstalled();
    if (getEnvironment() == Env.Prod) {
        console.log("Opening options page in background");
        chrome.runtime.openOptionsPage();
    }
    chrome.contextMenus.create({
        id: "readAloud",
        title: "Read with TTS",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (!tab) return;
    if (info.menuItemId === "readAloud") {
        const text = info.selectionText;
        if (text) {
            ttsService.speakText(text);
        }
    }
});

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (message.action) {
        case 'resetWhenPageChange':
            ttsService.resetStreamSpeak();
            break;
        case 'speak':
            ttsService.speakText(message.text);
            break;
        case 'speakAndPlayVideo':
            ttsService.speakText(message.text, message.streamTextIndex || 0, () => {
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
                }
            }, message.isStream || false);
            sendResponse({ status: "success" });
            break;
        case 'ttsStop':
            ttsService.stopStreamSpeak();
            break;
        case 'ttsCheckSpeaking':
            chrome.tts.isSpeaking((isSpeaking) => {
                sendResponse({ isSpeaking });
            });
            return true;
        case 'openOptionsPage':
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
            break;
        default:
            console.log(`(Background)Unknown message action: ${message.action}`);
    }
});
