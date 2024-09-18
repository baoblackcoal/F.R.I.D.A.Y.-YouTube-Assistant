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

// Default summary settings
export interface SummarySettings {
  promptType: number; // 0: default, 1: diy1, 2: diy2, 3: diy3
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
}

export const defaultPromptText = `Summarize the following CONTENT(delimited by XML tags <CONTENT> and </CONTENT>) into brief sentences of key points, then provide complete highlighted information in a list, choosing an appropriate emoji for each highlight.
Your output should use the following format: 
### Title
{videoTitle}
### keyword
Include 3 to 5 keywords, those are incorporating trending and popular search terms.
### Summary
{brief summary of this content}
### Highlights
- [Emoji] Bullet point with complete explanation

<CONTENT>
{textTranscript}
</CONTENT>`;

export const defaultSummarySettings: SummarySettings = {
  promptType: 0,
  diyPromptText1: "Summarize the video titled '{videoTitle}' with the following transcript:\n\n{textTranscript}",
  diyPromptText2: "Create a bullet-point summary of the key points from this video:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
  diyPromptText3: "Analyze the main themes and ideas in this video:\n\n{videoTitle}\n\n{textTranscript}",
};