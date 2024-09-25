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


let speakTextArray: string[] = [];
let speakTextSegmentArray: string[] = [];
let isStartSpeakStream: boolean = false;
let lastStreamText: string = '';
let isProcessing: boolean = false;

// Update the speakText function to use settingsManager
async function speakText(text: string, streamTextIndex: number = 0, playVideo: () => void = () => {}, isStream: boolean = false) {
    if (isStream) {
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
            // if (!isStartSpeakStream) {
            //     isStartSpeakStream = true;
            //     speakNextText();
            // }
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
                                        isStartSpeakStream = false;
                                        playVideo();
                                    }
                                } else {
                                    console.log('-------(Background)TTS Stream Speaking tts get event type: ' + event.type);
                                    // if (speakTextArray.length > 0) {
                                    //     speakNextText();
                                    //     console.log('-------(Background)TTS Stream Speaking tts get event type: ' + event.type + ', but still have text to speak');
                                    // }
                                }
                            }
                        });

                }
            }

            isProcessing = false;

            // const settings = await settingsManager.getTtsSettings();
            // const text = speakTextArray.shift();
            // console.log(`(Background)------text = ${text}`);
            // console.log(`(Background)------speakNextText speakTextArray1: ${speakTextArray}`);
            // if (text != null) {             
            //     console.log(`(Background)-------speakNextText Speaking: ${text}`);   
            //     // if (speakTextArray.length > 0) {
            //     //     speakNextText();
            //     // } else {
            //     //     console.log('(Background)TTS Stream Speaking finished');
            //     //     lastStreamText = '';
            //     //     isStartSpeakStream = false;
            //     //     playVideo();
            //     // }

            //     chrome.tts.speak(text, {
            //         rate: settings.rate,
            //         pitch: settings.pitch,
            //         volume: settings.volume,
            //         voiceName: settings.voiceName,
            //         onEvent: (event: chrome.tts.TtsEvent) => {
            //                 if (event.type === 'end') {
            //                     if (speakTextArray.length > 0) {
            //                         speakNextText();
            //                         console.log('-------(Background)TTS Stream Speaking tts get end event, but still have text to speak');
            //                     } else {
            //                         console.log('-------(Background)TTS Stream Speaking finished');
            //                         lastStreamText = '';
            //                         isStartSpeakStream = false;
            //                         playVideo();
            //                     }
            //                 } else {
            //                     console.log('-------(Background)TTS Stream Speaking tts get event type: ' + event.type);
            //                     // if (speakTextArray.length > 0) {
            //                     //     speakNextText();
            //                     //     console.log('-------(Background)TTS Stream Speaking tts get event type: ' + event.type + ', but still have text to speak');
            //                     // }
            //                 }
            //             }
            //         });
            //     // if (speakTextArray.length > 0) {
            //     //     speakNextText();
            //     // }
            // } else {             
            //     console.log('-------(Background)TTS Stream Speaking !text, speakTextArray.length: ' + speakTextArray.length);   
            //     if (speakTextArray.length > 0) {
            //         speakNextText();
            //     }
            // }
        }
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
        const isStream = message.isStream;
        speakText(text);
    } else if (message.action === 'speakAndPlayVideo') {
        const text = message.text;
        const isStream = message.isStream || false;
        const streamTextIndex = message.streamTextIndex || 0;
        speakText(text, streamTextIndex, () => {
            // Send message to content script to play the video
            if (sender.tab && sender.tab.id !== undefined) {
                chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
            }
        }, isStream);
        sendResponse({status: "success"});
    } else if (message.action === 'ttsStop') {
        chrome.tts.stop();
    } else if (message.action === 'ttsCheckSpeaking') {
        chrome.tts.isSpeaking((isSpeaking) => {
            sendResponse({ isSpeaking });
        });
        return true; // Indicates that the response will be sent asynchronously
    } else if (message.action === 'openOptionsPage') {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    } else {
        console.log(`(Background)Unknown message action: ${message.action}`);
    }
});

// // Send message to content script to play the video
// chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
//     if (message.action === 'speakAndPlayVideo') {
//         const text = message.text;
//         const isStream = message.isStream || false;
//         speakText(text, () => {
//             // Send message to content script to play the video
//             if (sender.tab && sender.tab.id !== undefined) {
//                 chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
//             }
//         }, isStream);
//         sendResponse({status: "success"});
//     }
// });

// // check if chrome.tts.isSpeaking status from message
// chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
//     if (message.action === 'ttsStop') {
//         chrome.tts.stop();
//     } else if (message.action === 'ttsCheckSpeaking') {
//         chrome.tts.isSpeaking((isSpeaking) => {
//             sendResponse({ isSpeaking });
//         });
//         return true; // Indicates that the response will be sent asynchronously
//     }
// });

// // Open options page on message
// chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
//     if (message.action === 'openOptionsPage') {
//         if (chrome.runtime.openOptionsPage) {
//             chrome.runtime.openOptionsPage();
//         } else {
//             window.open(chrome.runtime.getURL('options.html'));
//         }
//     }
// });

