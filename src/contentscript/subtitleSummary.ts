import { getLangOptionsWithLink, getRawTranscriptText } from "./transcript";
import { geminiAPI } from './geminiApi';
import { parse } from 'marked';
import { TTSSpeak } from './ttsSpeak';

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
                console.log('Gemini API Key:', geminiApiKey);
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

export async function generateSummary(videoId: string): Promise<void> {
    const textTranscript = await getTranscriptText(videoId);
    if (textTranscript == null) {
        return;
    }

    const videoTitle = await getVideoTitle();
    const prompt = `Summarize the following CONTENT(delimited by XML tags <CONTENT> and </CONTENT>) into brief sentences of key points, then provide complete highlighted information in a list, choosing an appropriate emoji for each highlight.
Your output should use the following format: 
### Title
${videoTitle}
### keyword
Include 3 to 5 keywords, those are incorporating trending and popular search terms.
### Summary
{brief summary of this content}
### Highlights
- [Emoji] Bullet point with complete explanation

<CONTENT>
${textTranscript}
</CONTENT>
`;

    getApiKey(async (geminiApiKey) => {
        let parseText = "";
        let text = "";
        const contentElement = document.querySelector(".ytbs_content");
        if (contentElement) {
            if (geminiApiKey != null) {
                geminiAPI.setKey(geminiApiKey);
                try {
                    const response_text = await geminiAPI.generate(prompt);
                    parseText = parse(response_text).toString();
                } catch (error) {
                    parseText = `Error generating text: ${error}`;
                }
            } else {
                parseText = "Please set API key in the extension settings";
            }
            contentElement.innerHTML = parseText;
            const ttsSpeak = TTSSpeak.getInstance();
            ttsSpeak.speak((contentElement as HTMLElement).innerText);
        }
    });
}