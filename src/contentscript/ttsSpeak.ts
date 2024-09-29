import { TtsSettings } from '../settings';
import { messageQueue, IMessage } from '../utils/messageQueue';

export interface TTSInterface {
    speak(text: string, isStream: boolean): void;
    speakAndPlayVideo(text: string, isStream: boolean): Promise<void>;
    stop(): void;
    isSpeaking(): Promise<boolean>;
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

    speak(text: string, isStream: boolean = false): void {
        chrome.runtime.sendMessage({
            action: 'speak',
            text: text,
            isStream: isStream,
        });
    }

    async speakAndPlayVideo(text: string, isStream: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: IMessage = {
                    action: 'speakAndPlayVideo',
                    text: text,
                    isStream: isStream,
                };
                messageQueue.enqueue(message);
                resolve();
            } catch (error) {
                console.error('Error in speakAndPlayVideo:', error);
                reject(error);
            }
        });
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
