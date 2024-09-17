import { TtsSettings } from '../common';

export interface TTSInterface {
    speak(text: string): void;
    stop(): void;
}

export class TTSSpeak implements TTSInterface {
    speak(text: string): void {
        chrome.runtime.sendMessage({
            action: 'speak',
            text: text,
        });
    }

    stop(): void {
        chrome.runtime.sendMessage({
            action: 'ttsStop',
        });
    }
}
