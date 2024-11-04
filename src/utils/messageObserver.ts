import { ITtsMessage } from "./messageQueue";
import { responseOk, responseNoHandlers } from "../common/common";
import { settingsManager } from "../common/settingsManager";
import { ApiType } from "../common/ISettings";

// Define a type for the observer function
export type TtsMessageHandler = (message: ITtsMessage) => any;
export type MessageHandler = (message: any) => void;
// ObserverType can be either 'process_on' for Node.js or 'chrome_message' for Chrome extensions
enum ObserverType {
    Callback = 'callback',
    ChromeMessage = 'chrome_message'
}

// Interface for the MessageObserver
export interface IMessageObserver {
    addObserverTtsMessage(message: ITtsMessage, handler: TtsMessageHandler): void;
    notifyObserversTtsMessage(message: ITtsMessage, sendResponse?: (response?: any) => void): Promise<any>;
    // addObserver(messageType: string, handler: MessageHandler): void;
    // notifyObservers(messageType: string, message: any): void;
}

export class MessageObserver implements IMessageObserver {
    private static instance: MessageObserver;
    private observerType: ObserverType = ObserverType.ChromeMessage;
    private ttsHandlers: Map<string, TtsMessageHandler[]> = new Map();
    // private handlers: Map<string, MessageHandler[]> = new Map();
    

    public async updateObserverType(): Promise<void> {
        const ttsSettings = await settingsManager.getTtsSettings();
        this.observerType = ttsSettings.apiType === ApiType.Azure ? ObserverType.Callback : ObserverType.ChromeMessage;      
    }

    // Static method to get the singleton instance
    public static getInstance(): MessageObserver {
        if (!MessageObserver.instance) {
            MessageObserver.instance = new MessageObserver();
        }
        return MessageObserver.instance;
    }

    addObserverTtsMessage(message: ITtsMessage, handler: TtsMessageHandler): void {
        if (this.observerType === ObserverType.Callback) {
            this.ttsHandlers.set(message.action, []);
            this.ttsHandlers.get(message.action)?.push(handler);
            console.log(`Added handler for message type ${message.action}`);
        }else {
            chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
                if (_message && _message.action === message.action) {
                    console.log(`Received message of type ${message.action} via chrome.runtime:`, message);
                    handler(_message);
                    sendResponse(responseOk);
                    return true;
                }
            });
            
        }
    }

    async notifyObserversTtsMessage(message: ITtsMessage, sendResponse?: (response?: any) => void): Promise<void> {
        if (this.observerType === ObserverType.Callback) {
            let handled = false;
            this.ttsHandlers.forEach((handlers, action) => {
                if (action === message.action) {
                    handlers.forEach(handler => handler(message));
                    handled = true;
                    if (sendResponse) {
                        sendResponse(responseOk);
                    }
                } 
            });
            if (!handled) {
                if (sendResponse) {
                    sendResponse(responseNoHandlers);
                }
            }
        } else {
            return new Promise((resolve) => {
                chrome.runtime.sendMessage(message, (response) => {
                    console.log(`Response from chrome.runtime.sendMessage:`, response);
                    if (sendResponse) {
                        sendResponse(response);
                    }
                    resolve(response);
                });
            });
        }
    }
}
