export interface ITtsService {
    speakText(text: string, index: number, sender?: chrome.runtime.MessageSender, playVideo?: () => void): Promise<void>;
    handleStreamText(text: string, index: number, sender?: chrome.runtime.MessageSender, playVideo?: () => void): Promise<void>;
    deleteQueueLargerThanMarkIndex(index: number): void;
    stopStreamSpeak(): void;
    resetStreamSpeak(): void;
}