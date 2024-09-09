"use strict";

console.log("connected...");
const onInstallURL = "https://glasp.co/youtube-summary";

// On Chrome Install
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        // chrome.tabs.create({ url: onInstallURL });
    }
});

let prompt = "";

// On Message
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === "setPrompt") {
        prompt = request.prompt;
    } else if (request.message === "getPrompt") {
        sendResponse({ prompt: prompt });
        prompt = ""; // Reset prompt
    }

    if (request.action === 'fetchData') {
        // Perform some background tasks like fetching data from an API
        // fetch('https://api.example.com/data')
        fetch('https://www.example.com')
            .then((response) => response.json())
            .then((data) => {
                sendResponse({ data });
            })
            .catch((error) => {
                sendResponse({ error: error.message });
            });
        return true; // Will respond asynchronously
    }
});