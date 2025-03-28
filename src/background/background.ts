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
            case 'downloadFile':
                try {
                    // Sanitize filename - remove invalid characters and ensure .txt extension
                    const sanitizedFilename = message.data.filename
                        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Replace invalid characters with underscore
                        .replace(/^\.+/, '_')  // Replace leading dots
                        .trim();
                    
                    // Add timestamp to filename to prevent duplicates
                    const now = new Date();
                    const timestamp = now.getFullYear() + '-' +
                        String(now.getMonth() + 1).padStart(2, '0') + '-' +
                        String(now.getDate()).padStart(2, '0') + '_' +
                        String(now.getHours()).padStart(2, '0') + '-' +
                        String(now.getMinutes()).padStart(2, '0') + '-' +
                        String(now.getSeconds()).padStart(2, '0');
                    const nameWithoutExt = sanitizedFilename.toLowerCase().endsWith('.txt') 
                        ? sanitizedFilename.slice(0, -4) 
                        : sanitizedFilename;
                    const filename = `${nameWithoutExt}_${timestamp}.txt`;

                    // Create a data URL instead of a Blob URL
                    const base64Content = btoa(unescape(encodeURIComponent(message.data.content)));
                    const dataUrl = `data:text/plain;base64,${base64Content}`;
                    
                    chrome.downloads.download({
                        url: dataUrl,
                        filename: filename,
                        saveAs: false
                    }, (downloadId) => {
                        if (chrome.runtime.lastError) {
                            console.error('Download error:', chrome.runtime.lastError);
                            sendResponse({ success: false, error: chrome.runtime.lastError });
                        } else {
                            sendResponse({ success: true, downloadId });
                        }
                    });
                    return true; // Keep the message channel open for the async response
                } catch (error: unknown) {
                    console.error('Error initiating download:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    sendResponse({ success: false, error: errorMessage });
                }
                break;
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
