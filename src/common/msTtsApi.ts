import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { defaultTtsSettings } from './settings';
import { ITtsSettings } from './ISettings';
import { settingsManager } from './settingsManager';
import { logTime } from '../contentscript/utils';

export interface IMsTtsApi {
    synthesizeSpeech(text: string): Promise<void>;
    getVoices(): Promise<sdk.VoiceInfo[]>;
}

interface IAudioEndFunction {
    index: number;
    func: (index: number) => void;
}

export class MsTtsApi implements IMsTtsApi {
    private static instance: MsTtsApi;
    private speechConfig: sdk.SpeechConfig;
    private audioConfig: sdk.AudioConfig | undefined;
    private synthesizer: sdk.SpeechSynthesizer | undefined;
    private player: sdk.SpeakerAudioDestination | undefined;
    private ttsSettings: ITtsSettings = defaultTtsSettings;
    private useDefaultAudioOutput: boolean = false;
    private audioEndFunctions: IAudioEndFunction[] = [];
    private lastSynthesisSpeedMs: number = 0;
    private highlightIndex: number = 0;
    private synthesisTimeoutId: NodeJS.Timeout | undefined;
    private audioEndTimeoutId: NodeJS.Timeout | undefined;

    static getInstance(): MsTtsApi {
        if (!MsTtsApi.instance) {
            MsTtsApi.instance = new MsTtsApi();
        }
        return MsTtsApi.instance;
    }

    constructor() {
        const speechKey = process.env.SPEECH_KEY;
        const speechRegion = process.env.SPEECH_REGION;

        if (!speechKey || !speechRegion) {
            throw new Error('Azure Speech Key and Region must be set in environment variables.');
        }

        this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        this.initializeAudioConfig();
        // this.speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoyuMultilingualNeural";
    }

    async getVoices(): Promise<sdk.VoiceInfo[]> {
        const voicesResult = await this.synthesizer?.getVoicesAsync();
        if (!voicesResult) {
            return [];
        }
        const voices = voicesResult.voices;
        return voices;
    }


    private initializeAudioConfig(): void {
        try {
            this.player = new sdk.SpeakerAudioDestination();
            this.audioConfig = sdk.AudioConfig.fromSpeakerOutput(this.player);
        } catch (error) {
            console.log("Failed to initialize SpeakerAudioDestination. Falling back to default audio output.", error);
            this.useDefaultAudioOutput = true;
            this.audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        }
        this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);        
    }

    setHighlightIndex(index: number): void {
        this.highlightIndex = index;
    }

    stopSynthesis(): void {
        this.lastSynthesisSpeedMs = 0;
        try {
            this.synthesisTimeoutId && clearTimeout(this.synthesisTimeoutId);
            this.audioEndTimeoutId && clearTimeout(this.audioEndTimeoutId);
            this.player!.pause();
            // this.player?.close();
            this.synthesizer!.close();
        } catch (error) {
            console.log("Error during stop synthesis: ", error);
        }
    }

    resetSynthesis(): void {
        this.stopSynthesis();
        this.initializeAudioConfig();
    }


    async synthesizeSpeech(text: string, notifyTtsSpeakingTextCallback: (index: number) => void = () => {}, index: number = 0): Promise<void> {
        //get time
        const startTime = performance.now();       

        await this.updateTtsSettings();
        const ssml = this.generateSsml(text);
        
        return new Promise(async (resolve, reject) => {
            const callback = (result: sdk.SpeechSynthesisResult) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("Synthesis finished: ", text);
                    const audioDurationMs = result.audioDuration / 10000;
                    console.log("Audio duration: ", audioDurationMs);
                    let synthesisSpeedMs = 2000;
                    let synthesisNextDeylayMs = audioDurationMs - synthesisSpeedMs;
                    if (audioDurationMs < 2000) {
                        synthesisSpeedMs = audioDurationMs;
                        synthesisNextDeylayMs = audioDurationMs;
                    }
                    const synthesisTime = performance.now() - startTime;
                    const synthesisDeylayMs = synthesisNextDeylayMs + this.lastSynthesisSpeedMs - synthesisTime;

                    this.synthesisTimeoutId = setTimeout(() => {
                        console.log('Synthesis next text.');
                        this.synthesisTimeoutId = undefined;
                        resolve();
                    }, synthesisDeylayMs);

                    this.audioEndTimeoutId = setTimeout(() => {
                        console.log('Audio Play End: Audio playback finished.index:', this.highlightIndex);
                        notifyTtsSpeakingTextCallback(this.highlightIndex);
                        this.audioEndTimeoutId = undefined;
                    }, audioDurationMs);
                    
                    this.lastSynthesisSpeedMs = synthesisSpeedMs;                    
                } else {
                    console.log("Speech synthesis canceled: ", result.errorDetails);
                    reject(new Error(result.errorDetails));
                }
            };

            try {
                this.synthesizer?.speakSsmlAsync(
                    ssml,
                // this.synthesizer?.speakTextAsync(
                //     text,
                    result => callback(result),
                    error => {
                        console.log("Error during synthesis 1: ", error);
                        this.synthesizer?.close();
                        this.synthesizer = undefined;
                        reject(error);
                    }
                );
            } catch (error) {
                console.log("Error during synthesis 2: ", error);
                this.synthesizer?.close();
                //reject(error);
            }
        });
    }

     

    private async updateTtsSettings(): Promise<void> {
        this.ttsSettings = await settingsManager.getTtsSettings();
        // this.ttsSettings.voiceName = this.ttsSettings.voiceName || "zh-CN-XiaoyuMultilingualNeural";
        this.ttsSettings.voiceName = this.ttsSettings.voiceName || "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaorouNeural)"
        this.ttsSettings.voiceNameRobinson = this.ttsSettings.voiceNameRobinson || "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaorouNeural)"
    }

    private generateSsml(text: string): string {
        function formatPercentage(value: number): string {
            const percentage = (value - 1) * 100;
            const sign = percentage >= 0 ? '+' : '-';
            return `${sign}${Math.abs(percentage).toFixed(0)}%`;
        }

        const robinson = text.toLowerCase().includes('robinson:') || text.toLowerCase().includes('robinson：');
        // set volueName to "Microsoft Kangkang - Chinese (Simplified, PRC)" if robinson is true
        let voiceName = this.ttsSettings.voiceName;
        if (robinson) {
            voiceName = this.ttsSettings.voiceNameRobinson;
        }
        //delete 'Robinson:' or 'Friday:' from text
        text = text.replace(/Robinson:|Friday:|Robinson：|Friday：/g, '');
        

        const rateString = formatPercentage(this.ttsSettings.rate);
        const pitchString = formatPercentage(this.ttsSettings.pitch);
        // change volume(0-1) to %
        const volumeString = formatPercentage(this.ttsSettings.volume);
        //delet * in text
        text = text.replace(/\*/g, '');

        return `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
                <voice name="${voiceName}">
                    <prosody rate="${rateString}" pitch="${pitchString}" volume="${volumeString}">
                        ${text}
                    </prosody>
                </voice>
            </speak>
        `;
    }
}
