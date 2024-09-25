


export const defaultPromptText = `Summarize the following content(delimited by XML tags <CONTENT> and </CONTENT>) into brief sentences, highlights, and keywords.

The output should follow the following rules:
1. title is the video title, can not be changed but can be translated into {language}.
2. Brief summary of content that is clear, concise insights to enhance the user's understanding.
3. provide 5 to 10 Bullet point highlights with complete explanation, use **highlight keyword** to indicate the highlight keyword.

Your output should follow the following rules:
1. use the following markdown format(delimited by XML tags <MD_FORMAT> and </MD_FORMAT>,  should not output anything else <MD_FORMAT> and </MD_FORMAT>)
2. output is like the following example(delimited by XML tags <MD_EXAMPLE> and </MD_EXAMPLE>)
3. all output should be in {language}.

<MD_FORMAT>
### Title
Brief summary of content
### Highlights
1. **highlight keyword**: highlight 1
2. **highlight keyword**: highlight 2
3. **highlight keyword**: highlight 3
4. **highlight keyword**: highlight 4
5. **highlight keyword**: highlight 5
</MD_FORMAT>

<MD_EXAMPLE>
### Two AI's interacting and singing
This conversation features two AI's interacting. One AI has access to a camera and can see the world, while the other can only ask questions and direct the camera. The AI with vision describes the scene in detail, while the other asks about the style, lighting, and any unusual events. They sing a short song together about the playful interaction that occurred.
### Highlights
1. **AI Vision**: The AI with vision describes the scene in detail, including the person's attire, the room's decor, and the lighting.
2. **AI Direction**: The AI without vision directs the other AI to sing a song about the playful interaction.
3. **Playful Moment**: A playful moment occurs when a surprise guest makes bunny ears behind the first person's head, adding a light-hearted touch to the scene.
4. **Lighting**: The lighting in the scene is a mix of natural and artificial light, creating a dramatic and modern feel.
5. **AI Singing**: The AI's attempt at singing is humorous and highlights the unique capabilities of AI.
</MD_EXAMPLE>

<CONTENT>
{textTranscript}
</CONTENT>`;
