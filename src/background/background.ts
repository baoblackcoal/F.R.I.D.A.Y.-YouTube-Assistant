/// <reference types="chrome"/>
import { Env, getEnvironment, responseOk } from '../common/common';
import { settingsManager } from "../common/settingsManager";
import { TtsService } from './ttsService';
// import { MsTtsService } from './msTtsService';
import { ITtsService } from '../common/ITtsService';

// Assuming TtsEngine is an enum
enum TtsEngine {
    Chrome = 'Chrome',
    Microsoft = 'Microsoft',
}

// Ensure ttsEngine is of type TtsEngine
let ttsEngine: TtsEngine = TtsEngine.Chrome; 

let ttsService: ITtsService = new TtsService(settingsManager);

// if (ttsEngine === TtsEngine.Microsoft) {
//     ttsService = new MsTtsService(settingsManager);
// } else {
//     ttsService = new TtsService(settingsManager);
// }

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

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (!tab) return;
    if (info.menuItemId === "readAloud") {
        const text = info.selectionText;
        if (text) {
            ttsService.speakText(text, 0, {}, () => {});
        }
    }
});

function respondToSenderSuccess(sendResponse: (response?: any) => void) {
    sendResponse(responseOk);
}

function sendTtsMessageToMsTts(action: string, message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    const id = sender.tab?.id || 0;
    message.action = action+'Background';
    chrome.tabs.sendMessage(id, message);
    respondToSenderSuccess(sendResponse);
}

function handleTTSMessage(action: string, message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) : boolean {
    switch (action) {
        case 'resetWhenPageChange':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.resetStreamSpeak();
            respondToSenderSuccess(sendResponse);
        }
        return true;
    case 'resetStreamSpeak':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.resetStreamSpeak();
            respondToSenderSuccess(sendResponse);
        }
        return true;
    case 'speak':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.speakText(message.text, message.index, sender);
            respondToSenderSuccess(sendResponse);
        }
        return true;
    case 'speakAndPlayVideo':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.speakText(message.text, message.index, sender, () => {
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
                }
            });
            respondToSenderSuccess(sendResponse);
        }
        return true;
    case 'ttsDeleteQueueLargerThanMarkIndex':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.deleteQueueLargerThanMarkIndex(message.index);
            respondToSenderSuccess(sendResponse);
        }
        return true;
    case 'ttsStop':
        if (ttsEngine === TtsEngine.Microsoft) {
            sendTtsMessageToMsTts(action, message, sender, sendResponse);
        } else {
            ttsService.stopStreamSpeak();
            respondToSenderSuccess(sendResponse);
        }
        return true;
    }

    return false;   
}

chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const handled = handleTTSMessage(message.action, message, sender, sendResponse);
    if (!handled) {
        switch (message.action) {    
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
    }
});
