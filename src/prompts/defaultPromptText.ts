


export const defaultPromptText = `Summarize the following original content(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into brief sentences, highlights, and keywords.

The output format should follow the following rules:
1. use the following html format(delimited by XML tags <HTML_FORMAT> and </HTML_FORMAT>). 
2. title_content is the video title, that should not be changed any words but can be translated into {language}.
3. brief_summary_of_content is brief summary of original content that is clear, concise insights to enhance the user's understanding, and world size should be about 100 words.
4. provide 5 to 10 Bullet point highlights with complete explanation, highlight_keyword is the keyword for each highlight.

Your output contentshould follow the following rules:
1. should not output anything else like <HTML_FORMAT> and </HTML_FORMAT>
2. all output should be in {language}.

<HTML_FORMAT>
<h3>title_content</h3>
<p>brief_summary_of_content</p>
<h3>Highlights</h3>
<p><strong>highlight_keyword</strong>: highlight_1</p>
<p><strong>highlight_keyword</strong>: highlight_2</p>
<p><strong>highlight_keyword</strong>: highlight_3</p>
<p><strong>highlight_keyword</strong>: highlight_4</p>
<p><strong>highlight_keyword</strong>: highlight_5</p>
</HTML_FORMAT>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>`;

