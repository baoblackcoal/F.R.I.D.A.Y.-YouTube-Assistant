export interface TTSInterface {
    speak(text: string): void;
    stop(): void;
}