import * as sdk from 'microsoft-cognitiveservices-speech-sdk';


export interface IMsTtsApi {
    synthesizeSpeech(text: string): Promise<void>;
}


export class MsTtsApi implements IMsTtsApi {
    private static instance: MsTtsApi;
    private speechConfig: sdk.SpeechConfig;
    private audioConfig: sdk.AudioConfig;
    private synthesizer: sdk.SpeechSynthesizer | undefined;
    private player: sdk.SpeakerAudioDestination;
    private audioEnd = true;

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

        this.audioConfig = sdk.AudioConfig.fromSpeakerOutput();
        this.player =new sdk.SpeakerAudioDestination();

        // The synthesis started event signals that the synthesis is started.
        // this.synthesizer.synthesisStarted = function (s, e) {
        //     console.log("(synthesis started)" + "\r\n");
        //   };
  
        //   // The event synthesis completed signals that the synthesis is completed.
        //   this.synthesizer.synthesisCompleted = function (s, e) {
        //     console.log("(synthesized)  Reason: " + sdk.ResultReason[e.result.reason] +
        //             " Audio length: " + e.result.audioData.byteLength + "\r\n");
        //   };
        //   // The event signals that the service has stopped processing speech.
        //   // This can happen when an error is encountered.
        // this.synthesizer.SynthesisCanceled = function (s, e) {
        //     const cancellationDetails = sdk.CancellationDetails.fromResult(e.result);
        //     let str = "(cancel) Reason: " + sdk.CancellationReason[cancellationDetails.reason];
        //     if (cancellationDetails.reason === sdk.CancellationReason.Error) {
        //       str += ": " + e.result.errorDetails;
        //     }
        //     console.log(e);
        //   };
    }

    async synthesizeSpeech(text: string): Promise<void> {
        return new Promise(async (resolve, reject) => {
            function callback(result: sdk.SpeechSynthesisResult, synthesizer: sdk.SpeechSynthesizer | undefined) {
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("Synthesis finished: ", text);
                    // resolve();
                } else {
                    console.log("Speech synthesis canceled: ", result.errorDetails);
                }

                synthesizer?.close(); // Important: close the synthesizer to trigger `onAudioEnd`
                synthesizer = undefined;
            }
            
            //wait previous synthesis finished
            console.log("Waiting for previous synthesis to finish");
            while (!this.audioEnd) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this.audioEnd = false;

            this.player =new sdk.SpeakerAudioDestination();
            this.player.onAudioStart = () => {
                console.log("Audio playback has started.");
            };
            this.player.onAudioEnd = () => {
                console.log("Audio playback has ended.");
                this.audioEnd = true;
                resolve();
                console.log("Audio playback has ended. 1");
            };
            this.audioConfig = sdk.AudioConfig.fromSpeakerOutput(this.player);
            this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);

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

