
export interface IMessage {
    action: string;
    text?: string;
    isStream?: boolean;
}

export interface IMessageQueue {
    enqueue(message: IMessage, mockSendMessage?: (message: IMessage) => void): void;
}

class MessageQueue implements IMessageQueue {
    private queue: any[] = [];
    private isProcessing: boolean = false;

    enqueue(message: IMessage, mockSendMessage?: (message: IMessage) => void): void {
        this.queue.push(message);
        this.processQueue(mockSendMessage);
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

    private async sendMessage(message: IMessage): Promise<void> {
        return new Promise((resolve, reject) => {
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
            };
            trySendMessage(); // Initiate the first attempt
        });
    }    
}

export const messageQueue = new MessageQueue();