export const summaryDefaultPromptText = `
Summarize the following original content(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into brief sentences, highlights, and keywords in {language}.

The output format should follow the following rules:
1. use the following html format(delimited by XML tags <HTML_FORMAT> and </HTML_FORMAT>). 
2. title_content is the video title.
3. brief_summary_of_content is brief summary of original content that is clear, concise insights to enhance the user's understanding, and world size should be about 100 words.
4. provide 5 to 8 Bullet point highlights with complete explanation, highlight_keyword is the keyword for each highlight.

Your output contentshould follow the following rules:
1. should not output anything else like <HTML_FORMAT> and </HTML_FORMAT>
2. all output should be in {language}.

<HTML_FORMAT>
<h3>title_content</h3>
brief_summary_of_content

<h3>Highlights</h3>
1 **highlight_keyword**: highlight_1
2 **highlight_keyword**: highlight_2

</HTML_FORMAT>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>`;


export const summaryDiy1PromptText = `
Summarize the following original content(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into brief sentences, highlights, and keywords in {language}.

The output format should follow the following rules:
1. use the following html format(delimited by XML tags <HTML_FORMAT> and </HTML_FORMAT>). 
2. title_content is the video title.
3. brief_summary_of_content is brief summary of original content that is clear, concise insights to enhance the user's understanding, and world size should be about 100 words.

Your output contentshould follow the following rules:
1. should not output anything else like <HTML_FORMAT> and </HTML_FORMAT>
2. all output should be in {language}.

<HTML_FORMAT>
<h3>title_content</h3>
brief_summary_of_content
</HTML_FORMAT>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>`;

