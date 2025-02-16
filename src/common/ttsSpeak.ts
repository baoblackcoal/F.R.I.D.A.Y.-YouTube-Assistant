import { ApiType } from './ISettings';
import { messageQueue, ITtsMessage } from '../utils/messageQueue';
import { MessageObserver } from '../utils/messageObserver';
import { MsTtsApi } from './msTtsApi';
import { settingsManager } from './settingsManager';

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
    getVoiceNames(callback: (voices: VoiceInfo[]) => void): void;
}

export interface VoiceInfo {
    voiceName: string;
    lang: string;
    // gender: string;
    // locale: string;
    // styleList: string[];
    // sampleRateHertz: number;
    // status: string;
}

export class TTSSpeak implements TTSInterface {
    private static instance: TTSSpeak;
    private _isSpeaking: boolean = false;
    private messageObserver: MessageObserver;
    private checkSpeakingAddObservered : boolean = false;

    private constructor() {
        this.messageObserver = MessageObserver.getInstance();
    }

    async getVoiceNames(callback: (voices: VoiceInfo[]) => void): Promise<void> {
        const ttsSettings = await settingsManager.getTtsSettings();
        if (ttsSettings.apiType === ApiType.Azure) {
            const msTtsApi = MsTtsApi.getInstance();
            msTtsApi.getVoices().then(voices => {
                callback(voices.map(voice => ({ voiceName: voice.name, lang: voice.locale })));
            });
        } else {
            chrome.tts.getVoices((voices: chrome.tts.TtsVoice[]) => {
                callback(voices.map(voice => ({ voiceName: voice.voiceName || '', lang: voice.lang || '' })));
            });
        }
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
                console.log('Error in speak:', error);
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
                console.log('Error in resetStreamSpeak:', error);
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
                console.log('Error in speakAndPlayVideo:', error);
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
                console.log('Error in stop:', error);
                reject(error);
            }
        });
    }

    isSpeaking(): boolean {
        if (!this.checkSpeakingAddObservered) {
            this.checkSpeakingAddObservered = true;
            this.messageObserver.addObserverTtsMessage({ action: 'ttsCheckSpeaking' }, (message: any) => {
                this._isSpeaking = message!.speaking;
            });
        }
        return this._isSpeaking;
    }
}
