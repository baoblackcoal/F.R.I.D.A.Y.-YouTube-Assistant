// Define the TTS settings interface
export interface TtsSettings {
  language: string;
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
}

// Default TTS settings
export const defaultTtsSettings: TtsSettings = {
  language: '',
  voiceName: '',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
};