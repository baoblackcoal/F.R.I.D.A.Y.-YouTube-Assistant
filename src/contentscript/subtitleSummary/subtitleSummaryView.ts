import { AbstractSettings, Language } from '../../settings';
import { TTSSpeak } from '../ttsSpeak';
import { settingsManager } from '../../settingsManager';
import { subtitleSummaryHandle } from './subtitleSummary';
import { waitForElm } from '../utils';
import { subtitleTranslate } from './subtitleTranslate';
import { copyTextToClipboard } from '../copy';

export function insertSummaryButtonView() {
    const butttonHtml = `<button id="ytbs_summary_btn" style="display: inline-block; font-size: 14px; line-height: 36px; padding: 0px 20px; margin: 0px 8px 3px; background-color: lightgrey; border-radius: 20px; transition: background-color 0.3s, transform 0.3s; cursor: pointer; transform: scale(1);" onmouseover="this.style.backgroundColor='grey';" onmouseout="this.style.backgroundColor='lightgrey';" onmousedown="this.style.backgroundColor='darkgrey'; this.style.transform='scale(0.95)';" onmouseup="this.style.backgroundColor='grey'; this.style.transform='scale(1)';">Summary</button>`
    waitForElm('#top-level-buttons-computed').then(() => {
        (document.querySelector("#top-level-buttons-computed") as HTMLElement).insertAdjacentHTML("afterbegin", butttonHtml);
    });
}

export function getSubtitleSummaryView() {
    return `<div class="ytbs_container" style="font-size: 15px; background-color: rgb(255, 255, 255);  padding:6px;">
                    <div id="ytbs_control_panel" style="justify-content: space-between; margin-bottom: 10px;">
                        <button id="ytbs_speak">Speak</button>
                        <button id="ytbs_auto_speak">Auto Speak</button>
                        <button id="ytbs_copy">Copy</button>
                        <button id="ytbs_language">English</button>
                        <button id="ytbs_settings">Settings</button>
                    </div>
                     <div id="ytbs_summary_status"  style="margin-bottom: 10px;"> </div>

                    <div class="ytbs_content"> </div>    
                </div>`;
}


const tts = TTSSpeak.getInstance();



// Handle the view of subtitle summary
export async function handleSubtitleSummaryView(videoId: string): Promise<void> {
    resetWhenPageChange();   

    buttonSpeakHandle();
    buttonAutoSpeakHandle();
    buttonLanguageHandle();
    buttonSettingsHandle();
    buttonSummaryToggleHandle();
    buttonCopyHandle();

    handleTtsSpeakingText();

    subtitleSummaryHandle(videoId, subtitleTranslate);
}

let currentHightlightIndex = 0;
let isHandTtsSpeakingText = false;
function handleTtsSpeakingText(): void {
    //listen to ttsSpeakingText event

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {       
        if (message.action === 'ttsSpeakingText') {
            if (isHandTtsSpeakingText) {
                return;
            }
            isHandTtsSpeakingText = true;   

            let ttsText = message.text;
            // delete ttsText ' ' at the beginning and the end
            ttsText = ttsText.trim();   

            //search text from ytbs_content all content, and highlight font color to red of the text
            const ytbs_content = document.querySelector(".ytbs_content") as HTMLElement;
            //get element from ytbs_content paragraph, div, span, etc, that has text content
            //loop through all child elements of ytbs_content
            let preHtmlNode: ChildNode | null = null;
            for (let i = 0; i < ytbs_content.childNodes.length; i++) {
                let node = ytbs_content.childNodes[i];
                if (i < currentHightlightIndex) {
                    continue;
                } else {    
                    let textContent = node.textContent;
                    if (textContent) {
                        textContent = textContent.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
                    }
                    if (textContent && textContent.includes(ttsText)) {
                        currentHightlightIndex = i;
                        (node as HTMLElement).style.backgroundColor = "grey";
                        break;
                    }
                    try {   
                        (node as HTMLElement).style.backgroundColor = "white";
                    } catch (error) {
                        // console.error("Error setting background color to white", error);
                    }
                }
            };
            isHandTtsSpeakingText = false;
        }
    });
}

function buttonCopyHandle(): void {
    const buttonCopy = document.getElementById("ytbs_copy");
    if (buttonCopy) {
        buttonCopy.addEventListener("click", () => {
            const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
            copyTextToClipboard(text);
        });
    }
}

async function resetWhenPageChange(): Promise<void> {
    currentHightlightIndex = 0;

    await new Promise<void>((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'resetWhenPageChange' }, (response) => {
            if (response.status === 'success') {
                resolve();
            } else {
                reject(new Error('Failed to reset when page change'));
            }
        });
    });
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
            if (await tts.isSpeaking()) {
                tts.stop();
                buttonSpeak.textContent = "Speak";
            } else {
                //get text from ytbs_content    
                const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
                tts.speak(text, true);
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
            console.log(`Auto Speak set to ${settings.summary.autoTtsSpeak}`);
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


