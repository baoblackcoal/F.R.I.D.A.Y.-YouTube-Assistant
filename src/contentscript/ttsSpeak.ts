import { TtsSettings } from '../settings';

export interface TTSInterface {
    speak(text: string): void;
    speakAndPlayVideo(text: string): void;
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

    speak(text: string): void {
        chrome.runtime.sendMessage({
            action: 'speak',
            text: text,
        });
    }

    speakAndPlayVideo(text: string): void {
        chrome.runtime.sendMessage({
            action: 'speakAndPlayVideo',
            text: text,
        });
    }   

    stop(): void {
        chrome.runtime.sendMessage({
            action: 'ttsStop',
        });
    }

    isSpeaking(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'ttsCheckSpeaking' }, (response) => {
                resolve(response.isSpeaking);
            });
        });
    }
}
