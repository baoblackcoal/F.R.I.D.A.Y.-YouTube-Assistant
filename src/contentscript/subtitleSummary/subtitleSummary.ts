import { getLangOptionsWithLink, getRawTranscriptText } from "../transcript";
import { geminiAPI } from '../../common/geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from '../../common/ttsSpeak';
import { defaultSummarySettings } from '../../common/settings';
import { Language, ISummarySettings, SubtitleType } from '../../common/ISettings';
import { summaryDefaultPromptText } from "../../prompts/defaultPromptText";
import { settingsManager } from '../../common/settingsManager';
import { handleSubtitleSummaryView, SubtitleSummaryView } from "./view/subtitleSummaryView";
import { logTime, waitForElm } from "../utils";
import { MessageObserver } from "../../utils/messageObserver";
import { ITtsMessage } from "../../utils/messageQueue";
import { common, FridayStatus, fridayStatusLabels, GenerateStatus } from "../../common/common";
import { FriSummary } from "../friSummary/friSummary";
import { i18nService } from "../friSummary/i18nService";
import { PlayPauseButtonHandler } from "./view/buttonHandlers";
import { ISubtitleTranslate } from "./subtitleTranslate";
import { Toast } from "../../common/toast";
import { commentPromptText } from "../../prompts/commentPrompt";
import { summaryState } from "../friSummary/friSummaryState";

let pauseVideoFlag = false;

export async function waitForPlayer(): Promise<void> {
    // const summarySettings = await settingsManager.getSummarySettings();
    // let hasEnterWaitForPlayer = summarySettings.autoTtsSpeak && summarySettings.autoGenerate;
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
    // 检查是否为移动版YouTube
    const isMobileYouTube = window.location.hostname === 'm.youtube.com';
    
    if (isMobileYouTube) {
        // 移动版YouTube标题选择器
        const mobileTitleElement = document.querySelector('.slim-video-information-title');
        if (mobileTitleElement && mobileTitleElement.textContent) {
            return mobileTitleElement.textContent.trim();
        }
        
        // 备用选择器，防止DOM结构变化
        const mobileTitleFallback = document.querySelector('.slim-video-metadata-title');
        if (mobileTitleFallback && mobileTitleFallback.textContent) {
            return mobileTitleFallback.textContent.trim();
        }
    } else {
        // 桌面版YouTube标题获取逻辑
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
    }
    
    // 最终尝试：查找页面标题中的信息
    const pageTitle = document.title;
    if (pageTitle && pageTitle.includes(' - YouTube')) {
        return pageTitle.replace(' - YouTube', '');
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

export function getGeminiApiKey(callback: (key: string | null) => void): void {
    settingsManager.getSummarySettings().then(async (summarySettings) => {
        const apiKey = await common.getApiKey(summarySettings);
        if (apiKey) {
            callback(apiKey);
        } else {
            callback(null);
        }
        return;
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

    let promptText = summaryDefaultPromptText;
    // let promptText = commentPromptText;
    if (summarySettings.promptType > 0) {
        const diyPromptKey = `diyPromptText${summarySettings.promptType}`;
        promptText = summarySettings[diyPromptKey as keyof ISummarySettings] as string || summaryDefaultPromptText;
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
    playPauseFlag = summarySettings.autoTtsSpeak && summarySettings.autoGenerate;
}
export async function getPlayPauseFlag(): Promise<boolean> {
    return playPauseFlag;
}

export async function subtitleSummaryHandle(videoId: string, subtitleTranslate: ISubtitleTranslate): Promise<boolean> {
    return generateSummary(videoId, subtitleTranslate);
}

export function updateSummaryStatus(status: string, fridayStatus: FridayStatus): void {
    const summaryStatus = document.getElementById("ytbs_summary_status");
    if (summaryStatus) {
        summaryStatus.textContent = "Generating status: " + status;
    }

    const friSummary = FriSummary.getInstance();
    if (fridayStatus == FridayStatus.Init) {
        friSummary.setFriInfoText("...");
    } else {
        friSummary.setFriInfoText(i18nService.getMessage(fridayStatusLabels[fridayStatus]));
    }

    //finish event
    switch (fridayStatus) {
        case FridayStatus.Init:
            window.dispatchEvent(new CustomEvent('GenerateStatus', { detail: { GenerateStatus: GenerateStatus.Init } }));
            break;
        case FridayStatus.Finished:
            window.dispatchEvent(new CustomEvent('GenerateStatus', { detail: { GenerateStatus: GenerateStatus.Finished } }));
            // Handle auto-download
            (async () => {
                const state = summaryState;
                const autoDownload = await state.getAutoDownload();
                if (autoDownload) {
                    const [hasContent, text] = SubtitleSummaryView.getInstance().checkGenerateContent();
                    if (hasContent) {
                        await friSummary.downloadContent(text);
                    }
                }
            })();
            break;
        case FridayStatus.GeneratingSummary:
        case FridayStatus.TranslatingSubtitle:
        case FridayStatus.GeneratingPodcast:
            window.dispatchEvent(new CustomEvent('GenerateStatus', { detail: { GenerateStatus: GenerateStatus.Generating } }));
            break;
    }
}

let paragraphIndex = 0;
export function getTtsSpeakIndex(): number {
    return paragraphIndex++;
}

export function handleGenerateError(text: string): boolean {
    let getError = false;
    if (text.includes('Error:')) {
        Toast.show({
            type: 'error',
            message: i18nService.getMessage('summary-generate-error'),
            duration: 5000
        });
        getError = true;
        //open chrome option
        // window.open(chrome.runtime.getURL('options.html'), '_blank');
    }
    return getError;
}

export async function generateSummary(videoId: string, subtitleTranslate: ISubtitleTranslate): Promise<boolean> {
    const prompt = await generatePrompt(videoId);
    if (prompt == "") {
        Toast.show({
            type: 'error',
            message: i18nService.getMessage('summary-tip-no-youtube-transcript'),
            duration: 4000
        });
        window.dispatchEvent(new CustomEvent('GenerateStatus', { detail: { GenerateStatus: GenerateStatus.Init } }));
        return false;
    }

    FriSummary.getInstance().setGenerateContentExpand();

    // Get summarySettings using settingsManager
    const summarySettings = await settingsManager.getSummarySettings();

    getGeminiApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector("#fri-summary-content");
        let reavStreamText = "";
        if (contentElement) {
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    updateSummaryStatus("Generating summary...", FridayStatus.GeneratingSummary);
                    let response_text = "";
                    const parser = new DOMParser();
                    let replaceNewLineCount = 0;
                    let getError = false;
                    geminiAPI.streamGenerate(prompt, async (text) => {
                        // detect if text include 'Error:'
                        getError = handleGenerateError(text);
                        if (getError) {                            
                            return;
                        }

                        reavStreamText += text;

                        // reavStreamText = reavStreamText.replace(/\. /g, '. \n').replace(/。/g, '。\n');
                        if (reavStreamText.includes('\n')) {
                            reavStreamText = reavStreamText.replace(/<HTML_FORMAT>/g, '');            
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
                                    if (summarySettings.autoTtsSpeak || PlayPauseButtonHandler.getInstance().getSpeaking()) {
                                        const splitText = node.textContent ?? '';
                                        const textStream = parser.parseFromString(splitText, 'text/html').documentElement.textContent ?? '';
                                        TTSSpeak.getInstance().speakAndPlayVideo(textStream, speakIndex);
                                    }
                                }
                            }                              
                        }
                       
                    }).catch((error) => {
                        if (getError) {
                            Toast.show({
                                type: 'error',
                                message: "Error generating text: " + error,
                                duration: 10000
                            });
                        }
                    }).then(async () => {
                        if (!getError) {
                            subtitleTranslate.addSummaryParagraphsClickHandlers();

                            TTSSpeak.getInstance().speakAndPlayVideo(reavStreamText + '\n', -1); // speak a new line to make sure last line is spoken
                            const subtitleType = await settingsManager.getSummarySettings();
                            if (subtitleType.generateSubtitleType != SubtitleType.None) {
                                subtitleTranslate.translateSubtitles(videoId);
                            } else {
                                updateSummaryStatus("Generate Summary Finish.", FridayStatus.Finished);
                            }
                        }
                    });
                } catch (error) {                    
                    console.log('An error occurred:', error);
                    contentElement.innerHTML = `Error generating text: ${error}`;
                }
            } else {
                Toast.show({
                    type: 'error',
                    message: "Please set API key in the extension settings",
                    duration: 4000
                });
            }
        }
    });

    return true;
}

// Add this message listener at the end of the file
const messageObserver = MessageObserver.getInstance();
// messageObserver.addObserverTtsMessage({ action: 'playVideo' }, (message: ITtsMessage) => {
//     if (!pauseVideoFlag) {
//         playVideo();
//     }
// });

messageObserver.addObserverTtsMessage({ action: 'ttsCheckSpeaking' }, (message: any) => {
    const isSpeaking = message!.speaking;
    if (isSpeaking) {
        pauseVideo();
    } 
});
