/// <reference types="chrome"/>
import { Env, getEnvironment } from '../common';
import { settingsManager } from "../settingsManager";
import { TtsService } from './ttsService';

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
            ttsService.speakText(text, 0);
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
            ttsService.speakText(message.text, message.index, sender);
            respondToSenderSuccess(sendResponse);
            break;
        case 'speakAndPlayVideo':
            ttsService.speakText(message.text, message.index, sender, () => {
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
                }
            });
            respondToSenderSuccess(sendResponse);
            break;
        case 'ttsDeleteQueueLargerThanMarkIndex':
            ttsService.deleteQueueLargerThanMarkIndex(message.index);
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
