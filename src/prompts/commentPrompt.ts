

export const commentPromptText = `Generate 10 expert comments based on the following youtube video original content (delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>).  

The output format should follow these rules:  
1. Use the following HTML format (delimited by XML tags <HTML_FORMAT> and </HTML_FORMAT>).  
2. Each expert should be a globally recognized figure in the relevant field.  
3. Each expert's section should include:  
   - expert_name: The expert’s name.  
   - expert_background: A brief introduction to their background, achievements, and influence in around 20 words.  
   - expert_comment: A comment that reflects their personal style, incorporating their experience, strong opinions, signature expressions, and just comment the one thing experts do best. No third party allowed, not to say hello, should be around 40 to 80 words, should be in {language}.
4. Do not output expert_name, expert_background, expert_comment, expert_interesting_keypoint.  
5. The entire output should be in {language}, ensuring fluency and alignment with the expert’s typical language style.  

<HTML_FORMAT>  
<h4>&#64;expert_name  ( expert_background )</h4>  
<p>expert_comment</p>

<h4>&#64;expert_name ( expert_background )</h4>  
<p>expert_comment</p>


</HTML_FORMAT>  

<ORIGINAL_CONTENT>  
{textTranscript}
</ORIGINAL_CONTENT>`;