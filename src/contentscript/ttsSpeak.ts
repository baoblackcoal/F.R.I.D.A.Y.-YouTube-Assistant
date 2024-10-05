import { TtsSettings } from '../settings';
import { messageQueue, IMessage } from '../utils/messageQueue';

export interface TTSInterface {
    speak(text: string, index: number): Promise<void>;
    speakFinsh(): void;
    speakAndPlayVideo(text: string, index: number): Promise<void>;
    stop(): void;
    isSpeaking(): Promise<boolean>;
    resetStreamSpeak(): Promise<void>;
    speakAndPlayVideoFinsh(): void;
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

    speakFinsh(): void {
        this.speak('\n', -1);
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

    speakAndPlayVideoFinsh(): void {
        this.speakAndPlayVideo('\n', -1);
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
