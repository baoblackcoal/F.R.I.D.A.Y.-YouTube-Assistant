"use strict";

import { getLangOptionsWithLink, getTranscriptHTML, getRawTranscriptText } from "./transcript";
import { getSearchParam } from "./searchParam";
import { getChunckedTranscripts, getSummaryPrompt } from "./prompt";
import { copyTextToClipboard } from "./copy";
import { getLogoSvg, getSummarySvg, getTrackSvg, getCopySvg, getToggleSvg } from './svgs';
import { commandHandle } from './command/command';
import { waitForPlayer } from './subtitleSummary/subtitleSummary';
import { insertCommandContainer } from './command/commandView';
import { globalConfig } from '../common/config';
import { logTime, waitForElm } from "./utils";
import { handleSubtitleSummaryView, insertSummaryButtonView } from "./subtitleSummary/view/subtitleSummaryView";
import { friSummaryInit } from "./friSummary/friSummary";

export async function insertSummaryBtn(): Promise<void> {
    // log time ms   
    logTime("insertSummaryBtn");

    insertSummaryButtonView();

    insertCommandContainer();
    
    waitForPlayer();

    // Sanitize Transcript Div
    if (document.querySelector("#yt_ai_summary_lang_select")) { (document.querySelector("#yt_ai_summary_lang_select") as HTMLElement).innerHTML = ""; }
    if (document.querySelector("#yt_ai_summary_summary")) { (document.querySelector("#yt_ai_summary_summary") as HTMLElement).innerHTML = ""; }

    if (document.querySelector("#ytbs_container")) { (document.querySelector("#ytbs_container") as HTMLElement).innerHTML = ""; }

    Array.from(document.getElementsByClassName("yt_ai_summary_container")).forEach(el => { el.remove(); });

    if (!getSearchParam(window.location.href).v) { return; }

    waitForElm('#bottom-row').then(() => {
        logTime("bottom-row");

        // Sanitize
        Array.from(document.getElementsByClassName("yt_ai_summary_container")).forEach(el => { el.remove(); });

        friSummaryInit();


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
        document.querySelector("#yt_ai_summary_header_copy")!.addEventListener("click", (e) => {
            e.stopPropagation();
            const videoId = getSearchParam(window.location.href).v || "";
            copyTranscript(videoId);
        })

        // Event Listener: Toggle Transcript Body
        document.querySelector("#yt_ai_summary_header")!.addEventListener("click", async (e) => {
            toggleYoutubeSubtitle();
        })

        handleSubtitleSummaryView();
        commandHandle();
    });
}

export async function toggleYoutubeSubtitle(): Promise<void> {
    const videoId = getSearchParam(window.location.href).v || "";
    sanitizeWidget();

    if (!isWidgetOpen()) { return; }

    // Get Transcript Language Options & Create Language Select Btns
    const langOptionsWithLink = await getLangOptionsWithLink(videoId);
    if (!langOptionsWithLink) {
        noTranscriptionAlert();
        return;
    }
    createLangSelectBtns(langOptionsWithLink as { language: string, link: string }[]);

    // Create Transcript HTML & Add Event Listener
    const transcriptHTML = await getTranscriptHTML(langOptionsWithLink[0].link, videoId);
    (document.querySelector("#yt_ai_summary_text") as HTMLElement).innerHTML = transcriptHTML;
    evtListenerOnTimestamp();

    // Event Listener: Language Select Btn Click
    evtListenerOnLangBtns(langOptionsWithLink as { language: string, link: string }[], videoId);
}

function sanitizeWidget(): void {
    // Sanitize Transcript Div
    (document.querySelector("#yt_ai_summary_lang_select") as HTMLElement).innerHTML = "";
    (document.querySelector("#yt_ai_summary_text") as HTMLElement).innerHTML = "";

    // Height Adjust
    (document.querySelector("#yt_ai_summary_body") as HTMLElement).style.maxHeight = window.innerHeight - 160 + "px";
    (document.querySelector("#yt_ai_summary_text") as HTMLElement).innerHTML = `
    <svg class="yt_ai_summary_loading" style="display: block;width: 48px;margin: 40px auto;" width="48" height="48" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 36C59.9995 36 37 66 37 99C37 132 61.9995 163.5 100 163.5C138 163.5 164 132 164 99" stroke="#5C94FF" stroke-width="6"/>
    </svg>`;

    // Toggle Class List
    (document.querySelector("#yt_ai_summary_body") as HTMLElement).classList.toggle("yt_ai_summary_body_show");
    (document.querySelector("#yt_ai_summary_header_copy") as HTMLElement).classList.toggle("yt_ai_summary_header_icon_show");
    // (document.querySelector("#yt_ai_summary_header_summary") as HTMLElement).classList.toggle("yt_ai_summary_header_icon_show");
    // (document.querySelector("#yt_ai_summary_header_track") as HTMLElement).classList.toggle("yt_ai_summary_header_icon_show");
    (document.querySelector("#yt_ai_summary_header_toggle") as HTMLElement).classList.toggle("yt_ai_summary_header_toggle_rotate");
}

function isWidgetOpen(): boolean {
    return (document.querySelector("#yt_ai_summary_body") as HTMLElement).classList.contains("yt_ai_summary_body_show");
}

function noTranscriptionAlert(): void {
    (document.querySelector("#yt_ai_summary_text") as HTMLElement).innerHTML = `
        <div style="margin: 40px auto;text-align: center;">
            <p>No Transcription Available... 😢</p>
            <p>Try <a href="https://huggingface.co/spaces/jeffistyping/Youtube-Whisperer" target="_blank">Huggingface Youtube Whisperer</a> to transcribe!</p>
        </div>
    `;
}

function createLangSelectBtns(langOptionsWithLink: { language: string, link: string }[]): void {
    (document.querySelector("#yt_ai_summary_lang_select") as HTMLElement).innerHTML = Array.from(langOptionsWithLink).map((langOption, index) => {
        return `<button class="yt_ai_summary_lang ${(index == 0) ? "yt_ai_summary_lange_selected" : "yt_ai_summary_lange_unselected"}" data-yt-transcript-lang="${langOption.language}">${langOption.language}</button>`;
    }).join("");
}

function evtListenerOnLangBtns(langOptionsWithLink: { language: string, link: string }[], videoId: string): void {
    Array.from(document.getElementsByClassName("yt_ai_summary_lang")).forEach((langBtn) => {
        langBtn.addEventListener("click", async (e) => {
            const lang = (e.target as HTMLElement).getAttribute("data-yt-transcript-lang");
            const targetBtn = document.querySelector(`.yt_ai_summary_lang[data-yt-transcript-lang="${lang}"]`);
            const link = langOptionsWithLink.find((langOption) => langOption.language === lang)!.link;
            // Create Transcript HTML & Event Listener
            const transcriptHTML = await getTranscriptHTML(link, videoId);
            (document.querySelector("#yt_ai_summary_text") as HTMLElement).innerHTML = transcriptHTML;
            evtListenerOnTimestamp()
            targetBtn!.classList.add("yt_ai_summary_lange_selected");
            targetBtn!.classList.remove("yt_ai_summary_lange_unselected");
            Array.from(document.getElementsByClassName("yt_ai_summary_lang")).forEach((langBtn) => {
                if (langBtn !== targetBtn) { 
                    langBtn.classList.remove("yt_ai_summary_lange_selected"); 
                    langBtn.classList.add("yt_ai_summary_lange_unselected");
                }
            })
        })
    })
}

function getTYCurrentTime(): number {
    return (document.querySelector("#movie_player > div.html5-video-container > video") as HTMLVideoElement).currentTime ?? 0;
}

function getTYEndTime(): number {
    return (document.querySelector("#movie_player > div.html5-video-container > video") as HTMLVideoElement).duration ?? 0;
}

function scrollIntoCurrTimeDiv(): void {
    const currTime = getTYCurrentTime();
    Array.from(document.getElementsByClassName("yt_ai_summary_transcript_text_timestamp")).forEach((el, i, arr) => {
        const startTimeOfEl = parseFloat(el.getAttribute("data-start-time")!);
        const startTimeOfNextEl = (i === arr.length - 1) ? getTYEndTime() : parseFloat(arr[i + 1].getAttribute("data-start-time") ?? "0");
        if (currTime >= startTimeOfEl && currTime < startTimeOfNextEl) {
            el.scrollIntoView({ behavior: 'auto', block: 'start' });
            (document.querySelector("#secondary > div.yt_ai_summary_container") as HTMLElement).scrollIntoView({ behavior: 'auto', block: 'end' });
        }
    })
}

function evtListenerOnTimestamp(): void {
    Array.from(document.getElementsByClassName("yt_ai_summary_transcript_text_timestamp")).forEach(el => {
        el.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const starttime = parseFloat(el.getAttribute("data-start-time")!);
            const ytVideoEl = document.querySelector("#movie_player > div.html5-video-container > video") as HTMLVideoElement;
            ytVideoEl.currentTime = starttime;
            ytVideoEl.play();
        })
    })
}

function copyTranscript(videoId: string): void {
    let contentBody = "";
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    contentBody += `${document.title}\n`;
    contentBody += `${url}\n\n`;
    contentBody += `Transcript:\n`;
    Array.from(document.getElementById("yt_ai_summary_text")!.children).forEach(el => {
        if (!el) { return; }
        if (el.children.length < 2) { return; }
        const timestamp = (el.querySelector(".yt_ai_summary_transcript_text_timestamp") as HTMLElement).innerText;
        const timestampHref = el.querySelector(".yt_ai_summary_transcript_text_timestamp")!.getAttribute("data-timestamp-href");
        const text = (el.querySelector(".yt_ai_summary_transcript_text") as HTMLElement).innerText;
        contentBody += `(${timestamp}) ${text}\n`;
    })
    copyTextToClipboard(contentBody);
}

function copyTranscriptAndPrompt(): string {
    const textEls = document.getElementsByClassName("yt_ai_summary_transcript_text");
    const textData = Array.from(textEls).map((textEl, i) => {
        return {
            text: (textEl as HTMLElement).textContent!.trim(),
            index: i,
        }
    })
    const text = getChunckedTranscripts(textData, textData);
    const prompt = getSummaryPrompt(text);
    copyTextToClipboard(prompt);
    return prompt;
}
