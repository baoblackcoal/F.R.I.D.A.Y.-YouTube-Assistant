/// <reference types="chrome"/>
import { TtsSettings, defaultTtsSettings, SummarySettings, defaultSummarySettings} from './settings';
import { settingsManager } from "./settingsManager";

// extension first installed
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
    settingsManager.initializeDefaultSettings();
});

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ ttsSettings: defaultTtsSettings });
  chrome.storage.sync.set({ summarySettings: defaultSummarySettings });
  chrome.contextMenus.create({
    id: "readAloud",
    title: "Read with TTS",
    contexts: ["selection"]
  });
});

function speakText(text: string, playVideo: () => void = () => {}) {
  chrome.storage.sync.get('ttsSettings', (data: { [key: string]: any }) => {
    const settings: TtsSettings = data.ttsSettings || defaultTtsSettings;
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
