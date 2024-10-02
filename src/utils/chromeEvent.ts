

interface ISyncFromBackgroundMessage {
    action: string;
    token: number;
}

enum ChromeMessageType {
    SyncFromBackground = 'syncFromBackground',
}

export function waitSyncMessageFromeBackground(token: number) : Promise<boolean> {
    const message: ISyncFromBackgroundMessage = {
        action: ChromeMessageType.SyncFromBackground,
        token: token,
    };
    return new Promise((resolve, reject) => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === ChromeMessageType.SyncFromBackground && message.token === token) {
                resolve(true);
            }
        });
    });
}