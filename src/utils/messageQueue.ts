export interface IMessageQueue {
    enqueue(message: any): void;
}

class MessageQueue implements IMessageQueue {
    private queue: any[] = [];
    private isProcessing: boolean = false;

    enqueue(message: any): void {
        this.queue.push(message);
        this.processQueue();
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const message = this.queue.shift();
            try {
                await this.sendMessage(message);
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }

        this.isProcessing = false;
    }

    private async sendMessage(message: any): Promise<void> {
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