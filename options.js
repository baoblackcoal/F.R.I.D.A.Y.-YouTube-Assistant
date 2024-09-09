document.getElementById('saveBtn').addEventListener('click', () => {
    const bgColor = document.getElementById('bgColor').value;
    chrome.storage.sync.set({ bgColor }, () => {
        console.log('Options saved');
    });
});

// Load the saved options
chrome.storage.sync.get('bgColor', (data) => {
    if (data.bgColor) {
        document.getElementById('bgColor').value = data.bgColor;
    }
});
