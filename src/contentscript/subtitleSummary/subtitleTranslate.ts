import { getLangOptionsWithLink, getRawTranscriptText } from "../transcript";
import { geminiAPI } from '../geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from '../ttsSpeak';
import { SummarySettings, defaultSummarySettings, Language } from '../../settings';
import { defaultTranslatePrompt } from "../../defaultTranslatePrompt";
import { settingsManager } from '../../settingsManager';
import { handleSubtitleSummaryView } from "./subtitleSummaryView";
import { logTime, waitForElm } from "../utils";
import { getVideoTitle, getTranscriptText, diyPrompt, getApiKey } from "./subtitleSummary";

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
    let prompt = await generatePrompt(videoId);
    const summarySettings = await settingsManager.getSummarySettings();

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {            
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    contentElement.innerHTML = '';
                    let isFirstConversation = true;
                    
                    async function getTranslateAndSpeakText(): Promise<boolean> {
                        const text = await geminiAPI.chat(prompt, isFirstConversation);
                        if (isFirstConversation) {
                            prompt = "continue";
                            isFirstConversation = false;
                        } 
                        //get translate text in {{content_is_easy_to_read}} and {{/content_is_easy_to_read}}
                        const translateTextArray = text.match(/{{content_is_easy_to_read}}([\s\S]*?){{\/content_is_easy_to_read}}/g);
                        console.log("translateTextArray=", translateTextArray);
                        
                        //get task status in {{task_status}} and {{/task_status}}
                        const taskStatusArray = text.match(/{{task_status}}([\s\S]*?){{\/task_status}}/g);
                        let lastTaskStatusText = taskStatusArray ? taskStatusArray[taskStatusArray.length - 1] : '';
                        //get content in lastTaskStatusText that between {{task_status}} and {{/task_status}}
                        const lastTaskStatusTextArray = lastTaskStatusText.match(/{{task_status}}([\s\S]*?){{\/task_status}}/);
                        lastTaskStatusText = lastTaskStatusTextArray ? lastTaskStatusTextArray[1] : '';
                        lastTaskStatusText = lastTaskStatusText.replace(/{{task_status}}/g, '').replace(/{{\/task_status}}/g, '');
                        //delete /n in lastTaskStatusText
                        lastTaskStatusText = lastTaskStatusText.replace(/\n/g, '');
                        let finish = lastTaskStatusText == 'task_is_finish';
                        console.log(lastTaskStatusText);
                        
                        let translateText = '';
                        if (translateTextArray) {
                            // using for loop to get translateText, bacause gemini sometimes return multiple translateText in one response
                            for (const item of translateTextArray) {
                                //get content in item that between {{content_is_easy_to_read}} and {{/content_is_easy_to_read}}
                                const itemArray = item.match(/{{content_is_easy_to_read}}([\s\S]*?){{\/content_is_easy_to_read}}/);
                                translateText = itemArray ? itemArray[1] : '';
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

                        if (translateText == '' || lastTaskStatusText == '') {
                            console.log("these are empty translateText or lastTaskStatusText");
                            console.log("translateText=", translateText);
                            console.log("lastTaskStatusText=", lastTaskStatusText);
                            if (contentElement) {
                                // append text to contentElement
                                const newElement = document.createElement('div');   
                                newElement.innerHTML = text;
                                contentElement.appendChild(newElement);
                                finish = true;//set finish to break while loop
                            }   
                        }

                        TTSSpeak.getInstance().speakAndPlayVideo(translateText, true);
                        return finish;
                    }

                    while (true) {
                        const finish = await getTranslateAndSpeakText();
                        console.log(finish);
                        //sleep 5 seconds
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        if (finish) {
                            break;
                        }
                    }

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

