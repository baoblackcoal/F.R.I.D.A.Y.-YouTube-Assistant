import { TtsSettings } from '../common/settings';
import { messageQueue, ITtsMessage } from '../utils/messageQueue';
import { MessageObserver } from '../utils/messageObserver';

export interface TTSInterface {
    speak(text: string, index: number): Promise<void>;
    speakFinsh(index: number): void;
    speakAndPlayVideo(text: string, index: number): Promise<void>;
    stop(): Promise<void>;
    markIndexForDelete(index: number): void;
    deleteQueueLargerThanMarkIndex(): void;
    isSpeaking(): boolean;
    resetStreamSpeak(): Promise<void>;
    speakAndPlayVideoFinsh(index: number): void;
}

export class TTSSpeak implements TTSInterface {
    private static instance: TTSSpeak;
    private _isSpeaking: boolean = false;
    private messageObserver: MessageObserver;
    private constructor() {
        this.messageObserver = MessageObserver.getInstance();
    }

    public static getInstance(): TTSSpeak {
        if (!TTSSpeak.instance) {
            TTSSpeak.instance = new TTSSpeak();
        }
        return TTSSpeak.instance;
    }

    speak(text: string, index: number = -1): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: ITtsMessage = {
                    action: 'speak',
                    text: text,
                    index: index,
                };
                messageQueue.enqueue(message);
                resolve();
            } catch (error) {
                console.error('Error in speak:', error);
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
                const message: ITtsMessage = { action: 'resetStreamSpeak' };
                this.messageObserver.notifyObserversTtsMessage(message, (response) => {
                    this._isSpeaking = false;
                    resolve();
                });
            } catch (error) {
                console.error('Error in resetStreamSpeak:', error);
                reject(error);
            }
        });
    }

    async speakAndPlayVideo(text: string, index: number = -1): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: ITtsMessage = {
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

    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const message: ITtsMessage = { action: 'ttsStop' };
                this.messageObserver.notifyObserversTtsMessage(message, (response) => {
                    this._isSpeaking = false;
                    resolve();
                });
            } catch (error) {
                console.error('Error in stop:', error);
                reject(error);
            }
        });
    }

    isSpeaking(): boolean {
        this.messageObserver.addObserverTtsMessage({ action: 'ttsCheckSpeaking' }, (message: any) => {
            this._isSpeaking = message!.speaking;
        });
        // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {       
        //     if (message.action === 'ttsCheckSpeaking') {
        //         this._isSpeaking = message.speaking;
        //     }
        // });
        return this._isSpeaking;
    }
}
