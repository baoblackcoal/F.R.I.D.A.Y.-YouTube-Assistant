import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { defaultTtsSettings, TtsSettings } from '../common/settings';
import { settingsManager } from '../common/settingsManager';

export interface IMsTtsApi {
    synthesizeSpeech(text: string): Promise<void>;
}

export class MsTtsApi implements IMsTtsApi {
    private static instance: MsTtsApi;
    private speechConfig: sdk.SpeechConfig;
    private audioConfig: sdk.AudioConfig | undefined;
    private synthesizer: sdk.SpeechSynthesizer | undefined;
    private player: sdk.SpeakerAudioDestination | undefined;
    private ttsSettings: TtsSettings = defaultTtsSettings;
    private useDefaultAudioOutput: boolean = false;

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
        this.speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoyuMultilingualNeural";
        this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);

        // settingsManager.getTtsSettings().then(settings => {
        //     this.ttsSettings = settings;
        //     this.updateSynthesizer();
        // });
    }

    private initializeAudioConfig(): void {
        try {
            this.player = new sdk.SpeakerAudioDestination();
            this.audioConfig = sdk.AudioConfig.fromSpeakerOutput(this.player);
        } catch (error) {
            console.warn("Failed to initialize SpeakerAudioDestination. Falling back to default audio output.", error);
            this.useDefaultAudioOutput = true;
            this.audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        }
    }

    private updateSynthesizer(): void {
        // if (this.synthesizer) {
        //     this.synthesizer.close();
        // }
        this.speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoyuMultilingualNeural";
        // this.speechConfig.speechSynthesisVoiceName = this.ttsSettings.voiceName || "zh-CN-XiaoyuMultilingualNeural";
        this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);
    }

    async synthesizeSpeech(text: string): Promise<void> {
        await this.updateTtsSettings();
        const ssml = this.generateSsml(text);
        
        return new Promise(async (resolve, reject) => {
            const callback = (result: sdk.SpeechSynthesisResult) => {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("Synthesis finished: ", text);
                    let audioDurationMs = result.audioDuration / 10000 - 2000;
                    audioDurationMs = Math.max(audioDurationMs, 0);
                    setTimeout(() => {
                        console.log('Audio Play End: Audio playback finished.');
                        resolve();
                    }, audioDurationMs);
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
                        console.error("Error during synthesis 1: ", error);
                        this.synthesizer?.close();
                        this.synthesizer = undefined;
                        reject(error);
                    }
                );
            } catch (error) {
                console.error("Error during synthesis 2: ", error);
                this.synthesizer?.close();
                //reject(error);
            }
        });
    }

    private async updateTtsSettings(): Promise<void> {
        this.ttsSettings = await settingsManager.getTtsSettings();
        this.ttsSettings.voiceName = "zh-CN-XiaoyuMultilingualNeural";
        //this.updateSynthesizer();
    }

    private generateSsml(text: string): string {
        // <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${this.ttsSettings.language}">

        function formatPercentage(value: number): string {
            const percentage = (value - 1) * 100;
            const sign = percentage >= 0 ? '+' : '-';
            return `${sign}${Math.abs(percentage).toFixed(0)}%`;
        }

        const rateString = formatPercentage(this.ttsSettings.rate);
        const pitchString = formatPercentage(this.ttsSettings.pitch);
        // change volume(0-1) to %
        const volumeString = formatPercentage(this.ttsSettings.volume);

        return `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
                <voice name="${this.ttsSettings.voiceName}">
                    <prosody rate="${rateString}" pitch="${pitchString}" volume="${volumeString}">
                        ${text}
                    </prosody>
                </voice>
            </speak>
        `;
    }
}
