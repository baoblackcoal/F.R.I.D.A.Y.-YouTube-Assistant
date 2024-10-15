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

        // this.audioConfig = sdk.AudioConfig.fromSpeakerOutput();
        // this.player =new sdk.SpeakerAudioDestination();

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
            async function callback(result: sdk.SpeechSynthesisResult, synthesizer: sdk.SpeechSynthesizer | undefined) {
                // Modify playAudioWithEndDetection to handle audio data from the SDK
                function  playAudioWithEndDetection(audioData: ArrayBuffer) {
                    const audioContext = new (window.AudioContext )();

                    // Convert the audioData (Uint8Array from SDK) to Float32Array for the AudioBuffer
                    const audioBuffer = new Float32Array(audioData); // Directly use the Uint8Array

                    // Create a buffer from the audio data
                    const buffer = audioContext.createBuffer(1, audioBuffer.length, audioContext.sampleRate);
                    buffer.copyToChannel(audioBuffer, 0);

                    // Create a BufferSource for playback
                    const bufferSource = audioContext.createBufferSource();
                    bufferSource.buffer = buffer;

                    // Hook into the onended event to detect when playback finishes
                    bufferSource.onended = function () {
                        console.log("Audio playback has ended.");
                    };

                    // Connect the buffer source to the audio context destination (speakers)
                    bufferSource.connect(audioContext.destination);

                    // Start the playback
                    bufferSource.start();

                    // Wait for playback to end (onended event)
                    return new Promise(resolve => {
                        bufferSource.onended = resolve;
                    });
                }

                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("Synthesis finished: ", text);
                    const audioData = new Uint8Array(result.audioData); // Convert ArrayBuffer to Uint8Array
                    // Calculate  result.audioDuration(100ns unit) of the audio to ms
                    let audioDurationMs = result.audioDuration / 10000;    
                    audioDurationMs = audioDurationMs - 2000; // for synthesis next time
                    if (audioDurationMs < 0) {
                        audioDurationMs = 0;
                    }
                    console.log(`Estimated audio duration: ${audioDurationMs} ms`);

                    // Set a timeout to simulate the Audio Play End event
                    setTimeout(() => {
                        console.log('Audio Play End: Audio playback finished.');        
                        // this.audioEnd = false;                
                        resolve();
                    }, audioDurationMs); // Wait for the estimated duration
        
                    // playAudioWithEndDetection(audioData); // Modify playAudioWithEndDetection to accept audio data

                    // resolve();
                } else {
                    console.log("Speech synthesis canceled: ", result.errorDetails);
                }

                synthesizer?.getVoicesAsync().then(result => {
                    
                    console.log("result: ", result);
                });

                // synthesizer?.close(); // Important: close the synthesizer to trigger `onAudioEnd`
                // synthesizer = undefined;
            }
            
            //wait previous synthesis finished
            console.log("Waiting for previous synthesis to finish");
            // while (!this.audioEnd) {
            //     await new Promise(resolve => setTimeout(resolve, 100));
            // }
            this.audioEnd = false;

            if (!this.player) {
                sdk.SpeakerAudioDestination
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
            }

            if (!this.audioConfig) {
                this.audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
            }
            if (!this.synthesizer) {
                this.synthesizer = new sdk.SpeechSynthesizer(this.speechConfig, this.audioConfig);
            }


            this.synthesizer.synthesisCompleted = (sender, event) => {
                
                console.log("Synthesis completed: ", event);
            };
            this.synthesizer.synthesisStarted = (sender, event) => {
                console.log("Synthesis started: ", event);
            };
            this.synthesizer.SynthesisCanceled = (sender, event) => {
                console.log("Synthesis canceled: ", event);
            };  
            this.synthesizer.wordBoundary = (sender, event) => {
                console.log("Word boundary: ", event);
            };
            this.synthesizer.bookmarkReached = (sender, event) => {
                console.log("Bookmark reached: ", event);
            };
            this.synthesizer.visemeReceived = (sender, event) => {
                console.log("Viseme received: ", event);
            };
            this.synthesizer.synthesizing = (sender, event) => {
                console.log("Synthesizing: ", event);
            };
           

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

