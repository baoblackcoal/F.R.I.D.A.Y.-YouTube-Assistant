import { getLangOptionsWithLink, getRawTranscriptText } from "../transcript";
import { geminiAPI } from '../geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from '../ttsSpeak';
import { SummarySettings, defaultSummarySettings, Language } from '../../settings';
import { defaultPromptText } from "../../defaultPromptText";
import { settingsManager } from '../../settingsManager';
import { handleSubtitleSummaryView } from "./subtitleSummaryView";
import { logTime, waitForElm } from "../utils";

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
            // break the loop if 5 seconds passed
            if (performance.now() - startTime > 5000) {
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


async function getVideoTitle(): Promise<string> {
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

async function getTranscriptText(videoId: string): Promise<string | null> {
    const langOptionsWithLink = await getLangOptionsWithLink(videoId);
    if (!langOptionsWithLink) {
        return null;
    }
    return await getRawTranscriptText(langOptionsWithLink[0].link);
}

function getApiKey(callback: (key: string | null) => void): void {
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

function diyPrompt(customPrompt: string, videoTitle: string, textTranscript: string, language: string): string {
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
        promptText = summarySettings[diyPromptKey as keyof SummarySettings] as string || defaultPromptText;
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
    playPauseFlag = summarySettings.autoTtsSpeak;
}
export async function getPlayPauseFlag(): Promise<boolean> {
    return playPauseFlag;
}

export async function subtitleSummaryHandle(videoId: string): Promise<void> {
    generateSummary(videoId);
}


export async function generateSummary(videoId: string): Promise<void> {
    const prompt = await generatePrompt(videoId);
    if (prompt == "") {
        return;
    }

    // Get summarySettings using settingsManager
    const summarySettings = await settingsManager.getSummarySettings();

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    // let response_text = await geminiAPI.generate(prompt);                    
                    // response_text = response_text.replace(/<[^>]*>/g, '');// Remove XML tags from the response_text
                    // parseText = parse(response_text).toString();
                    // contentElement.innerHTML = parseText;


                    // streamGenerate
                    let response_text = "";
                    geminiAPI.streamGenerate(prompt, (text) => {
                        //append text to response_text
                        response_text += text;
                        response_text = response_text.replace(/<[^>]*>/g, '');// Remove XML tags from the response_text
                        parseText = parse(response_text).toString();
                        contentElement.innerHTML = parseText;
                        if (summarySettings.autoTtsSpeak) {
                            // remove # , * and xml tags    
                            const textStream = text.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
                            TTSSpeak.getInstance().speakAndPlayVideo(textStream, true);
                        }
                    });
                    TTSSpeak.getInstance().speakAndPlayVideo('\n', true);//speak a new line to make sure last line is spoken
                } catch (error) {
                    parseText = `Error generating text: ${error}`;
                    contentElement.innerHTML = parseText;
                }
            } else {
                parseText = "Please set API key in the extension settings";
                contentElement.innerHTML = parseText;
            }
        }
    });
}

// Add this message listener at the end of the file
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playVideo') {
        playVideo();
    }
});
