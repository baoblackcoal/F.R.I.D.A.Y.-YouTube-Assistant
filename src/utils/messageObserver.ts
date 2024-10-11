import { ITtsMessage } from "./messageQueue";

// Define a type for the observer function
export type TtsMessageHandler = (message: ITtsMessage) => void;
export type MessageHandler = (message: any) => void;
// ObserverType can be either 'process_on' for Node.js or 'chrome_message' for Chrome extensions
enum ObserverType {
    ProcessOn = 'process_on',
    ChromeMessage = 'chrome_message'
}

// Interface for the MessageObserver
export interface IMessageObserver {
    addObserverTtsMessage(message: ITtsMessage, handler: TtsMessageHandler): void;
    notifyObserversTtsMessage(message: ITtsMessage): void;
    // addObserver(messageType: string, handler: MessageHandler): void;
    // notifyObservers(messageType: string, message: any): void;
}

export class MessageObserver implements IMessageObserver {
    private static instance: MessageObserver;
    private observerType: ObserverType = ObserverType.ProcessOn;
    private ttsHandlers: Map<string, TtsMessageHandler[]> = new Map();
    private handlers: Map<string, MessageHandler[]> = new Map();
    

    public setObserverType(observerType: ObserverType): void {
        this.observerType = observerType;
    }

    // Static method to get the singleton instance
    public static getInstance(): MessageObserver {
        if (!MessageObserver.instance) {
            MessageObserver.instance = new MessageObserver();
        }
        return MessageObserver.instance;
    }

    addObserverTtsMessage(message: ITtsMessage, handler: TtsMessageHandler): void {
        if (this.observerType === ObserverType.ProcessOn) {
            if (!this.ttsHandlers.has(message.action)) {
                this.ttsHandlers.set(message.action, []);
            }
            this.ttsHandlers.get(message.action)?.push(handler);
        }else {
            chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
                if (_message && _message.action === message.action) {
                    console.log(`Received message of type ${message.action} via chrome.runtime:`, message);
                    handler(message);
                    sendResponse({ status: 'ok' });
                    return true;
                }
            });
            
        }
    }

    notifyObserversTtsMessage(message: ITtsMessage): void {
        if (this.observerType === ObserverType.ProcessOn) {
            this.ttsHandlers.forEach((handlers, action) => {
                if (action === message.action) {
                    handlers.forEach(handler => handler(message));
                }
            });
        }else {
            chrome.runtime.sendMessage(message);
        }
    }

    // // Add a new observer (listener) function for a specific message type
    // addObserver(messageType: string, handler: MessageHandler): void {
    //     if (!this.handlers.has(messageType)) {
    //         this.handlers.set(messageType, []);
    //         this.listen(messageType);
    //     }
    //     this.handlers.get(messageType)?.push(handler);
    // }

    // // Notify all registered observers for a specific message type
    // notifyObservers(messageType: string, message: any): void {
    //     this.send(message);
    // }

    // private send(message: any): void {
    //     if (this.observerType === 'process_on') {
    //         if (process && typeof process.send === 'function') {
    //             process.send(message);
    //         } else {
    //             console.error('Process send function is not available.');
    //         }
    //     } else if (this.observerType === 'chrome_message') {
    //         if (chrome && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
    //             chrome.runtime.sendMessage(message);
    //         } else {
    //             console.error('Chrome runtime sendMessage function is not available.');
    //         }
    //     }
    // }

    // // Start listening for messages based on observerType and messageType
    // private listen(messageType: string): void {
    //     if (this.observerType === 'process_on') {
    //         this.listenProcessOn(messageType);
    //     } else if (this.observerType === 'chrome_message') {
    //         this.listenChromeMessage(messageType);
    //     }
    // }

    // // Listen for Node.js process messages
    // private listenProcessOn(messageType: string): void {
    //     process.on('message', (message: any) => {
    //         if (message && message.type === messageType) {
    //             console.log(`Received message of type ${messageType} via process.on:`, message);
    //             this.notifyObservers(messageType, message);
    //         }
    //     });
    // }

    // // Listen for Chrome Extension messages
    // private listenChromeMessage(messageType: string): void {
    //     chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //         if (message && message.type === messageType) {
    //             console.log(`Received message of type ${messageType} via chrome.runtime:`, message);
    //             this.notifyObservers(messageType, message);
    //             sendResponse({ status: 'ok' });
    //             return true;
    //         }
    //     });
    // }
}

// // Usage example:

// // Change this based on your environment (either 'process_on' or 'chrome_message')
// const observerType: ObserverType = 'process_on'; // or 'chrome_message'

// // Create a new observer instance
// const observer = new MessageObserver(observerType);

// // Add observers (handlers) for specific message types
// observer.addObserver('task', (msg) => {
//     console.log('Observer 1 received task message:', msg);
// });

// observer.addObserver('notification', (msg) => {
//     console.log('Observer 2 received notification message:', msg);
// });

// // Sending a message
// observer.sendMessage({ type: 'task', task: 'fetchData', id: 42 });

