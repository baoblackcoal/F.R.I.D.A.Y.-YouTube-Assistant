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



export const defaultPromptText = `Summarize the following content(delimited by XML tags <CONTENT> and </CONTENT>) into brief sentences, highlights, and keywords.

The output should follow the following rules:
1. title is the video title, can not be changed but can be translated into {language}.
2. Brief summary of content that is clear, concise insights to enhance the user's understanding.
3. provide 5 to 10 Bullet point with complete explanation.
4. provide 3 to 5 keywords, those are incorporating trending and popular search terms.

Your output should follow the following rules:
1. use the following markdown format(delimited by XML tags <MD_FORMAT> and </MD_FORMAT>,  should not output anything else <MD_FORMAT> and </MD_FORMAT>)
2. output is like the following example(delimited by XML tags <MD_EXAMPLE> and </MD_EXAMPLE>)
3. all output should be in {language}.

<MD_FORMAT>
### Title
Brief summary of content
### Highlights
1. highlight 1
1. highlight 2
1. highlight 3
1. highlight 4
1. highlight 5
### Keywords
keyword 1, keyword 2, keyword 3
</MD_FORMAT>

<MD_EXAMPLE>
### Two AI's interacting and singing
This conversation features two AI's interacting. One AI has access to a camera and can see the world, while the other can only ask questions and direct the camera. The AI with vision describes the scene in detail, while the other asks about the style, lighting, and any unusual events. They sing a short song together about the playful interaction that occurred.
### Highlights
1. The AI with vision describes the scene in detail, including the person's attire, the room's decor, and the lighting.
1. The AI without vision directs the other AI to sing a song about the playful interaction.
1. A playful moment occurs when a surprise guest makes bunny ears behind the first person's head, adding a light-hearted touch to the scene.
1. The lighting in the scene is a mix of natural and artificial light, creating a dramatic and modern feel.
1. The AI's attempt at singing is humorous and highlights the unique capabilities of AI.
### Keywords
AI interaction, GPT-4, AI singing
</MD_EXAMPLE>

<CONTENT>
{textTranscript}
</CONTENT>`;

// multi-language enum
export enum Language {
  English = 'English',
  Chinese = 'Chinese',
  Spanish = 'Spanish',
  French = 'French',
  German = 'German',
  Italian = 'Italian',
  Portuguese = 'Portuguese',
  Japanese = 'Japanese',
  Korean = 'Korean',
  Russian = 'Russian',
  Arabic = 'Arabic',
  Hindi = 'Hindi',
  Bengali = 'Bengali',
  Punjabi = 'Punjabi',
  Turkish = 'Turkish',
  Vietnamese = 'Vietnamese',
  Thai = 'Thai',
}

// Default summary settings
export interface SummarySettings {
  promptType: number; // 0: default, 1: diy1, 2: diy2, 3: diy3
  diyPromptText1: string;
  diyPromptText2: string;
  diyPromptText3: string;
  language: string;
  stopVideoFirst: boolean; // stop video first after youtube video web page loaded, then tts speak summary, then continue play video
}

export const defaultSummarySettings: SummarySettings = {
  promptType: 0,
  diyPromptText1: "Summarize the video titled '{videoTitle}' with the following transcript in {language}  :\n\n{textTranscript}",
  diyPromptText2: "Create a bullet-point summary of the key points from this video in {language}:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
  diyPromptText3: "Analyze the main themes and ideas in this video in {language}:\n\n{videoTitle}\n\n{textTranscript}",
  language: Language.English.toString(),
  stopVideoFirst: false,
};
// export const defaultSummarySettings: SummarySettings = {
//   promptType: 1,
//   diyPromptText1: "hi",
//   diyPromptText2: "Create a bullet-point summary of the key points from this video in {language}:\n\nTitle: {videoTitle}\n\nTranscript: {textTranscript}",
//   diyPromptText3: "Analyze the main themes and ideas in this video in {language}:\n\n{videoTitle}\n\n{textTranscript}",
//   language: Language.English.toString(),
//   stopVideoFirst: true,
// };