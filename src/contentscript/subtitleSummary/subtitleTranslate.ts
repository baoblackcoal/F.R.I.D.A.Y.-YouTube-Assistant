import { geminiAPI } from '../geminiApi';
import { TTSSpeak } from '../ttsSpeak';
import { defaultTranslatePrompt } from "../../prompts/defaultTranslatePrompt";
import { settingsManager } from '../../settingsManager';
import { getVideoTitle, getTranscriptText, diyPrompt, getApiKey, updateSummaryStatus } from "./subtitleSummary";

interface ISubtitleTranslator {
    generatePrompt(videoId: string): Promise<string>;
    translateSubtitles(videoId: string): Promise<void>;
}

class SubtitleTranslator implements ISubtitleTranslator {
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

    async translateSubtitles(videoId: string): Promise<void> {
        const summarySettings = await settingsManager.getSummarySettings();

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
                this.appendTitle(contentElement, "Subtitle");
                if (summarySettings.autoTtsSpeak) {
                    TTSSpeak.getInstance().speakAndPlayVideo('Subtitle\n');
                }

                const oldHtml = this.cloneAndResetContent(contentElement);
                const translatePrompt = await this.generatePrompt(videoId);
                await this.processTranslation(contentElement, translatePrompt, oldHtml, summarySettings);
            } catch (error) {
                this.displayError(`Error generating text: ${error}`);
            }
        });
    }

    private appendTitle(contentElement: Element, title: string): void {
        const newElement = document.createElement('div');
        newElement.innerHTML = `<h3 style="margin-top: 20px;">\n${title}</h3>`;
        contentElement.appendChild(newElement);
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
                isFirstConversation = true;
                await this.sleep(2000);
                continue;
            }

            if (finish) {
                TTSSpeak.getInstance().speakAndPlayVideo('\n');
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

        if (!isError && summarySettings.autoTtsSpeak) {
            const textStream = new DOMParser().parseFromString(translateTextArray?.join('\n') ?? '', 'text/html').documentElement.textContent ?? '';
            TTSSpeak.getInstance().speakAndPlayVideo(textStream);
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