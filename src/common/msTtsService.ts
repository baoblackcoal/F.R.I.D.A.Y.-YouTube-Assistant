import { ITtsService } from './ITtsService';
import { ISettingsManager, settingsManager } from "./settingsManager";
import { MsTtsApi } from './msTtsApi';
import { logTime } from '../contentscript/utils';
import { MessageObserver } from '../utils/messageObserver';
import { ITtsMessage } from '../utils/messageQueue';

export class MsTtsService implements ITtsService {
    private speakTextArray: { text: string, index: number }[] = [];
    private isProcessing: boolean = false;
    private stopStreamSpeakFlag: boolean = false;
    private isFirstSpeak: boolean = true;
    private settingsManager: ISettingsManager;
    private msTtsApi: MsTtsApi;
    private messageObserver: MessageObserver;
    private isSpeaking: boolean = false;
    private notifyTtsSpeakingTextFromAzureCallback: (index: number) => void;

    constructor(settingsManager: ISettingsManager) {
        this.settingsManager = settingsManager;
        this.msTtsApi = MsTtsApi.getInstance();
        this.messageObserver = MessageObserver.getInstance();
        // this.messageObserver.addObserverTtsMessage({ action: 'ttsSpeakingTextFromAzure' }, (message: ITtsMessage) => {
        //     this.messageObserver.notifyObserversTtsMessage({ action: 'ttsSpeakingText', index: message.index! });
        // });
        this.notifyTtsSpeakingTextFromAzureCallback = (index: number) => {
            this.messageObserver.notifyObserversTtsMessage({ action: 'ttsSpeakingText', index: index! });
            // this.messageObserver.notifyObserversTtsMessage({ action: 'ttsSpeakingTextFromAzure', index: index });
        }
    }

    async speakText(text: string, index: number, sender: chrome.runtime.MessageSender = {}, playVideo: () => void = () => { }): Promise<void> {
        await this.handleStreamText(text, index, sender, playVideo);
    }

    async handleStreamText(text: string, index: number, sender: chrome.runtime.MessageSender = {}, playVideo: () => void = () => { }): Promise<void> {
        if (this.stopStreamSpeakFlag || text.length === 0) {
            return;
        }

        this.speakTextArray.push({ text, index });
        this.speakNextText(false, sender, playVideo);
    }

    deleteQueueLargerThanMarkIndex(index: number): void {
        this.speakTextArray = this.speakTextArray.filter(text => text.index <= index);
    }

    private async speakNextText(isTtsSpeakEndCallback: boolean, sender: chrome.runtime.MessageSender, playVideo: () => void): Promise<void> {
        if (this.isProcessing && !isTtsSpeakEndCallback) {
            return;
        }
        this.isProcessing = true;

        while (true) {
            const nextText = this.speakTextArray.shift();
            if (nextText) {
                try {
                    this.isSpeaking = true;

                    // Delay 2000ms for the first time, and 0ms for the next time
                    if (this.isFirstSpeak) {
                        this.isFirstSpeak = false;
                        // this.messageObserver.notifyObserversTtsMessage({ action: 'ttsSpeakingTextFromAzure', index: nextText.index });
                        this.notifyTtsSpeakingTextFromAzureCallback(nextText.index);
                    } else {
                        this.msTtsApi.setHighlightIndex(nextText.index);
                    } 


                    this.messageObserver.notifyObserversTtsMessage({ action: 'ttsEnableAccpetMessage', index: nextText.index });
                    this.messageObserver.notifyObserversTtsMessage({ action: 'ttsCheckSpeaking', speaking: true });     
                    await this.msTtsApi.synthesizeSpeech(nextText.text, this.notifyTtsSpeakingTextFromAzureCallback, nextText.index);               
                } catch (error) {
                    console.log("Error during speech synthesis: ", error);
                }
            } else {
                this.messageObserver.notifyObserversTtsMessage({ action: 'ttsCheckSpeaking', speaking: false });
                this.isSpeaking = false;
                break;
            }   
        }

        this.isProcessing = false;
        playVideo();
    }

    stopStreamSpeak(): void {
        this.msTtsApi.stopSynthesis();
        this.isFirstSpeak = true;
        this.stopStreamSpeakFlag = true;
        this.isProcessing = false;
        this.speakTextArray = [];
        this.isSpeaking = false;
    }

    resetStreamSpeak(): void {
        this.msTtsApi.resetSynthesis();
        this.isFirstSpeak = true;
        this.isProcessing = false;
        this.stopStreamSpeakFlag = false;
        this.speakTextArray = [];
        this.isSpeaking = false;
    }
}

// Determine which TTS service to use
const ttsEngine: string = 'ms'; // or 'default'
let ttsService: ITtsService;

if (ttsEngine === 'ms') {
    ttsService = new MsTtsService(settingsManager);
} else {
    // ttsService = new TtsService(settingsManager);
}

// Assuming TtsEngine is an enum
enum TtsEngine {
    Chrome = 'Chrome',
    Microsoft = 'Microsoft',
}
let ttsEngine1: TtsEngine = TtsEngine.Chrome; 

export async function listenToMessages() {
    console.log(`(msTtsService)Listening to messages`);

    const messageObserver = MessageObserver.getInstance();

    let message: ITtsMessage = { action: 'resetWhenPageChange' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.resetStreamSpeak();
    });

    message = { action: 'ttsStop' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.stopStreamSpeak();
    });


    message = { action: 'resetStreamSpeak' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.resetStreamSpeak();
    });

    message = { action: 'speak' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.speakText(message.text!, message.index!);
    });

    message = { action: 'speakAndPlayVideo' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.speakText(message.text!, message.index!, undefined, () => {
            messageObserver.notifyObserversTtsMessage({ action: 'playVideo' });
        });
    });

    message = { action: 'ttsDeleteQueueLargerThanMarkIndex' };
    messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
        ttsService.deleteQueueLargerThanMarkIndex(message.index!);
    });
}

