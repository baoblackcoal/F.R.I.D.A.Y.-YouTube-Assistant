const URL_PARAMS = new URLSearchParams(window.location.search);

async function getActiveTab() {
    // Open popup.html?tab=5 to use tab ID 5, etc.
    if (URL_PARAMS.has("tab")) {
        return parseInt(URL_PARAMS.get("tab"));
    }

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    return tabs[0].id; // Return the tab ID
}

// document.getElementById('fetchBtn1').addEventListener('click', async () => {
//     const activeTabId = await getActiveTab();

//     chrome.runtime.sendMessage({ action: 'fetchData', tabId: activeTabId }, (response) => {
//         if (!response) {
//             console.error('No response received from background script');
//             return;
//         } else if (response.error) {
//             console.log(response.error);
//         } else {
//             console.log('Data received from background:', response.data);
//         }
//     });
// });

document.getElementById('fetchBtn').addEventListener('click', async () => {
    // Save the value 1 to Chrome's storage
    chrome.storage.sync.set({ savedValue: 1 }, () => {
        if (chrome.runtime.lastError) {
            console.error('Error saving to storage:', chrome.runtime.lastError);
        } else {
            console.log('Value 1 has been saved to storage');
        }
    });
});
