/// <reference types="chrome"/>
import { Env, responseOk } from '../common/common';
import { settingsManager } from "../common/settingsManager";
import { TtsService } from './ttsService';
// import { MsTtsService } from './msTtsService';
import { ITtsService } from '../common/ITtsService';

let ttsService: ITtsService = new TtsService(settingsManager);

// Extension first installed
chrome.runtime.onInstalled.addListener(async () => {
    console.log("Extension installed");
    await settingsManager.initializeSettingsWhenInstalled();
    chrome.runtime.openOptionsPage();
});

chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

function respondToSenderSuccess(sendResponse: (response?: any) => void) {
    sendResponse(responseOk);
}


function handleTTSMessage(action: string, message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) : boolean {
    switch (action) {
        case 'resetWhenPageChange':       
        ttsService.resetStreamSpeak();
        respondToSenderSuccess(sendResponse);       
        return true;
    case 'resetStreamSpeak':
        ttsService.resetStreamSpeak();
        respondToSenderSuccess(sendResponse);
        return true;
    case 'speak':
            ttsService.speakText(message.text, message.index, sender);
        respondToSenderSuccess(sendResponse);
        return true;
    case 'speakAndPlayVideo':
        ttsService.speakText(message.text, message.index, sender, () => {
            if (sender.tab && sender.tab.id !== undefined) {
                chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
            }
        });
        respondToSenderSuccess(sendResponse);
        return true;
    case 'ttsDeleteQueueLargerThanMarkIndex':
        ttsService.deleteQueueLargerThanMarkIndex(message.index);
        respondToSenderSuccess(sendResponse);
        return true;
    case 'ttsStop':
        ttsService.stopStreamSpeak();
        respondToSenderSuccess(sendResponse);
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
                // console.log(`(Background)Unknown message action: ${message.action}`);
                break;
        }
    }
});
