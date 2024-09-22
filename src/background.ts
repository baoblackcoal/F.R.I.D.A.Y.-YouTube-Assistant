/// <reference types="chrome"/>
import { Env, getEnvironment } from './common';
import { TtsSettings, defaultTtsSettings, SummarySettings, defaultSummarySettings} from './settings';
import { settingsManager } from "./settingsManager";



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

// Update the speakText function to use settingsManager
async function speakText(text: string, playVideo: () => void = () => {}) {
    const settings = await settingsManager.getTtsSettings();
    console.log(`(Background)TTS Speaking text: ${text}`);
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

chrome.contextMenus.onClicked.addListener((info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (!tab) return; // Handle case when tab is undefined
    if (info.menuItemId === "readAloud") {
        const text = info.selectionText;
        if (text) {
            speakText(text);
        }
    }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.action === 'speak') {
        const text = message.text;
        speakText(text);
    }
});

// Send message to content script to play the video
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.action === 'speakAndPlayVideo') {
        const text = message.text;
        speakText(text, () => {
            // Send message to content script to play the video
            if (sender.tab && sender.tab.id !== undefined) {
                chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
            }
        });
    }
});

// check if chrome.tts.isSpeaking status from message
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    if (message.action === 'ttsStop') {
        chrome.tts.stop();
    }
});

// // Send message to content script to play the video
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === 'speakAndPlayVideo') {
//         chrome.tts.speak(request.text, {
//             onEvent: function(event) {
//                 if (event.type === 'end') {
//                     // Send message to content script to play the video
//                     if (sender.tab && sender.tab.id !== undefined) {
//                         chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
//                     }
//                 }
//             }
//         });
//     }
// });
