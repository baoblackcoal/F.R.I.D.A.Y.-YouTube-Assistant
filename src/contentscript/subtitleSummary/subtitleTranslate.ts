import { getLangOptionsWithLink, getRawTranscriptText } from "../transcript";
import { geminiAPI } from '../geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from '../ttsSpeak';
import { SummarySettings, defaultSummarySettings, Language } from '../../settings';
import { defaultTranslatePrompt } from "../../defaultTranslatePrompt";
import { settingsManager } from '../../settingsManager';
import { handleSubtitleSummaryView } from "./subtitleSummaryView";
import { logTime, waitForElm } from "../utils";
import { getVideoTitle, getTranscriptText, diyPrompt, getApiKey, updateSummaryStatus } from "./subtitleSummary";
import { error } from "console";

async function generatePrompt(videoId: string): Promise<string> {
    const textTranscript = await getTranscriptText(videoId);
    if (textTranscript == null) {
        return "";
    }

    const videoTitle = await getVideoTitle();

    const summarySettings = await settingsManager.getSummarySettings();

    let promptText = defaultTranslatePrompt;


    const prompt = diyPrompt(promptText, videoTitle, textTranscript, summarySettings.language);

    return prompt;
}

export async function subtitleTranslate(videoId: string): Promise<void> {
    const summarySettings = await settingsManager.getSummarySettings();

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {            
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    // append h3 to contentElement for display title
                    const newElement = document.createElement('div');   
                    newElement.innerHTML = '<h3 style="margin-top: 20px;">Subtitle</h3>';
                    contentElement.appendChild(newElement);
                    // save contentElement.innerHTML to oldHtml
                    const oldHtml = contentElement.innerHTML;
                    
                    enum ErrorType {
                        NotError = "NotError",
                        FormatError = "FormatError",
                        OutputTextSizeTooLarge = "OutputTextSizeTooLarge",
                    }

                    async function getTranslateAndSpeakText(prompt: string, isFirstConversation: boolean): Promise<[boolean, boolean, ErrorType]> {
                        const text = await geminiAPI.chat(prompt, isFirstConversation);
                       
                        //get translate text in <content_is_easy_to_read> and {{/content_is_easy_to_read}}
                        const translateTextArray = text.match(/<content_is_easy_to_read>([\s\S]*?)<\/content_is_easy_to_read>/g);
                        console.log("translateTextArray=", translateTextArray);
                        if (translateTextArray == null) {
                            console.log("translateTextArray is null, text=", text);
                        }
                        
                        //get task status in <task_status> and {{/task_status}}
                        const taskStatusArray = text.match(/<task_status>([\s\S]*?)<\/task_status>/g);
                        let lastTaskStatusText = taskStatusArray ? taskStatusArray[taskStatusArray.length - 1] : '';
                        //get content in lastTaskStatusText that between <task_status> and {{/task_status}}
                        const lastTaskStatusTextArray = lastTaskStatusText.match(/<task_status>([\s\S]*?)<\/task_status>/);
                        lastTaskStatusText = lastTaskStatusTextArray ? lastTaskStatusTextArray[1] : '';
                        lastTaskStatusText = lastTaskStatusText.replace(/<task_status>/g, '').replace(/<\/task_status>/g, '');
                        //delete /n in lastTaskStatusText
                        lastTaskStatusText = lastTaskStatusText.replace(/\n/g, '');
                        let finish = lastTaskStatusText == 'task_is_finish';
                        let isError = false;
                        console.log(lastTaskStatusText);

                        let translateText = '';
                        let isOuptutTextSizeTooLarge = false;
                        let errorType = ErrorType.NotError;
                        if (translateTextArray) {
                            // using for loop to get translateText, bacause gemini sometimes return multiple translateText in one response
                            for (const item of translateTextArray) {
                                //get content in item that between <content_is_easy_to_read> and {{/content_is_easy_to_read}}
                                const itemArray = item.match(/<content_is_easy_to_read>([\s\S]*?)<\/content_is_easy_to_read>/);
                                translateText = itemArray ? itemArray[1] : '';

                                // check if output text size is too large
                                // if (await geminiAPI.countTokens(translateText) > 2048) {
                                //     isOuptutTextSizeTooLarge = true;
                                //     return [finish=false, isError=true, errorType=ErrorType.OutputTextSizeTooLarge];
                                // }

                                // add \n after get . or 。 
                                translateText = translateText.replace(/\。/g, '。\n');
                                translateText = translateText.replace(/\./g, '.\n');    
                                
                                console.log(translateText);
                                if (contentElement && translateText !== 'task_is_finish' && translateText !== '') {
                                    // display html when get new line
                                    const lines = translateText.split('\n');    
                                    let html = '';
                                    for (const line of lines) {
                                        html += `<p>${line}</p>`;
                                    }
                                    // append html to contentElement
                                    const newElement = document.createElement('div');   
                                    newElement.innerHTML = html;
                                    contentElement.appendChild(newElement);
                                    //set margin bottom for each paragraph
                                    const paragraphs = document.querySelectorAll('.ytbs_content p');                            
                                    paragraphs.forEach(paragraph => {
                                        if (paragraph instanceof HTMLElement) {
                                            paragraph.style.marginBottom = '20px';
                                        } else {
                                            console.error('Element is not an HTMLElement:', paragraph);
                                        }
                                    });
                                } else {
                                    console.error('contentElement is null');
                                }
                            }
                        }

                        // if translateText is empty or lastTaskStatusText is empty, indecate end or error. translateText not include '\n'
                        // the times of '\n' in translateText  must be larger than 5
                        const countOfNewLine = (translateText.match(/\n/g) || []).length;
                        const isNewLineMarkCountEnough = countOfNewLine > 1;
                        const formatError = translateText == '' || lastTaskStatusText == '';
                        if (formatError || !isNewLineMarkCountEnough) {
                            console.log("these are empty translateText or lastTaskStatusText");
                            console.log("translateText=", translateText);
                            console.log("lastTaskStatusText=", lastTaskStatusText);
                            if (contentElement) {
                                // append text to contentElement
                                const newElement = document.createElement('div');   
                                if (!isNewLineMarkCountEnough) {
                                    newElement.innerHTML = 'Error: output text not include new line, try again.';
                                } else {
                                    newElement.innerHTML = text;
                                }
                                contentElement.appendChild(newElement);
                                isError = true;
                                finish = false;
                                errorType = ErrorType.FormatError;
                            }   
                        }

                        if (!isError && summarySettings.autoTtsSpeak) { 
                            TTSSpeak.getInstance().speakAndPlayVideo(translateText, true);
                        }
                        return [finish, isError, errorType];
                    }

                    let isFinish = false;
                    let isFirstConversation = true;
                    const translatePrompt = await generatePrompt(videoId);
                    while (true) {
                        const prompt = isFirstConversation ? translatePrompt : 'continue';
                        const [finish, isError, errorType] = await getTranslateAndSpeakText(prompt, isFirstConversation);
                        isFirstConversation = false;
                        console.log("finish=", finish, "isError=", isError, "errorType=", errorType);
                        if (finish) {                            
                            isFinish = true;
                            //speak a new line to make sure last line is spoken
                            TTSSpeak.getInstance().speakAndPlayVideo('\n', true);
                            updateSummaryStatus("Translate Subtitle Finish.");                            
                            break;
                        } else {
                            //sleep 5 seconds
                            updateSummaryStatus("Translate subtitle...");
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                        if (isError) {
                            updateSummaryStatus("Translate Subtitle " + errorType + " error, Try again.");
                            contentElement.innerHTML = oldHtml;
                            isFirstConversation = true;
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    }

                    if (isFinish && summarySettings.autoTtsSpeak) { 
                        TTSSpeak.getInstance().speakAndPlayVideo('\n', true);//speak a new line to make sure last line is spoken
                    }
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

