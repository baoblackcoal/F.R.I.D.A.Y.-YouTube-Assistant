"use strict";

import { getLangOptionsWithLink, getTranscriptHTML, getRawTranscriptText } from "./transcript";
import { getSearchParam } from "./searchParam";
import { getChunckedTranscripts, getSummaryPrompt } from "./prompt";
import { copyTextToClipboard } from "./copy";
import { getLogoSvg, getSummarySvg, getTrackSvg, getCopySvg, getToggleSvg } from './svgs.js';
import { sayHelloByGemini, generate, setKey } from './gemini_api';
import { parse } from 'marked'

let videoId = null;
function getVideoId() {
    if (!videoId) {
        videoId = getSearchParam(window.location.href).v;
    }
    return videoId;
}

export function insertSummaryBtn() {

    // Sanitize Transcript Div
    if (document.querySelector("#yt_ai_summary_lang_select")) { document.querySelector("#yt_ai_summary_lang_select").innerHTML = ""; }
    if (document.querySelector("#yt_ai_summary_summary")) { document.querySelector("#yt_ai_summary_summary").innerHTML = ""; }
    Array.from(document.getElementsByClassName("yt_ai_summary_container")).forEach(el => { el.remove(); });

    if (!getSearchParam(window.location.href).v) { return; }

    waitForElm('#secondary.style-scope.ytd-watch-flexy').then(() => {

        // Sanitize
        Array.from(document.getElementsByClassName("yt_ai_summary_container")).forEach(el => { el.remove(); });

        // Place Script Div
        document.querySelector("#secondary.style-scope.ytd-watch-flexy").insertAdjacentHTML("afterbegin", `
            <div class="yt_ai_summary_container">     
                       
                <div class="ytbs_container" style="font-size: 15px; background-color: rgb(255, 255, 255);  padding:6px;">
                    <div class="ytbs_content"> </div>                    
                </div>


                <div id="yt_ai_summary_header" class="yt_ai_summary_header">
                    <a href="https://glasp.co/youtube-summary" target="_blank" style="width: 24px;height: 24px;">
                        ${getLogoSvg()}
                    </a>
                    <p class="yt_ai_summary_header_text">Transcript & Summary</p>
                    <div class="yt_ai_summary_header_actions">
                        <div id="yt_ai_summary_header_summary" class="yt_ai_summary_header_action_btn yt-summary-hover-el yt_ai_summary_icon" data-hover-label="View AI Summary\n(Open New Tab)">
                            ${getSummarySvg()}
                        </div>
                        <div id="yt_ai_summary_header_track" class="yt_ai_summary_header_action_btn yt-summary-hover-el" data-hover-label="Jump to Current Time">
                            ${getTrackSvg()}
                        </div>
                        <div id="yt_ai_summary_header_copy" class="yt_ai_summary_header_action_btn yt-summary-hover-el" data-hover-label="Copy Transcript\n(Plain Text)">
                            ${getCopySvg()}
                        </div>
                        <div style="filter: brightness(0.9);" id="yt_ai_summary_header_toggle" class="yt_ai_summary_header_action_btn">
                            ${getToggleSvg()}
                        </div>
                    </div>
                </div>
                <div id="yt_ai_summary_body" class="yt_ai_summary_body">
                    <div id="yt_ai_summary_lang_select" class="yt_ai_summary_lang_select"></div>
                    <div id="yt_ai_summary_text" class="yt_ai_summary_text"></div>
                </div>
            </div>

        `);

        // Event Listener: Hover Label
        Array.from(document.getElementsByClassName("yt-summary-hover-el")).forEach(el => {
            const label = el.getAttribute("data-hover-label");
            if (!label) { return; }
            el.addEventListener("mouseenter", (e) => {
                e.stopPropagation();
                e.preventDefault();
                Array.from(document.getElementsByClassName("yt_ai_summary_header_hover_label")).forEach(el => { el.remove(); })
                el.insertAdjacentHTML("beforeend", `<div class="yt_ai_summary_header_hover_label">${label.replace(/\n+/g, `<br />`)}</div>`);
            })
            el.addEventListener("mouseleave", (e) => {
                e.stopPropagation();
                e.preventDefault();
                Array.from(document.getElementsByClassName("yt_ai_summary_header_hover_label")).forEach(el => { el.remove(); })
            })
        })

        // Event Listener: Copy Transcript
        document.querySelector("#yt_ai_summary_header_copy").addEventListener("click", (e) => {
            e.stopPropagation();
            const videoId = getSearchParam(window.location.href).v;
            copyTranscript(videoId);
        })

        // Event Listener: AI Summary
        document.querySelector("#yt_ai_summary_header_summary").addEventListener("click", (e) => {
            e.stopPropagation();
            const prompt = copyTranscriptAndPrompt();
            setTimeout(() => {
                chrome.runtime.sendMessage({ message: "setPrompt", prompt: prompt });
                window.open("https://chat.openai.com/chat?ref=glasp", "_blank");
            }, 500);
        })

        // Event Listener: Jump to Current Timestamp
        document.querySelector("#yt_ai_summary_header_track").addEventListener("click", (e) => {
            e.stopPropagation();
            scrollIntoCurrTimeDiv();
        })

        // Event Listener: Toggle Transcript Body
        document.querySelector("#yt_ai_summary_header").addEventListener("click", async (e) => {

            const videoId = getSearchParam(window.location.href).v;
            sanitizeWidget();

            if (!isWidgetOpen()) { return; }

            // Get Transcript Language Options & Create Language Select Btns
            const langOptionsWithLink = await getLangOptionsWithLink(videoId);
            if (!langOptionsWithLink) {
                noTranscriptionAlert();
                return;
            }
            createLangSelectBtns(langOptionsWithLink);

            // Create Transcript HTML & Add Event Listener
            const transcriptHTML = await getTranscriptHTML(langOptionsWithLink[0].link, videoId);
            document.querySelector("#yt_ai_summary_text").innerHTML = transcriptHTML;
            evtListenerOnTimestamp();

            // Event Listener: Language Select Btn Click
            evtListenerOnLangBtns(langOptionsWithLink, videoId);

        })


        generateSummary();
    });
}

async function getVideoTitle() {
    // Select the div that contains the title
    const titleDiv = document.querySelector('div#title.style-scope.ytd-watch-metadata');

    // Check if the title div exists
    if (titleDiv) {
        // Find the h1 element within the title div
        const h1Element = titleDiv.querySelector('h1.style-scope.ytd-watch-metadata');

        // Check if the h1 element exists and find the yt-formatted-string element
        if (h1Element) {
            const titleElement = h1Element.querySelector('yt-formatted-string.style-scope.ytd-watch-metadata');

            // Check if the yt-formatted-string element exists and extract the title text
            if (titleElement) {
                const videoTitle = titleElement.textContent.trim();

                return videoTitle;
            }
        }
    }
    return "Can not get Title";
}

async function getTranscriptText() {
    // Get Transcript Language Options & Create Language Select Btns
    const langOptionsWithLink = await getLangOptionsWithLink(getVideoId());
    if (!langOptionsWithLink) {
        noTranscriptionAlert();
        return null;
    }

    const text = await getRawTranscriptText(langOptionsWithLink[0].link);
    return text;
}

async function getApiKey(callback) {
    // Get the API key from the browser storage
    chrome.storage.sync.get('geminiApiKey', (data) => {
        let geminiApiKey = null;

        try {
            if (data.geminiApiKey) {
                geminiApiKey = data.geminiApiKey;
                console.log('Gemini API Key:', geminiApiKey);
                // Now you can use geminiApiKey for your purposes
            } else {
                console.log('Gemini API Key not found in browser storage.');
            }
        
            if (geminiApiKey == null) {
                geminiApiKey = process.env.GEMINI_API_KEY;
            }
        } catch (error) {
            console.error('Error getting Gemini API Key:', error);
        }

        if (callback) callback(geminiApiKey);
    });
}


async function generateSummary() {
    const textTranscript = await getTranscriptText();
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
`

    // Call the generate function and update the content dynamically
    getApiKey((geminiApiKey) => {
        const contentElement = document.querySelector(".ytbs_content");
        if (geminiApiKey != null) {
            setKey(geminiApiKey);
            generate(prompt).then((response_text) => {
                if (contentElement) {
                    contentElement.innerHTML = parse(response_text); // Update the content with the generated text
                }
            }).catch(error => {
                // console.error('Error generating text:', error);
                contentElement.innerHTML = `Error generating text:${error}`
            });
        } else {
            contentElement.innerHTML = "Please set API key in the extension settings"
        }
    });
}

function sanitizeWidget() {
    // Sanitize Transcript Div
    document.querySelector("#yt_ai_summary_lang_select").innerHTML = "";
    document.querySelector("#yt_ai_summary_text").innerHTML = "";

    // Height Adjust
    document.querySelector("#yt_ai_summary_body").style.maxHeight = window.innerHeight - 160 + "px";
    document.querySelector("#yt_ai_summary_text").innerHTML = `
    <svg class="yt_ai_summary_loading" style="display: block;width: 48px;margin: 40px auto;" width="48" height="48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 36C59.9995 36 37 66 37 99C37 132 61.9995 163.5 100 163.5C138 163.5 164 132 164 99" stroke="#5C94FF" stroke-width="6"/>
    </svg>`;

    // Toggle Class List
    document.querySelector("#yt_ai_summary_body").classList.toggle("yt_ai_summary_body_show");
    document.querySelector("#yt_ai_summary_header_copy").classList.toggle("yt_ai_summary_header_icon_show");
    document.querySelector("#yt_ai_summary_header_summary").classList.toggle("yt_ai_summary_header_icon_show");
    document.querySelector("#yt_ai_summary_header_track").classList.toggle("yt_ai_summary_header_icon_show");
    document.querySelector("#yt_ai_summary_header_toggle").classList.toggle("yt_ai_summary_header_toggle_rotate");
}

function isWidgetOpen() {
    return document.querySelector("#yt_ai_summary_body").classList.contains("yt_ai_summary_body_show");
}

function noTranscriptionAlert() {
    document.querySelector("#yt_ai_summary_text").innerHTML = `
        <div style="margin: 40px auto;text-align: center;">
            <p>No Transcription Available... 😢</p>
            <p>Try <a href="https://huggingface.co/spaces/jeffistyping/Youtube-Whisperer" target="_blank">Huggingface Youtube Whisperer</a> to transcribe!</p>
        </div>
    `;
}

function createLangSelectBtns(langOptionsWithLink) {
    document.querySelector("#yt_ai_summary_lang_select").innerHTML = Array.from(langOptionsWithLink).map((langOption, index) => {
        return `<button class="yt_ai_summary_lang ${(index == 0) ? "yt_ai_summary_lange_selected" : ""}" data-yt-transcript-lang="${langOption.language}">${langOption.language}</button>`;
    }).join("");
}

function evtListenerOnLangBtns(langOptionsWithLink, videoId) {
    Array.from(document.getElementsByClassName("yt_ai_summary_lang")).forEach((langBtn) => {
        langBtn.addEventListener("click", async (e) => {
            const lang = e.target.getAttribute("data-yt-transcript-lang");
            const targetBtn = document.querySelector(`.yt_ai_summary_lang[data-yt-transcript-lang="${lang}"]`);
            const link = langOptionsWithLink.find((langOption) => langOption.language === lang).link;
            // Create Transcript HTML & Event Listener
            const transcriptHTML = await getTranscriptHTML(link, videoId);
            document.querySelector("#yt_ai_summary_text").innerHTML = transcriptHTML;
            evtListenerOnTimestamp()
            targetBtn.classList.add("yt_ai_summary_lange_selected");
            Array.from(document.getElementsByClassName("yt_ai_summary_lang")).forEach((langBtn) => {
                if (langBtn !== targetBtn) { langBtn.classList.remove("yt_ai_summary_lange_selected"); }
            })
        })
    })
}

function getTYCurrentTime() {
    return document.querySelector("#movie_player > div.html5-video-container > video").currentTime ?? 0;
}

function getTYEndTime() {
    return document.querySelector("#movie_player > div.html5-video-container > video").duration ?? 0;
}

function scrollIntoCurrTimeDiv() {
    const currTime = getTYCurrentTime();
    Array.from(document.getElementsByClassName("yt_ai_summary_transcript_text_timestamp")).forEach((el, i, arr) => {
        const startTimeOfEl = el.getAttribute("data-start-time");
        const startTimeOfNextEl = (i === arr.length - 1) ? getTYEndTime() : arr[i + 1].getAttribute("data-start-time") ?? 0;
        if (currTime >= startTimeOfEl && currTime < startTimeOfNextEl) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
            document.querySelector("#secondary > div.yt_ai_summary_container").scrollIntoView({ behavior: 'auto', block: 'end' });
        }
    })
}

function evtListenerOnTimestamp() {
    Array.from(document.getElementsByClassName("yt_ai_summary_transcript_text_timestamp")).forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const starttime = el.getAttribute("data-start-time");
            const ytVideoEl = document.querySelector("#movie_player > div.html5-video-container > video");
            ytVideoEl.currentTime = starttime;
            ytVideoEl.play();
        })
    })
}

function copyTranscript(videoId) {
    let contentBody = "";
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    contentBody += `${document.title}\n`;
    contentBody += `${url}\n\n`;
    // contentBody += `![](${url})\n`;
    contentBody += `Transcript:\n`;
    Array.from(document.getElementById("yt_ai_summary_text").children).forEach(el => {
        if (!el) { return; }
        if (el.children.length < 2) { return; }
        const timestamp = el.querySelector(".yt_ai_summary_transcript_text_timestamp").innerText;
        const timestampHref = el.querySelector(".yt_ai_summary_transcript_text_timestamp").getAttribute("data-timestamp-href");
        const text = el.querySelector(".yt_ai_summary_transcript_text").innerText;
        // contentBody += `- [${timestamp}](${`https://www.youtube.com${timestampHref}`}) ${text}\n`;
        contentBody += `(${timestamp}) ${text}\n`;
    })
    copyTextToClipboard(contentBody);
}

function copyTranscriptAndPrompt() {
    const textEls = document.getElementsByClassName("yt_ai_summary_transcript_text");
    const textData = Array.from(textEls).map((textEl, i) => {
        return {
            text: textEl.textContent.trim(),
            index: i,
        }
    })
    const text = getChunckedTranscripts(textData, textData);
    const prompt = getSummaryPrompt(text);
    copyTextToClipboard(prompt);
    return prompt;
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}