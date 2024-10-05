import { TtsSettings } from '../settings';
import { messageQueue, IMessage } from '../utils/messageQueue';

export interface TTSInterface {
    speak(text: string, index: number): Promise<void>;
    speakFinsh(index: number): void;
    speakAndPlayVideo(text: string, index: number): Promise<void>;
    stop(): void;
    markIndexForDelete(index: number): void;
    deleteQueueLargerThanMarkIndex(): void;
    isSpeaking(): Promise<boolean>;
    resetStreamSpeak(): Promise<void>;
    speakAndPlayVideoFinsh(index: number): void;
}

export class TTSSpeak implements TTSInterface {
    private static instance: TTSSpeak;

    private constructor() {}

    public static getInstance(): TTSSpeak {
        if (!TTSSpeak.instance) {
            TTSSpeak.instance = new TTSSpeak();
        }
        return TTSSpeak.instance;
    }

    speak(text: string, index: number = -1): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: IMessage = {
                    action: 'speak',
                    text: text,
                    index: index,
                };
                messageQueue.enqueue(message);
                resolve();
            } catch (error) {
                console.error('Error in speakAndPlayVideo:', error);
                reject(error);
            }
        });
    }

    speakFinsh(index: number): void {
        this.speak('\n', index);
    }

    resetStreamSpeak(): Promise<void> {
        messageQueue.clear();
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({
                    action: 'resetStreamSpeak',
                });
                resolve();
            } catch (error) {
                console.error('Error in resetStreamSpeak:', error);
                reject(error);
            }
        });
    }

    async speakAndPlayVideo(text: string, index: number = -1): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: IMessage = {
                    action: 'speakAndPlayVideo',
                    text: text,
                    index: index,
                };
                messageQueue.enqueue(message);
                resolve();
            } catch (error) {
                console.error('Error in speakAndPlayVideo:', error);
                reject(error);
            }
        });
    }

    markIndexForDelete(index: number): void {
        messageQueue.markIndexForDelete(index);
    }

    deleteQueueLargerThanMarkIndex(): void {
        messageQueue.deleteQueueLargerThanMarkIndex();
    }

    speakAndPlayVideoFinsh(index: number): void {
        this.speakAndPlayVideo('\n', index);
    }

    stop(): void {
        chrome.runtime.sendMessage({
            action: 'ttsStop',
        });
    }

    isSpeaking(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage({ action: 'ttsCheckSpeaking' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response.isSpeaking);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
