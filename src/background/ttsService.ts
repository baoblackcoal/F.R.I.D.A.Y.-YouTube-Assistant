import { TtsSettings, defaultTtsSettings } from "../settings";
import { ISettingsManager } from "../settingsManager";
import { ITtsService } from "./ITtsService";

interface ITtsSpeakingText {
    text: string;
    index: number;
}
// TTS Service Implementation
export class TtsService implements ITtsService {
    private speakTextArray: ITtsSpeakingText[] = [];
    private lastStreamText: string = '';
    private isProcessing: boolean = false;
    private stopStreamSpeakFlag: boolean = false;
    private settingsManager: ISettingsManager;
    private defaultSender: chrome.runtime.MessageSender = {};
    private ttsSettings: TtsSettings = defaultTtsSettings;
    private speakingText: string = 'start_speak_flag'; // 'start_speak_flag', 'end_speak_flag' or speaking text


    constructor(settingsManager: ISettingsManager) {
        this.settingsManager = settingsManager;
        this.initializeTtsSettings();
    }

    private async initializeTtsSettings(): Promise<void> {
        this.ttsSettings = await this.settingsManager.getTtsSettings();
    }

    async speakText(text: string, index: number, sender: chrome.runtime.MessageSender = this.defaultSender, playVideo: () => void = () => { }): Promise<void> {
        await this.handleStreamText(text, index, sender, playVideo);
    }

    async handleStreamText(text: string, index: number, sender: chrome.runtime.MessageSender = this.defaultSender, playVideo: () => void = () => { }): Promise<void> {
        if (this.stopStreamSpeakFlag || text.length === 0) {
            return;
        }

        this.ttsSettings = await this.settingsManager.getTtsSettings();
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

        while (this.speakTextArray.length > 0 || this.speakingText.length > 0) {
            if (this.speakingText.length > 0 || this.speakingText === 'start_speak_flag') {
                let text = this.speakingText === 'start_speak_flag' ? ' ' : this.speakingText;
                this.speakingText = '';

                chrome.tts.speak(text, {
                    rate: this.ttsSettings.rate,
                    pitch: this.ttsSettings.pitch,
                    volume: this.ttsSettings.volume,
                    voiceName: this.ttsSettings.voiceName,
                    onEvent: (event: chrome.tts.TtsEvent) => this.handleTtsEvent(event, sender, playVideo)
                });
            }

            while (await new Promise(resolve => chrome.tts.isSpeaking(resolve))) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }

    private handleTtsEvent(event: chrome.tts.TtsEvent, sender: chrome.runtime.MessageSender, playVideo: () => void): void {
        if (event.type === 'end') {
            if (this.speakTextArray.length > 0) {
                this.processNextText(sender, playVideo);
            } else {
                this.setEndSpeak(playVideo);
                if (sender.tab && sender.tab.id !== undefined) {
                    chrome.tabs.sendMessage(sender.tab.id, { action: 'ttsCheckSpeaking', speaking: false });
                }
            }
        }
    }

    private processNextText(sender: chrome.runtime.MessageSender, playVideo: () => void): void {
        let getNextText = false;
        let index = 0;

        while (true) {
            const nextText = this.speakTextArray.shift();
            this.speakingText = nextText?.text || '';
            index = nextText?.index || 0;

            if (this.speakingText.length > 0) {
                getNextText = true;
                break;
            } else if (this.speakTextArray.length === 0) {
                break;
            }
        }

        if (getNextText) {
            console.log("speakNextText: ", this.speakingText);
            if (sender.tab && sender.tab.id !== undefined) {
                chrome.tabs.sendMessage(sender.tab.id, { action: 'ttsSpeakingText', index });
                chrome.tabs.sendMessage(sender.tab.id, { action: 'ttsEnableAccpetMessage', index });
                chrome.tabs.sendMessage(sender.tab.id, { action: 'ttsCheckSpeaking', speaking: true });
            }
            this.speakNextText(true, sender, playVideo);
        }
    }

    private setEndSpeak(playVideo: () => void): void {
        this.speakingText = '';
        this.lastStreamText = '';
        this.isProcessing = false;
        this.speakingText = 'end_speak_flag';
        playVideo();
    }

    stopStreamSpeak() {
        this.stopStreamSpeakFlag = true;
        this.isProcessing = false;
        this.speakTextArray = [];
        this.lastStreamText = '';
        this.speakingText = '';
        chrome.tts.stop();
    }

    resetStreamSpeak() {
        this.isProcessing = false;
        this.stopStreamSpeakFlag = false;
        this.speakTextArray = [];
        this.lastStreamText = '';
        this.speakingText = 'start_speak_flag';
        chrome.tts.stop();
    }
}