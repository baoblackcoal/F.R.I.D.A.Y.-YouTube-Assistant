/// <reference types="chrome"/>
import { Env, getEnvironment } from './common';
import { settingsManager } from "./settingsManager";

// Define interfaces for key components
interface ITtsSettings {
    rate: number;
    pitch: number;
    volume: number;
    voiceName: string;
}

interface ISettingsManager {
    initializeSettingsWhenInstalled(): Promise<void>;
    getTtsSettings(): Promise<ITtsSettings>;
}

// extension first installed
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Extension installed");
    await settingsManager.initializeSettingsWhenInstalled();
    //open options page
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


let speakTextArray: string[] = [];
let lastStreamText: string = '';
let isProcessing: boolean = false;
let stopStreamSpeakFlag: boolean = false;

// Update the speakText function to use settingsManager
async function speakText(text: string, streamTextIndex: number = 0, playVideo: () => void = () => {}, isStream: boolean = false) {
    if (isStream) {
        handleStreamText(text, streamTextIndex, playVideo);
    } else {
        const settings = await settingsManager.getTtsSettings();
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

async function handleStreamText(text: string, streamTextIndex: number, playVideo: () => void) {
    if (stopStreamSpeakFlag) {
        return;
    }

    if (text.length == 0) {
        console.log('(Background)TTS Stream Speaking text is empty');
        return;
    }
    console.log('(Background)TTS Stream Speaking started');
    lastStreamText += text;
    console.log(`(Background)TTS Stream Speaking text: ${text}`);
    console.log(`(Background)TTS Stream Speaking streamTextIndex: ${streamTextIndex}`);

    // if lastStreamText include '\n', then push to speakTextArray
    if (lastStreamText.includes('\n')) {
        const textSegments = lastStreamText.split('\n');
        lastStreamText = textSegments[textSegments.length - 1];
        for (let i = 0; i < textSegments.length - 1; i++) {
            speakTextArray.push(textSegments[i]);
            console.log(`(Background)TTS Stream Speaking speakTextArray0 length: ${speakTextArray.length}`);
            speakNextText();
        }
    }

    //speak next text in speakTextArray in another thread
    async function speakNextText() {
        if (isProcessing) {
            return;
        }
        isProcessing = true;

        while (speakTextArray.length > 0) {
            //wait for tts to finish
            while (await new Promise(resolve => chrome.tts.isSpeaking(resolve))) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const settings = await settingsManager.getTtsSettings();
            const text = speakTextArray.shift();
            if (text != null) {  
                chrome.tts.speak(text, {
                    rate: settings.rate,
                    pitch: settings.pitch,
                    volume: settings.volume,
                    voiceName: settings.voiceName,
                    onEvent: (event: chrome.tts.TtsEvent) => {
                            if (event.type === 'end') {
                                if (speakTextArray.length > 0) {
                                    speakNextText();
                                    console.log('-------(Background)TTS Stream Speaking tts get end event, but still have text to speak');
                                } else {
                                    console.log('-------(Background)TTS Stream Speaking finished');
                                    lastStreamText = '';
                                    playVideo();
                                }
                            } else {
                                console.log('-------(Background)TTS Stream Speaking tts get event type: ' + event.type);
                            }
                        }
                    });

            }
        }

        isProcessing = false;

    }
}

chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (!tab) return; // Handle case when tab is undefined
    if (info.menuItemId === "readAloud") {
        const text = info.selectionText;
        if (text) {
            speakText(text);
        }
    }
});

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    switch (message.action) {
        case 'resetWhenPageChange':
            speakTextArray = [];
            stopStreamSpeakFlag = false;
            break;
        case 'speak':
            stopStreamSpeakFlag = false;
            speakText(message.text);
            break;
        case 'speakAndPlayVideo':
            speakText(message.text, message.streamTextIndex || 0, () => {
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
                }
            }, message.isStream || false);
            sendResponse({ status: "success" });
            break;
        case 'ttsStop':
            stopStreamSpeakFlag = true;
            speakTextArray = [];
            chrome.tts.stop();
            break;
        case 'ttsCheckSpeaking':
            chrome.tts.isSpeaking((isSpeaking) => {
                sendResponse({ isSpeaking });
            });
            return true; // Indicates that the response will be sent asynchronously
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
