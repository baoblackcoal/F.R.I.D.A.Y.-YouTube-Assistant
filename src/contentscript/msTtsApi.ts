import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


export interface IMsTtsApi {
    synthesizeSpeech(text: string): Promise<void>;
}

export class MsTtsApi implements IMsTtsApi {
    private static instance: MsTtsApi;
    private speechConfig: sdk.SpeechConfig;
    private audioConfig: sdk.AudioConfig;
    private synthesizer: sdk.SpeechSynthesizer;

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
        // this.speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";
        this.speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoyuMultilingualNeural";
        this.audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
        this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);

    }

    async synthesizeSpeech(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            
            this.synthesizer.speakTextAsync(
                text,
                async result => {
                    if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                        console.log("Synthesis finished: ", text);
                        resolve();
                    } else {
                        console.error("Speech synthesis canceled: ", result.errorDetails);
                        reject(new Error(result.errorDetails));
                        this.synthesizer.close();
                    }
                },
                error => {
                    console.error("Error during synthesis: ", error);
                    this.synthesizer.close();
                    reject(error);
                }
            );
        });
    }
}

