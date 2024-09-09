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
        observer.observe(bodyList, { childList: true, subtree: true });

    }

    if (window.location.hostname === "chat.openai.com") {
        if (document.getElementsByTagName("textarea")[0]) {
            document.getElementsByTagName("textarea")[0].focus();
            // If search query is "?ref=glasp"
            if (window.location.search === "?ref=glasp") {
                // get prompt from background.js
                chrome.runtime.sendMessage({ message: "getPrompt" }, (response) => {
                    document.getElementsByTagName("textarea")[0].value = response.prompt;
                    if (response.prompt !== "") {
                        document.getElementsByTagName("textarea")[0].focus();
                        document.getElementsByTagName("button")[document.getElementsByTagName("button").length - 1].click();
                    }
                });
            }
        }
    }

    if (window.location.hostname === "www.example.com") {
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

}