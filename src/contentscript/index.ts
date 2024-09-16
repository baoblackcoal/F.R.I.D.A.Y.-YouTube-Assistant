"use strict";

import { insertSummaryBtn } from "./youtube";

let oldHref = "";

window.onload = async () => {

    if (window.location.hostname === "www.youtube.com") {

        // if (window.location.search !== "" && window.location.search.includes("v=")) {
        //     insertSummaryBtn();
        // }
        const bodyList = document.querySelector("body");
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (oldHref !== document.location.href) {
                    oldHref = document.location.href;
                    insertSummaryBtn();
                }
            });
        });
        if (bodyList) {
            observer.observe(bodyList, { childList: true, subtree: true });
        }
    }

    if (window.location.hostname === "chat.openai.com") {
        const textarea = document.getElementsByTagName("textarea")[0];
        if (textarea) {
            textarea.focus();
            if (window.location.search === "?ref=glasp") {
                chrome.runtime.sendMessage({ message: "getPrompt" }, (response: { prompt: string }) => {
                    textarea.value = response.prompt;
                    if (response.prompt !== "") {
                        textarea.focus();
                        const buttons = document.getElementsByTagName("button");
                        buttons[buttons.length - 1].click();
                    }
                });
            }
        }
    }

    if (window.location.hostname === "example.com") {
        document.body.style.border = "5px solid red";

        // Send a message to the background worker
        chrome.runtime.sendMessage({ action: 'fetchData' }, (response) => {
            if (!response) {
                console.error('No response received from background script');
                return;
            } else if (response.error) {
                console.log(response.error);
            } else {
                console.log('Data received from background:', response.data);
            }
        });
    }

    chrome.runtime.sendMessage({ action: 'getSettings' }, (response: { setting: any }) => {
        const setting = response.setting || {};
        // initializeUI(); // Initialize the UI once settings are received
    });

}

