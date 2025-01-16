import { defaultTtsSettings } from "../common/settings";
import { ITtsSettings } from "../common/ISettings";
import { ISettingsManager } from "../common/settingsManager";
import { ITtsService } from "../common/ITtsService";

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
    private ttsSettings: ITtsSettings = defaultTtsSettings;
    private speakingText: string = ''; 
    private firstSpeakToStartTts: boolean = true; //set tts content to ' ' when first speak, because speakingText is empty and set speakingText after tts got end event.


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

        while (this.speakTextArray.length > 0 || this.firstSpeakToStartTts || this.speakingText !== '') {      
            let text = '';  
            if (this.firstSpeakToStartTts) {
                text = ' ';
                this.firstSpeakToStartTts = false;
            } else {
                text = this.speakingText;
            }
            
            const robinson = text.toLowerCase().includes('robinson:') || text.toLowerCase().includes('robinson：');
            // set volueName to "Microsoft Kangkang - Chinese (Simplified, PRC)" if robinson is true
            let voiceName = this.ttsSettings.voiceName;
            if (robinson) {
                voiceName = this.ttsSettings.voiceNameRobinson;
            }
            //delete 'Robinson:' or 'Friday:' from text
            text = text.replace(/Robinson:|Friday:|Robinson：|Friday：/g, '');
            chrome.tts.speak(text, {
                rate: this.ttsSettings.rate,
                pitch: this.ttsSettings.pitch,
                volume: this.ttsSettings.volume,
                voiceName: voiceName,
                onEvent: (event: chrome.tts.TtsEvent) => this.handleTtsEvent(event, sender, playVideo)
            });
            

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
            this.isProcessing = false;
            this.speakNextText(true, sender, playVideo);
        }
    }

    private setEndSpeak(playVideo: () => void): void {
        this.speakingText = '';
        this.lastStreamText = '';
        this.isProcessing = false;
        this.firstSpeakToStartTts = false;
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
        this.firstSpeakToStartTts = true;
        chrome.tts.stop();
    }

}