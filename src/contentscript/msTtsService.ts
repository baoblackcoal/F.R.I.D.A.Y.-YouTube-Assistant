import { ITtsService } from '../common/ITtsService';
import { ISettingsManager, settingsManager } from "../common/settingsManager";
import { MsTtsApi } from '../contentscript/msTtsApi';
import { logTime } from '../contentscript/utils';
import { MessageObserver } from '../utils/messageObserver';
import { ITtsMessage } from '../utils/messageQueue';

export class MsTtsService implements ITtsService {
    private speakTextArray: { text: string, index: number }[] = [];
    private isProcessing: boolean = false;
    private stopStreamSpeakFlag: boolean = false;
    private settingsManager: ISettingsManager;
    private msTtsApi: MsTtsApi;
    private messageObserver: MessageObserver;
    private isSpeaking: boolean = false;

    constructor(settingsManager: ISettingsManager) {
        this.settingsManager = settingsManager;
        this.msTtsApi = MsTtsApi.getInstance();
        this.messageObserver = MessageObserver.getInstance();
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

        while (this.speakTextArray.length > 0) {
            const nextText = this.speakTextArray.shift();
            if (nextText) {
                try {
                    this.isSpeaking = true;
                    await this.msTtsApi.synthesizeSpeech(nextText.text);
                    if (sender.tab && sender.tab.id !== undefined) {
                        this.messageObserver.notifyObserversTtsMessage({ action: 'ttsSpeakingText', index: nextText.index });
                        this.messageObserver.notifyObserversTtsMessage({ action: 'ttsEnableAccpetMessage', index: nextText.index });
                        this.messageObserver.notifyObserversTtsMessage({ action: 'ttsCheckSpeaking', speaking: true });
                    }
                } catch (error) {
                    console.error("Error during speech synthesis: ", error);
                }
            } else {
                this.messageObserver.notifyObserversTtsMessage({ action: 'ttsCheckSpeaking', speaking: false });
                this.isSpeaking = false;
            }   
        }

        this.isProcessing = false;
        playVideo();
    }

    stopStreamSpeak(): void {
        this.stopStreamSpeakFlag = true;
        this.isProcessing = false;
        this.speakTextArray = [];
        this.isSpeaking = false;
    }

    resetStreamSpeak(): void {
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

function respondToSenderSuccess(sendResponse: (response?: any) => void) {
    sendResponse({ status: "success" });
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

    // message = { action: 'ttsCheckSpeaking' };
    // messageObserver.addObserverTtsMessage(message, (message: ITtsMessage) => {
    //     const isSpeaking = ttsService.checkSpeaking();
    //     console.log(`(msTtsService)ttsCheckSpeaking: ${isSpeaking}`);
    //     const messageReturn = { "speaking": isSpeaking };
    //     return messageReturn;
    // });

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


    // logTime('msTtsService 0');
    // chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    //     if (ttsEngine1 !== TtsEngine.Microsoft) {
    //         return;
    //     }

    //     console.log(`(msTtsService)Received message: ${message.action}`);
    //     switch (message.action) {
    //         case 'resetWhenPageChange'+'Background':
    //             // ttsService.resetStreamSpeak();
    //             // respondToSenderSuccess(sendResponse);
    //             break;
    //         case 'resetStreamSpeak'+'Background':
    //             // ttsService.resetStreamSpeak();
    //             // respondToSenderSuccess(sendResponse);
    //             break;
    //         case 'speak'+'Background':
    //             // ttsService.speakText(message.text, message.index, sender);
    //             // respondToSenderSuccess(sendResponse);
    //             break;
    //         case 'speakAndPlayVideo'+'Background':
    //             // ttsService.speakText(message.text, message.index, sender, () => {
    //             //     if (sender.tab && sender.tab.id !== undefined) {
    //             //         chrome.tabs.sendMessage(sender.tab.id, { action: 'playVideo' });
    //             //     }
    //             // });
    //             // respondToSenderSuccess(sendResponse);
    //             break;
    //         case 'ttsDeleteQueueLargerThanMarkIndex'+'Background':
    //             // ttsService.deleteQueueLargerThanMarkIndex(message.index);
    //             // respondToSenderSuccess(sendResponse);
    //             break;
    //         case 'ttsStop'+'Background':
    //             // ttsService.stopStreamSpeak();
    //             // respondToSenderSuccess(sendResponse);
    //             break;          
    //         default:
    //             break;
    //     }
    //     return true;
    // });
    // //wait for 3000ms
    // logTime('msTtsService 1');
}

