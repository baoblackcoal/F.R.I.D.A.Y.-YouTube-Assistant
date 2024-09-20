document.addEventListener('DOMContentLoaded', () => {
    // initializeTTSSettings();

    const openOptionsButton = document.getElementById('openOptions');
    if (openOptionsButton) {
        openOptionsButton.addEventListener('click', () => {
            if (chrome.runtime.openOptionsPage) {
                chrome.runtime.openOptionsPage();
            } else {
                window.open(chrome.runtime.getURL('options.html'));
            }
        });
    }
});