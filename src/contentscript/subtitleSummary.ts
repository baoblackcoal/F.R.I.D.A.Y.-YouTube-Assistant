import { getLangOptionsWithLink, getRawTranscriptText } from "./transcript";
import { geminiAPI } from './geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from './ttsSpeak';
import { SummarySettings, defaultSummarySettings, defaultPromptText, Language } from '../settings';
import { settingsManager } from '../settingsManager';

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

function playVideo() {
    const video = document.querySelector('video');
    if (video) {
        video.play();
    }
}

export async function generateSummary(videoId: string): Promise<void> {
    const prompt = await generatePrompt(videoId);
    if (prompt == "") {
        return;
    }

    // Get summarySettings using settingsManager
    const summarySettings = await settingsManager.getSummarySettings();

    // Pause the video if stopVideoFirst is true
    if (summarySettings.stopVideoFirst) {
        pauseVideo();
    }

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    let response_text = await geminiAPI.generate(prompt);                    
                    response_text = response_text.replace(/<[^>]*>/g, '');// Remove XML tags from the response_text
                    parseText = parse(response_text).toString();
                } catch (error) {
                    parseText = `Error generating text: ${error}`;
                }
            } else {
                parseText = "Please set API key in the extension settings";
            }
            contentElement.innerHTML = parseText;

            // Speak the summary and play the video after speaking if stopVideoFirst is true
            if (summarySettings.ttsSpeak) {
                const ttsSpeak = TTSSpeak.getInstance();
                if (summarySettings.stopVideoFirst) {
                    ttsSpeak.speakAndPlayVideo((contentElement as HTMLElement).innerText);
                } else {
                    ttsSpeak.speak((contentElement as HTMLElement).innerText);
                }
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
