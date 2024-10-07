import { geminiAPI } from '../geminiApi';
import { TTSSpeak } from '../ttsSpeak';
import { defaultTranslatePrompt } from "../../prompts/defaultTranslatePrompt";
import { settingsManager } from '../../settingsManager';
import { getVideoTitle, getTranscriptText, diyPrompt, getApiKey, updateSummaryStatus, getTtsSpeakIndex } from "./subtitleSummary";
import { resetHighlightText } from './subtitleSummaryView';
import { parser } from 'marked';

interface ISubtitleTranslator {
    generatePrompt(videoId: string): Promise<string>;
    translateSubtitles(videoId: string): Promise<void>;
}

class SubtitleTranslator implements ISubtitleTranslator {
    private tts: TTSSpeak;

    constructor() {
        this.tts = TTSSpeak.getInstance();
    }

    async generatePrompt(videoId: string): Promise<string> {
        const textTranscript = await getTranscriptText(videoId);
        if (textTranscript == null) {
            return "";
        }

        const videoTitle = await getVideoTitle();
        const summarySettings = await settingsManager.getSummarySettings();
        const promptText = defaultTranslatePrompt;

        return diyPrompt(promptText, videoTitle, textTranscript, summarySettings.language);
    }

    addSummaryParagraphsClickHandlers(): void {
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {
            this.addParagraphsClickHandlers(contentElement);
        }
    }

    async translateSubtitles(videoId: string): Promise<void> {
        const summarySettings = await settingsManager.getSummarySettings();

        this.addSummaryParagraphsClickHandlers();

        getApiKey(async (geminiApiKey) => {
            if (!geminiApiKey) {
                this.displayError("Please set API key in the extension settings");
                return;
            }

            geminiAPI.setKey(geminiApiKey);
            const contentElement = document.querySelector(".ytbs_content");
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
                const translatePrompt = await this.generatePrompt(videoId);
                await this.processTranslation(contentElement, translatePrompt, oldHtml, summarySettings);
            } catch (error) {
                this.displayError(`Error generating text: ${error}`);
            }
        });
    }

    private cloneAndResetContent(contentElement: Element): string {
        const tempElement = contentElement.cloneNode(true) as HTMLElement;
        tempElement.childNodes.forEach(node => {
            if (node instanceof HTMLElement && node.style.backgroundColor !== "white") {
                node.style.backgroundColor = "white";
            }
        });
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
                updateSummaryStatus(`Translate Subtitle ${errorType} error, Try again.`);
                contentElement.innerHTML = oldHtml;
                this.tts.deleteQueueLargerThanMarkIndex();
                this.addSummaryParagraphsClickHandlers();
                isFirstConversation = true;
                await this.sleep(2000);
                continue;
            }

            if (finish) {
                this.tts.speakAndPlayVideoFinsh(getTtsSpeakIndex());
                updateSummaryStatus("Translate Subtitle Finish.");
                break;
            }

            updateSummaryStatus("Translate subtitle...");
            await this.sleep(2000);
        }
    }

    private async getTranslateAndSpeakText(prompt: string, isFirstConversation: boolean, contentElement: Element, summarySettings: any): Promise<[boolean, boolean, ErrorType]> {
        const text = await geminiAPI.chat(prompt, isFirstConversation);
        const translateTextArray = text.match(/<content_is_easy_to_read>([\s\S]*?)<\/content_is_easy_to_read>/g);
        const taskStatusArray = text.match(/<task_status>([\s\S]*?)<\/task_status>/g);
        const lastTaskStatusText = this.extractLastTaskStatus(taskStatusArray);
        const finish = lastTaskStatusText === 'task_is_finish';
        const isError = this.checkForErrors(translateTextArray, lastTaskStatusText, contentElement);

        if (!isError) {
            const parser = new DOMParser();
            const tempElement = document.querySelector(".ytbs_content") as HTMLElement;
                const childNodes = tempElement.children;
                for (let i = 0; i < childNodes.length; i++) {
                    const node = childNodes[i];
                    if (node instanceof HTMLElement) {
                        const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                        if (speakIndex == -1) {
                            const speakIndex = getTtsSpeakIndex();
                            node.setAttribute('speak-index', speakIndex.toString());

                            if (summarySettings.autoTtsSpeak) { 
                                const textStream = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                                this.tts.speakAndPlayVideo(textStream, speakIndex);
                            }
                        }
                    }
                }
        }

        return [finish, isError, isError ? ErrorType.FormatError : ErrorType.NotError];
    }

    private extractLastTaskStatus(taskStatusArray: RegExpMatchArray | null): string {
        const lastTaskStatusText = taskStatusArray ? taskStatusArray[taskStatusArray.length - 1] : '';
        return lastTaskStatusText.replace(/<task_status>/g, '').replace(/<\/task_status>/g, '').replace(/\n/g, '');
    }

    private checkForErrors(translateTextArray: RegExpMatchArray | null, lastTaskStatusText: string, contentElement: Element): boolean {
        if (!translateTextArray || !lastTaskStatusText || !(lastTaskStatusText === 'task_is_finish' || lastTaskStatusText === 'task_is_not_finish')) {
            this.displayError("Error: output text not include new line, try again.", contentElement);
            return true;
        }

        let translateText = translateTextArray.map(item => item.replace(/<content_is_easy_to_read>/g, '').replace(/<\/content_is_easy_to_read>/g, '')).join('\n');
        // add \n after ". " or "。" for break line to read easily
        translateText = translateText.replace(/\. /g, '.\n').replace(/\。/g, '。\n');
        if (translateText.split('\n').length <= 1) {
            this.displayError("Error: output text not include new line, try again.", contentElement);
            return true;
        }

        this.displayTranslatedText(translateText, contentElement);
        return false;
    }

    private displayTranslatedText(translateText: string, contentElement: Element): void {
        translateText.split('\n').forEach(line => {
            const newElement = document.createElement('p');
            newElement.innerHTML = line;
            newElement.style.marginBottom = '15px';
            contentElement.appendChild(newElement);
            this.addParagraphClickHandlers(newElement);
        });
    }

    private displayError(message: string, contentElement?: Element): void {
        if (contentElement) {
            const newElement = document.createElement('div');
            newElement.innerHTML = message;
            contentElement.appendChild(newElement);
        } else {
            console.error(message);
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
        await tts.resetStreamSpeak();
        // automatically speak from current paragraph to the end of the ".ytbs_content" element.
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {
            //query all paragraphs or h3 in the content element
            const paragraphs = contentElement.querySelectorAll('p, h3');
            let isStart = false;
            const parser = new DOMParser();
            for (let i = 0; i < paragraphs.length; i++) {
                const paragraph = paragraphs[i] as HTMLElement;
                paragraph.style.backgroundColor = 'white';
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
        if (paragraphStart instanceof HTMLElement) {
            paragraphStart.style.backgroundColor = 'yellow';
        }
    }
}

enum ErrorType {
    NotError = "NotError",
    FormatError = "FormatError",
    OutputTextSizeTooLarge = "OutputTextSizeTooLarge",
}

export const subtitleTranslate = async (videoId: string): Promise<void> => {
    const translator = new SubtitleTranslator();
    await translator.translateSubtitles(videoId);
};