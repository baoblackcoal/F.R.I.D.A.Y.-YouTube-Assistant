export function getLangOptionsWithLink(videoId: string): Promise<{ link: string }[]>;
export function getRawTranscriptText(link: string): Promise<string>;
export async function getTranscriptHTML(link: string, videoId: string): Promise<string>;
