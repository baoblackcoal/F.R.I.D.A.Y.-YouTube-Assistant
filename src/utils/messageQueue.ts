import { logTime } from "../contentscript/utils";

export interface IMessage {
    action: string;
    text?: string;
    index: number;
    isStream?: boolean;
}

export interface IMessageQueue {
    enqueue(message: IMessage, mockSendMessage?: (message: IMessage) => void): void;
}

class MessageQueue implements IMessageQueue {
    private queue: any[] = [];
    private isProcessing: boolean = false;
    private indexForDelete: number = -1;

    enqueue(message: IMessage, mockSendMessage?: (message: IMessage) => void): void {
        this.queue.push(message);
        this.processQueue(mockSendMessage);
    }

    clear(): void {
        this.queue = [];
    }

    markIndexForDelete(index: number): void {
        this.indexForDelete = index;
    }

    deleteQueueLargerThanMarkIndex(): void {
        if (this.indexForDelete != -1) {
            this.queue = this.queue.filter(message => message.index <= this.indexForDelete);
            chrome.runtime.sendMessage({ action: 'ttsDeleteQueueLargerThanMarkIndex', index: this.indexForDelete });
        }
    }

    private async processQueue(mockSendMessage?: (message: IMessage) => void): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const message = this.queue.shift();
            // split the message text into lines
            const lines = message.text?.split('\n') || [];
            for (const line of lines) {
                message.text = line;
                if (message.text.length == 0) {
                    continue;
                } 
                try {   
                    if (mockSendMessage) {
                        mockSendMessage(message);
                    } else {
                        await this.sendMessage(message);
                    }
                } catch (error) {
                    console.error('Failed to send message:', error);
                }
            }
        }

        this.isProcessing = false;
    }

    private sendMessage(message: IMessage): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let retries = 5; // number of retries
            const trySendMessage = () => {                    
                chrome.runtime.sendMessage(message, async (response) => {
                    if (chrome.runtime.lastError) {
                        if (retries > 0 && chrome.runtime.lastError?.message?.includes('message port closed')) {
                            retries--;
                            console.warn('Retrying to send message, attempts left:', retries);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            trySendMessage(); // Retry sending the message
                        } else {
                            reject(chrome.runtime.lastError);
                        }
                    } else {
                        resolve(response);
                    }
                });   
                //sleep 100ms for the next message to be sent
                // logTime('sleep 100ms 0');
                new Promise(resolve => setTimeout(resolve, 100));
                // logTime('sleep 100ms 1');             
            };
            trySendMessage(); // Initiate the first attempt

        });
    }    
}

export const messageQueue = new MessageQueue();