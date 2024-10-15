import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


export interface IMsTtsApi {
    synthesizeSpeech(text: string): Promise<void>;
}


export class MsTtsApi implements IMsTtsApi {
    private static instance: MsTtsApi;
    private speechConfig: sdk.SpeechConfig;
    private audioConfig: sdk.AudioConfig | undefined;
    private synthesizer: sdk.SpeechSynthesizer | undefined;
    private player: sdk.SpeakerAudioDestination | undefined;

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

        this.player =new sdk.SpeakerAudioDestination();

        this.audioConfig = sdk.AudioConfig.fromSpeakerOutput(this.player);    
        this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);       

        this.synthesizer?.getVoicesAsync().then(result => {                    
            console.log("result: ", result);
        });
    }    

    async synthesizeSpeech(text: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            async function callback(result: sdk.SpeechSynthesisResult, synthesizer: sdk.SpeechSynthesizer | undefined) {
                
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("Synthesis finished: ", text);
                    // Calculate  result.audioDuration(100ns unit) of the audio to ms
                    let audioDurationMs = result.audioDuration / 10000;    
                    audioDurationMs = audioDurationMs - 2000; // for synthesis next time
                    if (audioDurationMs < 0) {
                        audioDurationMs = 0;
                    }                    
                    // console.log(`Estimated audio duration: ${audioDurationMs} ms`);
                    // Set a timeout to simulate the Audio Play End event
                    setTimeout(() => {
                        console.log('Audio Play End: Audio playback finished.');        
                        resolve();
                    }, audioDurationMs); // Wait for the estimated duration        
                } else {
                    console.log("Speech synthesis canceled: ", result.errorDetails);
                }
            }
            
            console.log("Starting new synthesis");
            try {
                this.synthesizer?.speakTextAsync(
                    text,
                    result => callback(result, this.synthesizer),
                    error => {
                        console.error("Error during synthesis1: ", error);
                        this.synthesizer?.close();
                        this.synthesizer = undefined;
                        reject(error);
                    }
                );
            } catch (error) {
                console.error("Error during synthesis2: ", error);
                this.synthesizer?.close();
                // reject(error);
            }

        });
    }
}

