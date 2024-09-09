document.getElementById('saveBtn').addEventListener('click', () => {
    const bgColor = document.getElementById('bgColor').value;
    const geminiApiKey = document.getElementById('geminiApiKey').value;

    // Save both the background color and Gemini API key
    chrome.storage.sync.set({ bgColor, geminiApiKey }, () => {
        console.log('Options saved');
    });
});

// Load the saved options
chrome.storage.sync.get(['bgColor', 'geminiApiKey'], (data) => {
    if (data.bgColor) {
        document.getElementById('bgColor').value = data.bgColor;
    }
    if (data.geminiApiKey) {
        document.getElementById('geminiApiKey').value = data.geminiApiKey;
    }
});
