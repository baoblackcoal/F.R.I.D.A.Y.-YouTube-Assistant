/// <reference types="chrome"/>
import { Env, getEnvironment } from './common';
import { defaultTtsSettings, TtsSettings } from './settings';
import { settingsManager } from "./settingsManager";
import {  ISettingsManager } from './settingsManager'; // Import interfaces

// Define interfaces for key components
interface ITtsService {
    speakText(text: string, sender: chrome.runtime.MessageSender, playVideo?: () => void): Promise<void>;
    handleStreamText(text: string, sender: chrome.runtime.MessageSender, playVideo: () => void): Promise<void>;
}

// TTS Service Implementation
class TtsService implements ITtsService {
    private speakTextArray: string[] = [];
    private lastStreamText: string = '';
    private isProcessing: boolean = false;
    private stopStreamSpeakFlag: boolean = false;
    private settingsManager: ISettingsManager;
    private defaultSender: chrome.runtime.MessageSender = {};
    private ttsSettings: TtsSettings = defaultTtsSettings;
    private speakingText: string = 'start_speak_flag';

    constructor(settingsManager: ISettingsManager) {
        this.settingsManager = settingsManager;
        this.initializeTtsSettings();
    }

    private async initializeTtsSettings(): Promise<void> {
        this.ttsSettings = await this.settingsManager.getTtsSettings();
    }

    async speakText(text: string, sender: chrome.runtime.MessageSender = this.defaultSender, playVideo: () => void = () => {}): Promise<void> {
        await this.handleStreamText(text, sender, playVideo);
    }

    async handleStreamText(text: string, sender: chrome.runtime.MessageSender=this.defaultSender, playVideo: () => void = () => {}): Promise<void> {
        if (this.stopStreamSpeakFlag) {
            return;
        }

        if (text.length == 0) {
            return;
        }

        this.ttsSettings = await this.settingsManager.getTtsSettings();
        this.speakTextArray.push(text);
        this.speakNextText(false, sender, playVideo);
    }

    private async speakNextText(isTtsSpeakEndCallback: boolean, sender: chrome.runtime.MessageSender, playVideo: () => void): Promise<void> {
        if (this.isProcessing && !isTtsSpeakEndCallback) {
            return;
        }
        this.isProcessing = true;

        while (this.speakTextArray.length > 0 || this.speakingText.length > 0) {
            if (this.speakingText.length > 0 || this.speakingText == 'start_speak_flag') {
                let text = ''
                if (this.speakingText == 'start_speak_flag') {
                    this.speakingText = '';
                    text = ' ';//for tts speak finish callback
                }
                if (this.speakingText.length > 0) {
                    text = this.speakingText;
                    this.speakingText = '';
                }
                chrome.tts.speak(text, {
                    rate: this.ttsSettings.rate,
                    pitch: this.ttsSettings.pitch,
                    volume: this.ttsSettings.volume,
                    voiceName: this.ttsSettings.voiceName,
                    onEvent: (event: chrome.tts.TtsEvent) => {
                        // console.log("event.type : ", event.type);
                        if (event.type === 'end') {
                            if (this.speakTextArray.length > 0) {
                                //get next text, but check if it's not empty
                                let getNextText = false;
                                while(true) {
                                    this.speakingText = this.speakTextArray.shift() || '';                                    
                                    if (this.speakingText.length > 0) {
                                        getNextText = true;
                                        break;
                                    } else if (this.speakTextArray.length == 0) {
                                        break;
                                    }
                                }
                                if (getNextText) {
                                    console.log("speakNextText: ", this.speakingText);
                                    //sent current text to content-script
                                    if (sender.tab && sender.tab.id !== undefined) {    
                                        chrome.tabs.sendMessage(sender.tab.id, { action: 'ttsSpeakingText', text: this.speakingText });
                                    }
                                    this.speakNextText(true, sender, playVideo);
                                }
                            } else {
                                this.speakingText = '';
                                this.lastStreamText = '';
                                this.isProcessing = false;
                                this.speakingText = 'start_speak_flag';
                                playVideo();
                            }
                        } else {

                        }
                    }
                });
            }
            //wait tts speak finish
            while (await new Promise(resolve => chrome.tts.isSpeaking(resolve))) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }            
        }
    }

    stopStreamSpeak() {
        this.stopStreamSpeakFlag = true;
        this.isProcessing = false;
        this.speakTextArray = [];
        this.lastStreamText = '';
        this.speakingText = '';
        chrome.tts.stop();
    }

    resetStreamSpeak() {
        this.isProcessing = false;
        this.stopStreamSpeakFlag = false;
        this.speakTextArray = [];
        this.lastStreamText = '';
        this.speakingText = 'start_speak_flag';
        chrome.tts.stop();
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

function respondToSenderSuccess(sendResponse: (response?: any) => void) {
    sendResponse({ status: "success" });
}



chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (message.action) {
        case 'resetWhenPageChange':
            ttsService.resetStreamSpeak();
            respondToSenderSuccess(sendResponse);
            break;
        case 'resetStreamSpeak':
            ttsService.resetStreamSpeak();
            respondToSenderSuccess(sendResponse);
            break;
        case 'speak':
            ttsService.speakText(message.text,  sender);
            respondToSenderSuccess(sendResponse);
            break;
        case 'speakAndPlayVideo':
            ttsService.speakText(message.text,  sender, () => {
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
                }
            });
            respondToSenderSuccess(sendResponse);
            break;
        case 'ttsStop':
            ttsService.stopStreamSpeak();
            respondToSenderSuccess(sendResponse);
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
            respondToSenderSuccess(sendResponse);
            break;
        default:
            console.log(`(Background)Unknown message action: ${message.action}`);
    }
});
