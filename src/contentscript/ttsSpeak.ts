import { TtsSettings } from '../common';

export interface TTSInterface {
    speak(text: string): void;
    speakAndPlayVideo(text: string): void;
    stop(): void;
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
}
