import { geminiAPI } from '../../common/geminiApi';
import { TTSSpeak } from '../../common/ttsSpeak';
import { TranslatePrompt} from "../../prompts/defaultTranslatePrompt";
import { defaultPodcastPrompt, translatePodcastPrompt } from "../../prompts/podcastPrompt";
import { settingsManager } from '../../common/settingsManager';
import { getVideoTitle, getTranscriptText, diyPrompt, getGeminiApiKey, updateSummaryStatus, getTtsSpeakIndex } from "./subtitleSummary";
import { resetHighlightText } from './view/subtitleSummaryView';
import { parser } from 'marked';
import { SubtitleType } from '../../common/ISettings';
import { FridayStatus } from '../../common/common';
import { PlayPauseButtonHandler } from './view/buttonHandlers';

export interface ISubtitleTranslate {
    generatePrompt(videoId: string, generateSubtitleType: SubtitleType): Promise<string>;
    translateSubtitles(videoId: string): Promise<void>;
    addSummaryParagraphsClickHandlers(): void;
}

export class SubtitleTranslate implements ISubtitleTranslate {
    private tts: TTSSpeak;

    constructor() {
        this.tts = TTSSpeak.getInstance();
    }

    //singleton
    private static instance: SubtitleTranslate;
    public static getInstance(): SubtitleTranslate {
        if (!SubtitleTranslate.instance) {
            SubtitleTranslate.instance = new SubtitleTranslate();
        }
        return SubtitleTranslate.instance;
    }

    async generatePrompt(videoId: string, generateSubtitleType: SubtitleType): Promise<string> {
        const textTranscript = await getTranscriptText(videoId);
        if (textTranscript == null) {
            return "";
        }

        const videoTitle = await getVideoTitle();
        const summarySettings = await settingsManager.getSummarySettings();
        const promptText = generateSubtitleType === SubtitleType.Translation ? TranslatePrompt : defaultPodcastPrompt;

        return diyPrompt(promptText, videoTitle, textTranscript, summarySettings.language);
    }

    addSummaryParagraphsClickHandlers(): void {
        const contentElement = document.querySelector("#fri-summary-content");
        if (contentElement) {
            this.addParagraphsClickHandlers(contentElement);
        }
    }

    async translateSubtitles(videoId: string): Promise<void> {
        const summarySettings = await settingsManager.getSummarySettings();


        getGeminiApiKey(async (geminiApiKey) => {
            if (!geminiApiKey) {
                this.displayError("Please set API key in the extension settings");
                return;
            }
            
            const settings = await settingsManager.getSummarySettings();
            if (settings.generateSubtitleType === SubtitleType.Translation) {
                updateSummaryStatus("Translating subtitle...", FridayStatus.TranslatingSubtitle);  
            } else {
                updateSummaryStatus("Generating podcast...", FridayStatus.GeneratingPodcast);  
            }

            geminiAPI.setKey(geminiApiKey);
            const contentElement = document.querySelector("#fri-summary-content");
            if (!contentElement) {
                this.displayError("Content element not found");
                return;
            }

            try {
                const newElement = document.createElement('h3');
                const speakIndex = getTtsSpeakIndex();
                newElement.style.marginTop = '20px';
                newElement.setAttribute('speak-index', speakIndex.toString());
                newElement.textContent = "Subtitle";
                contentElement.appendChild(newElement);
                this.addParagraphClickHandlers(newElement);
                if (summarySettings.autoTtsSpeak) {
                    this.tts.speakAndPlayVideo('Subtitle\n', speakIndex);
                    this.tts.markIndexForDelete(speakIndex);
                }

                const oldHtml = this.cloneAndResetContent(contentElement);
                const generateSubtitleType = summarySettings.generateSubtitleType;
                const translatePrompt = await this.generatePrompt(videoId, generateSubtitleType);
                await this.processTranslation(contentElement, translatePrompt, oldHtml, summarySettings);
            } catch (error) {
                this.displayError(`Error generating text: ${error}`);
            }
        });
    }

    private cloneAndResetContent(contentElement: Element): string {
        const tempElement = contentElement.cloneNode(true) as HTMLElement;
        return tempElement.innerHTML;
    }

    private async processTranslation(contentElement: Element, translatePrompt: string, oldHtml: string, summarySettings: any): Promise<void> {
        let isFirstConversation = true;
        while (true) {
            const prompt = isFirstConversation ? translatePrompt : 'continue';
            const [finish, isError, errorType] = await this.getTranslateAndSpeakText(prompt, isFirstConversation, contentElement, summarySettings);
            console.log("finish=", finish, " isError=", isError, " errorType=", errorType);
            isFirstConversation = false;//set to false for next translate

            if (isError) {
                updateSummaryStatus(`Translate Subtitle Error: ${errorTypeMessage[errorType]}, Try again.`, FridayStatus.TranslatingSubtitle);
                contentElement.innerHTML = oldHtml;
                this.tts.deleteQueueLargerThanMarkIndex();
                this.addSummaryParagraphsClickHandlers();
                isFirstConversation = true;
                await this.sleep(2000);
                continue;
            } else {
                if (summarySettings.generateSubtitleType === SubtitleType.Translation) {
                    updateSummaryStatus("Translate subtitle...", FridayStatus.TranslatingSubtitle);
                } else {
                    updateSummaryStatus("Generate podcast...", FridayStatus.GeneratingPodcast);
                }
            }

            if (finish) {
                this.tts.speakAndPlayVideoFinsh(getTtsSpeakIndex());
                updateSummaryStatus("Translate Subtitle Finish.", FridayStatus.Finished);
                break;
            }

            await this.sleep(2000);
        }
    }

    private async getTranslateAndSpeakText(prompt: string, isFirstConversation: boolean, contentElement: Element, summarySettings: any): Promise<[boolean, boolean, ErrorType]> {
        const generateSubtitleType = summarySettings.generateSubtitleType;
        const text = await geminiAPI.chat(prompt, isFirstConversation);
        // const translateTextArray = text.match(/<content_is_easy_to_read>([\s\S]*?)<\/content_is_easy_to_read>/g);
        let translateTextArray: RegExpMatchArray | null = null;
        // const xmlText = generateSubtitleType === SubtitleType.Podcast ? "content_to_podcast" : "task_start";
        // translateTextArray = text.match(`/<${xmlText}>([\s\S]*?)<\/${xmlText}>/g`);
        //get string from text 
        const notFinishText = text.match(new RegExp(`task_start\n(.*)`,'s'));
        if (notFinishText) {
            // remove 'task_start' , 'task_is_finish' and 'task_is_not_finish' from notFinishText
            translateTextArray = [notFinishText[1].replace(/task_start|task_is_finish|task_is_not_finish/g, '')];
        }
        
        // if (translateTextArray == null) {
        //     // Fix regex syntax - remove backticks and forward slashes
        //     const notFinishText = text.match(new RegExp(`<${xmlText}>\n(.*)`,'s'));
        //     if (notFinishText) {
        //         translateTextArray = [notFinishText[1]];
        //     }
        // }

        // text include task_is_finish string
        const taskIsFinishText = text.match(/task_is_finish/g);
        let lastTaskStatusText = taskIsFinishText ? 'task_is_finish' : 'task_is_not_finish';

        // if (taskIsFinishText) {
        //     lastTaskStatusText = 'task_is_finish';
        //     translateTextArray = [taskIsFinishText[1]];
        // } else {
        //     lastTaskStatusText = 'task_is_not_finish';
        //     translateTextArray = ["task_is_not_finish"];

        // }
        
        

        // const taskStatusArray = text.match(/<task_finish_status>([\s\S]*?)<\/task_finish_status>/g);
        // let lastTaskStatusText = this.extractLastTaskStatus(taskStatusArray);
        // if (lastTaskStatusText.length == 0) {
        //     lastTaskStatusText = 'task_is_not_finish';
        // }

        const finish = lastTaskStatusText === 'task_is_finish';
        let [isError, errorType, translateText] = await this.checkForErrors(generateSubtitleType, isFirstConversation, finish, translateTextArray, lastTaskStatusText, contentElement);
        
        if (!isError) {
            isError = !await this.displayTranslatedText(generateSubtitleType, translateText, contentElement);
            if (isError) {
                errorType = ErrorType.TranslateError;
            }
        }

        if (!isError) {
            const parser = new DOMParser();
            const tempElement = document.querySelector("#fri-summary-content") as HTMLElement;
                const childNodes = tempElement.children;
                for (let i = 0; i < childNodes.length; i++) {
                    const node = childNodes[i];
                    if (node instanceof HTMLElement) {
                        const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                        if (speakIndex == -1) {
                            const speakIndex = getTtsSpeakIndex();
                            node.setAttribute('speak-index', speakIndex.toString());

                            if (summarySettings.autoTtsSpeak || PlayPauseButtonHandler.getInstance().getSpeaking()) { 
                                const textStream = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                                this.tts.speakAndPlayVideo(textStream, speakIndex);
                            }
                        }
                    }
                }
        }

        return [finish, isError, errorType];
    }

    private extractLastTaskStatus(taskStatusArray: RegExpMatchArray | null): string {
        const lastTaskStatusText = taskStatusArray ? taskStatusArray[taskStatusArray.length - 1] : '';
        return lastTaskStatusText.replace(/<task_finish_status>/g, '').replace(/<\/task_finish_status>/g, '').replace(/\n/g, '');
    }

    private async checkForErrors(generateSubtitleType: SubtitleType, isFirstConversation: boolean, finish: boolean, translateTextArray: RegExpMatchArray | null, lastTaskStatusText: string, contentElement: Element): Promise<[boolean, ErrorType, string]> {
        let errorType: ErrorType = ErrorType.NotError;
        let isError = false;
        
        if (isFirstConversation && !translateTextArray) {
            isError = true;
            errorType = ErrorType.OutputSizeEqual0;
        }

        if (!isError && (!translateTextArray || !lastTaskStatusText || !(lastTaskStatusText === 'task_is_finish' || lastTaskStatusText === 'task_is_not_finish'))) {
            isError = true;
            errorType = ErrorType.FormatError;
        }

        let translateText = ''
        if (!isError) {
            translateText = translateTextArray ? translateTextArray[0] : '';

            // translateText = translateTextArray!!.map(item => item.replace(/<content_is_easy_to_read>/g, '').replace(/<\/content_is_easy_to_read>/g, '')).join('');
            
            // translateText = translateTextArray!!.map(item => item.replace(/<content_is_easy_to_read>/g, '').replace(/<\/content_is_easy_to_read>/g, '')).join('\n');

            // // add \n after ". " or "。" for break line to read easily
            // if (generateSubtitleType === SubtitleType.EasyToRead) {
            //     translateText = translateText.replace(/\. /g, '.\n').replace(/\。/g, '。\n');
            //     if (translateText.split('\n').length <= 1) {
            //         isError = true;
            //         errorType = ErrorType.OutputSizeNotEnouthNewLine;
            //     }
            // }

            // const translateTextLength = translateText.length;
            // if (!isError && (isFirstConversation && !finish && (translateTextLength < 400 || translateTextLength > 15000))) {
            //     console.log("translateTextLength=", translateTextLength);
            //     isError = true;
            //     errorType = ErrorType.FirstConversationOutputSizeError;
            // }
        }      

        return [isError, errorType, translateText];
    }

    private async displayTranslatedText(generateSubtitleType: SubtitleType, translateText: string, contentElement: Element): Promise<boolean> {
        // const summarySettings = await settingsManager.getSummarySettings();
        // const replacements: Record<string, string> = {
        //     '{language}': summarySettings.language,
        //     '{textTranscript}': translateText
        // };
        // const translatePrompt = generateSubtitleType === SubtitleType.Podcast ? translatePodcastPrompt : translateEasyToReadPrompt;
        // const prompt = translatePrompt.replace(/{language}|{textTranscript}/g, match => replacements[match] || match);
        // const result = await geminiAPI.generate(prompt);
        // const translatedTextArray = result.match(/<translated_content>([\s\S]*?)<\/translated_content>/g);
        // if (translatedTextArray?.length != 1) {
        //     return false;
        // } else 
        {    
            // //get the first translated_content from translatedTextArray
            // let translatedText = translateText;
            // if (generateSubtitleType === SubtitleType.EasyToRead) {
            //     // translatedText = translatedText.replace(/\. /g, '.\n').replace(/\。/g, '。\n');
            //     //delete '\n' if paragraph length is less than 50 
            //     let deleteCount = 0;
            //     for (let i = 0; i < translatedText.length; i++) {
            //         deleteCount++;
            //         if (translatedText.charAt(i) === '\n') {
            //             if (deleteCount < 50) { 
            //                 translatedText = translatedText.substring(0, i) + ' ' + translatedText.substring(i + 1);
            //             } else {
            //                 deleteCount = 0;
            //             }
            //         }
            //     }
            // }           

            // translatedText.split('\n').forEach(line => {
            //     const newElement = document.createElement('p');
            //     newElement.innerHTML = line;
            //     newElement.style.marginBottom = '15px';
            //     contentElement.appendChild(newElement);
            //     this.addParagraphClickHandlers(newElement);
            // });

            

            translateText.split('\n').forEach(line => {
                const newElement = document.createElement('p');
                newElement.innerHTML = line;
                newElement.style.marginBottom = '15px';
                contentElement.appendChild(newElement);
                this.addParagraphClickHandlers(newElement);
            });

            return true;
        }
    }

    // private async displayTranslatedText(generateSubtitleType: SubtitleType, translateText: string, contentElement: Element): Promise<boolean> {
    //     const summarySettings = await settingsManager.getSummarySettings();
    //     const replacements: Record<string, string> = {
    //         '{language}': summarySettings.language,
    //         '{textTranscript}': translateText
    //     };
    //     const translatePrompt = generateSubtitleType === SubtitleType.Podcast ? translatePodcastPrompt : translateEasyToReadPrompt;
    //     const prompt = translatePrompt.replace(/{language}|{textTranscript}/g, match => replacements[match] || match);
    //     const result = await geminiAPI.generate(prompt);
    //     const translatedTextArray = result.match(/<translated_content>([\s\S]*?)<\/translated_content>/g);
    //     if (translatedTextArray?.length != 1) {
    //         return false;
    //     } else {    
    //         //get the first translated_content from translatedTextArray
    //         let translatedText = translatedTextArray ? translatedTextArray[0].replace(/<translated_content>/g, '').replace(/<\/translated_content>/g, '') : '';
    //         if (generateSubtitleType === SubtitleType.EasyToRead) {
    //             translatedText = translatedText.replace(/\. /g, '.\n').replace(/\。/g, '。\n');
    //             //delete '\n' if paragraph length is less than 50 
    //             let deleteCount = 0;
    //             for (let i = 0; i < translatedText.length; i++) {
    //                 deleteCount++;
    //                 if (translatedText.charAt(i) === '\n') {
    //                     if (deleteCount < 50) { 
    //                         translatedText = translatedText.substring(0, i) + ' ' + translatedText.substring(i + 1);
    //                     } else {
    //                         deleteCount = 0;
    //                     }
    //                 }
    //             }
    //         }           

    //         translatedText.split('\n').forEach(line => {
    //             const newElement = document.createElement('p');
    //             newElement.innerHTML = line;
    //             newElement.style.marginBottom = '15px';
    //             contentElement.appendChild(newElement);
    //             this.addParagraphClickHandlers(newElement);
    //         });

    //         return true;
    //     }
    // }

    private displayError(message: string, contentElement?: Element): void {
        if (contentElement) {
            const newElement = document.createElement('div');
            newElement.innerHTML = message;
            contentElement.appendChild(newElement);
        } else {
            console.log(message);
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private addParagraphClickHandlers(paragraph: Element): void {
        // paragraph.removeEventListener('click', this.handleParagraphClick.bind(this, paragraph));
        paragraph.addEventListener('click', this.handleParagraphClick.bind(this, paragraph));
    }

    private addParagraphsClickHandlers(paragraphsElement: Element): void {
        const paragraphs = paragraphsElement.querySelectorAll('p, h3');
        paragraphs.forEach((paragraph) => {           
            // paragraph.removeEventListener('click', this.handleParagraphClick.bind(this, paragraph));
            paragraph.addEventListener('click', this.handleParagraphClick.bind(this, paragraph));
        });
    }

    private async handleParagraphClick(paragraph: Element): Promise<void> {
        const paragraphStart = paragraph;
        const speakIndexParagraphStart = Number(paragraphStart.getAttribute('speak-index') ?? -1);
        const tts = this.tts;

        resetHighlightText();
        await tts.stop();
        await tts.resetStreamSpeak();
        // automatically speak from current paragraph to the end of the "#fri-summary-content" element.
        const contentElement = document.querySelector("#fri-summary-content");
        if (contentElement) {
            //query all paragraphs or h3 in the content element
            const paragraphs = contentElement.querySelectorAll('p, h3');
            let isStart = false;
            const parser = new DOMParser();
            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i] as HTMLElement;
                let speakIndex = Number(paragraph.getAttribute('speak-index')!);
                // skip the before paragraph
                if (speakIndex === speakIndexParagraphStart) {
                    isStart = true;
                }
                if (!isStart) {
                    continue;
                }
                const text = parser.parseFromString(paragraph.innerHTML, 'text/html').documentElement.textContent ?? '';
                await tts.speak(text, speakIndex);
            }
            tts.speakFinsh(getTtsSpeakIndex());
        }
    }
}

enum ErrorType {
    NotError = "NotError",
    FormatError = "FormatError",
    OutputSizeNotEnouthNewLine = "OutputSizeNotEnouthNewLine",
    OutputSizeEqual0 = "OutputSizeEqual0",
    FirstConversationLanguageError = "FirstConversationLanguageError",
    FirstConversationOutputSizeError = "FirstConversationOutputSizeError",
    TranslateError = "TranslateError",
}
const errorTypeMessage = {
    [ErrorType.NotError]: "not error",
    [ErrorType.FormatError]: "output format error",
    [ErrorType.OutputSizeNotEnouthNewLine]: "output text not include enough new line",
    [ErrorType.OutputSizeEqual0]: "output text size error, size is 0",
    [ErrorType.FirstConversationLanguageError]: "first conversation language error",
    [ErrorType.FirstConversationOutputSizeError]: "first conversation output size is too long or too short",
    [ErrorType.TranslateError]: "translate error",
}

// export const subtitleTranslate = async (videoId: string): Promise<void> => {
//     const translator = SubtitleTranslate.getInstance();
//     await translator.translateSubtitles(videoId);
// };