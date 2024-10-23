import { AbstractSettings, Language } from '../../common/settings';
import { TTSSpeak } from '../ttsSpeak';
import { settingsManager } from '../../common/settingsManager';
import { getVideoTitle, subtitleSummaryHandle } from './subtitleSummary';
import { logTime, waitForElm } from '../utils';
import { subtitleTranslate } from './subtitleTranslate';
import { copyTextToClipboard } from '../copy';
import { listenToMessages } from '../../contentscript/msTtsService';
import { MessageObserver } from '../../utils/messageObserver';
import { ITtsMessage } from '../../utils/messageQueue';
import { responseOk } from '../../common/common';

export function insertSummaryButtonView() {
    const butttonHtml = `<button id="ytbs_summary_btn" style="display: inline-block; font-size: 14px; line-height: 36px; padding: 0px 20px; margin: 0px 8px 3px; background-color: lightgrey; border-radius: 20px; transition: background-color 0.3s, transform 0.3s; cursor: pointer; transform: scale(1);" onmouseover="this.style.backgroundColor='grey';" onmouseout="this.style.backgroundColor='lightgrey';" onmousedown="this.style.backgroundColor='darkgrey'; this.style.transform='scale(0.95)';" onmouseup="this.style.backgroundColor='grey'; this.style.transform='scale(1)';">Summary</button>`
    waitForElm('#top-level-buttons-computed').then(() => {
        (document.querySelector("#top-level-buttons-computed") as HTMLElement).insertAdjacentHTML("afterbegin", butttonHtml);
    });
}

export function getSubtitleSummaryView() {
    return `<div class="ytbs_container" style="font-size: 15px; background-color: rgb(255, 255, 255);  padding:6px;">
                    <div id="ytbs_control_panel" style="justify-content: space-between; margin-bottom: 10px;">
                        <button id="ytbs_auto_summary">Summary</button>
                        <button id="ytbs_auto_speak">Auto Speak</button>
                        <button id="ytbs_play_pause">Pause</button>
                        <button id="ytbs_speak">Speak</button>
                        <button id="ytbs_language">English</button>
                        <button id="ytbs_settings">Settings</button>
                        <button id="ytbs_more_btn">More</button>
                    </div>
                     <div id="ytbs_summary_status"  style="margin-bottom: 10px;"> </div>

                    <div class="ytbs_content"> </div>    
                </div>`;
}


const tts = TTSSpeak.getInstance();



// Handle the view of subtitle summary
export async function handleSubtitleSummaryView(videoId: string): Promise<void> {
    await listenToMessages();  
    logTime('handleSubtitleSummaryView 0');
    await resetWhenPageChange();   
    logTime('handleSubtitleSummaryView 1');
    buttonSpeakHandle();
    buttonAutoSpeakHandle();
    buttonLanguageHandle();
    buttonSettingsHandle();
    buttonSummaryToggleHandle();
    buttonMoreHandle();
    handleTtsSpeakingText();
    buttonAutoSummaryHandle();
    buttonPlayPauseHandle();
    handleAutoSummary(videoId);
}

async function handleAutoSummary(videoId: string): Promise<void> {
    const autoSummary = (await getSettings()).summary.autoSummary;
    if (autoSummary) {
        subtitleSummaryHandle(videoId, subtitleTranslate);
    } else {
        const ytbs_content = document.querySelector(".ytbs_content") as HTMLElement;
        if (ytbs_content) {
            ytbs_content.innerHTML = "Summary disable.";
        }
    }
}

const messageObserver = MessageObserver.getInstance();
let currentHightlightIndex = 0;
let isHandTtsSpeakingText = false;
let currentHightlightNode: HTMLElement | null = null;
let currentReadIndex = 0;
function handleTtsSpeakingText(): void {
    messageObserver.addObserverTtsMessage({ action: 'ttsSpeakingText' }, (message: ITtsMessage) => {
        if (isHandTtsSpeakingText) {
            return;
        }
        isHandTtsSpeakingText = true;   

        let ttsTextIndex = message.index;
        currentReadIndex = ttsTextIndex ?? 0;

        //search text from ytbs_content all content, and highlight font color to red of the text
        const ytbs_content = document.querySelector(".ytbs_content") as HTMLElement;
        //get element from ytbs_content paragraph, div, span, etc, that has text content
        //loop through all child elements of ytbs_content
        let preHtmlNode: ChildNode | null = null;
        for (let i = 0; i < ytbs_content.childNodes.length; i++) {
            let node = ytbs_content.childNodes[i] as HTMLElement;
            // Check if the node is an HTMLElement
            if (node instanceof HTMLElement) {
                let speakIndex = node.getAttribute('speak-index');
                if (Number(speakIndex) == ttsTextIndex) {
                    currentHightlightNode = node;
                    currentHightlightNode.style.backgroundColor = "yellow";
                } else {
                    try {   
                        const element = node as HTMLElement;
                        if (element.style.backgroundColor != "white") {                        
                            element.style.backgroundColor = "white";
                        }
                    } catch (error) {
                        // console.error("Error setting background color to white", error);
                    }
                }                     
            } 
        };
        isHandTtsSpeakingText = false;
    
    });
}

export function resetHighlightText(): void {
    currentHightlightIndex = 0;
    if (currentHightlightNode) {
        currentHightlightNode.style.backgroundColor = "white";
    }
}

function buttonPlayPauseHandle(): void {
    async function updatePlayPauseButtonDisplay(){
        const buttonPlayPause = document.getElementById("ytbs_play_pause");
        if (buttonPlayPause) {
            if (await tts.isSpeaking()) {
                buttonPlayPause.textContent = "Pause";
            } else {
                buttonPlayPause.textContent = "Play";
            }
        } 
    }

    // update the display of the speak button every 3 seconds
    setInterval(updatePlayPauseButtonDisplay, 3000);
    
    const buttonPlayPause = document.getElementById("ytbs_play_pause");

    // click buttonSpeak, call tts.speak()
    if (buttonPlayPause) {
        buttonPlayPause.addEventListener("click", async () => {
            console.log("ytbs_play_pause clicked");
            const parser = new DOMParser();

            if (await tts.isSpeaking()) {
                await tts.stop();
                buttonPlayPause.textContent = "Play";
            } else {
                await tts.resetStreamSpeak();
                const tempElement = document.querySelector(".ytbs_content") as HTMLElement;
                const childNodes = tempElement.children;
                for (let i = 0; i < childNodes.length; i++) {
                    const node = childNodes[i];
                    if (node instanceof HTMLElement) {
                        const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                        if (speakIndex >= currentReadIndex) {
                            const textStream = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                            tts.speak(textStream, speakIndex);
                        }
                    }
                }
                buttonPlayPause.textContent = "Pause";
            }
        });
    }

}


function buttonAutoSummaryHandle(): void {
    async function updateAutoSummaryButtonDisplay(){
        const buttonAutoSummary = document.getElementById("ytbs_auto_summary");
        if (buttonAutoSummary) {
            const settings = await getSettings();
            buttonAutoSummary.textContent = settings.summary.autoSummary ? "Summary: ON" : "Summary: OFF";            
        } 
    }
    updateAutoSummaryButtonDisplay();
    const buttonAutoSummary = document.getElementById("ytbs_auto_summary");
    if (buttonAutoSummary) {
        buttonAutoSummary.addEventListener("click", async () => {
            console.log("ytbs_auto_summary clicked");
            const settings = await getSettings();
            settings.summary.autoSummary = !settings.summary.autoSummary;
            await settingsManager.setSummarySettings(settings.summary);
            await updateAutoSummaryButtonDisplay();           
            window.location.reload();
        });
    }
}

function buttonMoreHandle(): void {
    const buttonMore = document.getElementById("ytbs_more_btn");
    if (buttonMore) {
        buttonMore.addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent immediate closing
            openMorePopup(buttonMore);
        });
    }
}

function openMorePopup(buttonMore: HTMLElement): void {
    // Remove existing popup if any
    const existingPopup = document.getElementById("ytbs_more_popup");
    if (existingPopup) {
        existingPopup.remove();
    }

    const popupHtml = `
        <div id="ytbs_more_popup" style="position: absolute; background-color: white; padding: 10px; border-radius: 5px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 9999;">
            <button id="ytbs_popup_copy">Copy</button>
            <button id="ytbs_popup_download">Download</button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHtml);

    const popup = document.getElementById("ytbs_more_popup");
    if (popup) {
        // Position the popup near the More button
        const rect = buttonMore.getBoundingClientRect();
        popup.style.top = `${rect.bottom + window.scrollY}px`;
        popup.style.left = `${rect.left + window.scrollX}px`;

        document.getElementById("ytbs_popup_copy")?.addEventListener("click", handleCopy);
        document.getElementById("ytbs_popup_download")?.addEventListener("click", handleDownload);

        // Close popup when clicking outside
        document.addEventListener('click', closePopupOnClickOutside);
    }
}

function closePopupOnClickOutside(event: MouseEvent): void {
    const popup = document.getElementById("ytbs_more_popup");
    if (popup && !popup.contains(event.target as Node)) {
        popup.remove();
        document.removeEventListener('click', closePopupOnClickOutside);
    }
}

function showToast(message: string): void {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function handleCopy(): Promise<void> {
    const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
    await copyTextToClipboard(text);
    showToast("Content copied to clipboard!");
}

async function handleDownload(): Promise<void> {
    const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const videoTitle = await getVideoTitle();
    a.download = `${videoTitle}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Content downloaded!");
}

const timeoutPromise = new Promise<void>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), 5000); // 5000 ms timeout
});

async function resetWhenPageChange(): Promise<void> {
    currentHightlightIndex = 0;

    await Promise.race([
        new Promise<void>((resolve, reject) => {
            const message: ITtsMessage = { action: 'resetWhenPageChange' };
            messageObserver.notifyObserversTtsMessage(message, (response) => {
            // chrome.runtime.sendMessage(message, (response) => {
                if (response === responseOk) {
                    resolve();
                } else {
                    reject(new Error('Failed to reset when page change'));
                }
            });
        }),
        timeoutPromise
    ]);
}

async function getSettings(): Promise<AbstractSettings> {
    return await settingsManager.getSettings();
}

function buttonSpeakHandle(): void {
    async function updateSpeakButtonDisplay(){
        const buttonSpeak = document.getElementById("ytbs_speak");
        if (buttonSpeak) {
            if (await tts.isSpeaking()) {
                buttonSpeak.textContent = "Speaking...";
            } else {
                buttonSpeak.textContent = "Speak";
            }
        } 
    }

    // update the display of the speak button every 3 seconds
    setInterval(updateSpeakButtonDisplay, 3000);
    
    const buttonSpeak = document.getElementById("ytbs_speak");

    // click buttonSpeak, call tts.speak()
    if (buttonSpeak) {
        buttonSpeak.addEventListener("click", async () => {
            console.log("ytbs_speak clicked");
            const parser = new DOMParser();

            if (await tts.isSpeaking()) {
                resetHighlightText();
                await tts.stop();
                buttonSpeak.textContent = "Speak";
            } else {
                await tts.resetStreamSpeak();
                const tempElement = document.querySelector(".ytbs_content") as HTMLElement;
                const childNodes = tempElement.children;
                for (let i = 0; i < childNodes.length; i++) {
                    const node = childNodes[i];
                    if (node instanceof HTMLElement) {
                        const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                        const textStream = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                        tts.speak(textStream, speakIndex);
                    }
                }
                buttonSpeak.textContent = "Speaking...";
            }
        });
    }
}

function buttonAutoSpeakHandle(): void {
    const buttonAutoSpeak = document.getElementById("ytbs_auto_speak");
    if (buttonAutoSpeak) {
        // update the display of the auto speak button
        async function updateAutoSpeakButtonDisplay(buttonAutoSpeak: HTMLElement){
                const settings = await getSettings();
                buttonAutoSpeak.textContent = settings.summary.autoTtsSpeak ? "Auto Speak: ON" : "Auto Speak: OFF";
        }
        updateAutoSpeakButtonDisplay(buttonAutoSpeak);

        buttonAutoSpeak.addEventListener("click", async () => {
            const settings = await getSettings();
            settings.summary.autoTtsSpeak = !settings.summary.autoTtsSpeak;
            await settingsManager.setSummarySettings(settings.summary);
            await updateAutoSpeakButtonDisplay(buttonAutoSpeak);
            window.location.reload();
        });
    }
}

function buttonLanguageHandle(): void {
    const buttonLanguage = document.getElementById("ytbs_language");
    if (buttonLanguage) {
        async function updateLanguageButtonDisplay(buttonLanguage: HTMLElement){
            const settings = await getSettings();
            buttonLanguage.textContent = settings.summary.language;
        }   
        updateLanguageButtonDisplay(buttonLanguage);

        buttonLanguage.addEventListener("click", async () => {
            const settings = await getSettings();
            const currentLanguage = settings.summary.language as Language;
            const languages = Object.values(Language) as Language[];
            const nextLanguageIndex = (languages.indexOf(currentLanguage) + 1) % languages.length;
            settings.summary.language = languages[nextLanguageIndex];
            await settingsManager.setSummarySettings(settings.summary);
            await updateLanguageButtonDisplay(buttonLanguage);
            console.log(`Language set to ${settings.summary.language}`);
        });
    }
}

function buttonSettingsHandle(): void {
    const buttonSettings = document.getElementById("ytbs_settings");
    if (buttonSettings) {
        buttonSettings.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        });
    }
}

function buttonSummaryToggleHandle(): void {
    const buttonContainerHide = document.getElementById("ytbs_summary_btn");
    if (buttonContainerHide) {
        buttonContainerHide.addEventListener("click", () => {
            const container = document.querySelector(".yt_ai_summary_container");
            if (container) {
                (container as HTMLElement).style.display = (container as HTMLElement).style.display === "none" ? "block" : "none";
            }
        });
    }
}





