import { getLangOptionsWithLink, getRawTranscriptText } from "../transcript";
import { geminiAPI } from '../../common/geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from '../../common/ttsSpeak';
import { defaultSummarySettings } from '../../common/settings';
import { Language, ISummarySettings, SubtitleType } from '../../common/ISettings';
import { defaultPromptText } from "../../prompts/defaultPromptText";
import { settingsManager } from '../../common/settingsManager';
import { handleSubtitleSummaryView } from "./view/subtitleSummaryView";
import { logTime, waitForElm } from "../utils";
import { MessageObserver } from "../../utils/messageObserver";
import { ITtsMessage } from "../../utils/messageQueue";

let pauseVideoFlag = false;
export async function waitForPlayer(): Promise<void> {
    let hasEnterWaitForPlayer = false;

    async function checkVideoAndPause(name: string): Promise<void> {
        if (hasEnterWaitForPlayer) {
            return;
        }   

        hasEnterWaitForPlayer = true;
        await resetPlayPauseFlag();
        // loop pause video, cause call video.pause() may not work first time.
        const startTime = performance.now();
        while (true) {
            const playPauseFlag = await getPlayPauseFlag();
            pauseVideoFlag = playPauseFlag;
            // break the loop if 5 seconds passed
            if (performance.now() - startTime > 10000) {
                pauseVideoFlag = false;
                console.log("ytbs: video pause timeout");
                break;
            }
            if (!playPauseFlag) {
                break;
            } else {
                const video = document.querySelector('video');
                if (video) {
                    video.pause();
                    // console.log('ytbs: video pause');
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    //sleep for 1 ms
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
        }
    }        

    // may be #search-input loaded first
    waitForElm('#search-input').then(() => {
        logTime("search-input1");
        checkVideoAndPause("search-input1");
    });
    // may be #container(video) loaded first
    waitForElm('#container').then(async () => {
        logTime("container_video2");
        checkVideoAndPause("container_video2");
    });
}


export async function getVideoTitle(): Promise<string> {
    const titleDiv = document.querySelector('div#title.style-scope.ytd-watch-metadata');
    if (titleDiv) {
        const h1Element = titleDiv.querySelector('h1.style-scope.ytd-watch-metadata');
        if (h1Element) {
            const titleElement = h1Element.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');
            if (titleElement) {
                return titleElement.textContent?.trim() ?? "Can not get Title";
            }
        }
    }
    return "Can not get Title";
}

export async function getTranscriptText(videoId: string): Promise<string | null> {
    const langOptionsWithLink = await getLangOptionsWithLink(videoId);
    if (!langOptionsWithLink) {
        return null;
    }
    const textTranscript = await getRawTranscriptText(langOptionsWithLink[0].link);
    //delete '\n' in textTranscript
    return textTranscript.replace(/\n/g, '');
}

export function getApiKey(callback: (key: string | null) => void): void {
    chrome.storage.sync.get('geminiApiKey', (data) => {
        let geminiApiKey: string | null = null;
        try {
            if (data.geminiApiKey) {
                geminiApiKey = data.geminiApiKey;
            } else {
                console.log('Gemini API Key not found in browser storage.');
            }
            if (geminiApiKey == null) {
                geminiApiKey = process.env.GEMINI_API_KEY ?? null;
            }
        } catch (error) {
            console.error('Error getting Gemini API Key:', error);
        }
        callback(geminiApiKey);
    });
}

export function diyPrompt(customPrompt: string, videoTitle: string, textTranscript: string, language: string): string {
    const replacements: Record<string, string> = {
        '{language}': language,
        '{videoTitle}': videoTitle,
        '{textTranscript}': textTranscript
    };

    return customPrompt.replace(/{language}|{videoTitle}|{textTranscript}/g, match => replacements[match] || match);
}

async function generatePrompt(videoId: string): Promise<string> {
    const textTranscript = await getTranscriptText(videoId);
    if (textTranscript == null) {
        return "";
    }

    const videoTitle = await getVideoTitle();

    // Get summarySettings using settingsManager
    const summarySettings = await settingsManager.getSummarySettings();

    let promptText = defaultPromptText;
    if (summarySettings.promptType > 0) {
        const diyPromptKey = `diyPromptText${summarySettings.promptType}`;
        promptText = summarySettings[diyPromptKey as keyof ISummarySettings] as string || defaultPromptText;
    }

    const prompt = diyPrompt(promptText, videoTitle, textTranscript, summarySettings.language);

    return prompt;
}

// Add these new functions
function pauseVideo() {
    const video = document.querySelector('video');
    if (video) {
        video.pause();
    }
}

let playPauseFlag = false;
function playVideo() {
    const video = document.querySelector('video');
    if (video) {
        playPauseFlag = false;
        video.play();
    }
}
export async function resetPlayPauseFlag(): Promise<void> {
    const summarySettings = await settingsManager.getSummarySettings();
    playPauseFlag = summarySettings.autoTtsSpeak && summarySettings.autoSummary;
}
export async function getPlayPauseFlag(): Promise<boolean> {
    return playPauseFlag;
}

export async function subtitleSummaryHandle(videoId: string, subtitleTranslate: (videoId: string) => Promise<void>): Promise<void> {
    generateSummary(videoId, subtitleTranslate);
}

export function updateSummaryStatus(status: string): void {
    const summaryStatus = document.getElementById("ytbs_summary_status");
    if (summaryStatus) {
        summaryStatus.textContent = "Generating status: " + status;
    }
}

let paragraphIndex = 0;
export function getTtsSpeakIndex(): number {
    return paragraphIndex++;
}

export async function generateSummary(videoId: string, subtitleTranslate: (videoId: string) => Promise<void>): Promise<void> {
    const prompt = await generatePrompt(videoId);
    if (prompt == "") {
        return;
    }

    // Get summarySettings using settingsManager
    const summarySettings = await settingsManager.getSummarySettings();

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector("#fri-summary-content");
        let reavStreamText = "";
        if (contentElement) {
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    updateSummaryStatus("Generating summary...");
                    let response_text = "";
                    const parser = new DOMParser();
                    let replaceNewLineCount = 0;
                    geminiAPI.streamGenerate(prompt, async (text) => {
                        reavStreamText += text;
                        reavStreamText = reavStreamText.replace(/\. /g, '. \n').replace(/。/g, '。\n');
                        if (reavStreamText.includes('\n')) {
                            reavStreamText = reavStreamText.replace(/HTML_FORMAT/g, '');                        
                            const splitTextArray = reavStreamText.split('\n');
                            reavStreamText = splitTextArray[splitTextArray.length - 1];
                            for (let i = 0; i < splitTextArray.length - 1; i++) { 
                                const splitText = splitTextArray[i];    
                                contentElement.innerHTML += '<p style="margin-bottom: 15px;">' + splitText + '</p>';

                            }  
                            // add speak-index and speak to all child node of contentElement
                            const childNodes = contentElement.childNodes;
                            for (let i = 0; i < childNodes.length; i++) {
                                const node = childNodes[i];
                                if (node instanceof HTMLElement && node.getAttribute('speak-index') == null) {
                                    const speakIndex = getTtsSpeakIndex();
                                    node.setAttribute('speak-index', speakIndex.toString());
                                    if (summarySettings.autoTtsSpeak) {
                                        const splitText = node.textContent ?? '';
                                        const textStream = parser.parseFromString(splitText, 'text/html').documentElement.textContent ?? '';
                                        TTSSpeak.getInstance().speakAndPlayVideo(textStream, speakIndex);
                                    }
                                }
                            }                              
                        }
                       
                    }).then(async () => {
                        TTSSpeak.getInstance().speakAndPlayVideo(reavStreamText + '\n', -1); // speak a new line to make sure last line is spoken
                        const subtitleType = await settingsManager.getSummarySettings();
                        if (subtitleType.generateSubtitleType != SubtitleType.None) {
                            subtitleTranslate(videoId);
                        } else {
                            updateSummaryStatus("Generate Summary Finish.");
                        }
                        
                    }).catch((error) => {
                        parseText = `Error generating text: ${error}`;
                        contentElement.innerHTML = parseText;
                    });
                } catch (error) {
                    console.error('An error occurred:', error);
                    contentElement.innerHTML = `Error generating text: ${error}`;
                }
            } else {
                parseText = "Please set API key in the extension settings";
                contentElement.innerHTML = parseText;
            }
        }
    });
}

// Add this message listener at the end of the file
const messageObserver = MessageObserver.getInstance();
messageObserver.addObserverTtsMessage({ action: 'playVideo' }, (message: ITtsMessage) => {
    if (!pauseVideoFlag) {
        playVideo();
    }
});
