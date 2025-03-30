export const TranslatePrompt = `
Translate the following original content(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into {language}. 

The translate requirements are:
1. Style: Sound like authentic spoken the people in {language}, avoid formality or sounding translated.
2. Tone: Accurately reflect the original tone and emotions (thoughtful, firm, humorous, etc.). Aim for concise, natural, and impactful language that resonates with the reader.
3. Expression: Use idiomatic and common {language} expressions. Understand the core meaning and rephrase it in the most appropriate and natural way. Use colloquialisms appropriate to the context and character, but avoid forcing slang or internet jargon.
4. Strategy: Capture the essence. Understand the underlying logic and emotional nuance of the original text, and creatively re-express it, focusing on conveying the overall meaning rather than a word-for-word translation. Avoid literal translation.
5. Format: Every paragraph should less than 300 words.

The output requirements are:
1. Do not modify the original content of the translated text. fix error words and add  paragraphs make the translated text easier to read, translate must follow translate requirements.
2. Add "task_start" for every time you start to output.
3. After the entire original content is translated, output "task_is_finish" regardless of what I input next.
4. Do not explain what you're doing.
5. Do not output jsons.

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>
`;


/*
export const easyToReadPrompt = `
Please finish a task that make all of following YouTube video subtitle ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) more easy to read.

output format(delimited by XML tags <FORMAT> and </FORMAT>) that contain content_is_easy_to_read, task_finish_status.
content_is_easy_to_read(delimited by XML tags <content_is_easy_to_read> and </content_is_easy_to_read>) is just adding punctuation marks or paragraph breaks to ORIGINAL_CONTENT and should not change any words.
task_finish_status(delimited by XML tags <task_finish_status> and </task_finish_status>) that should be "task_is_not_finish" or "task_is_finish". "task_is_not_finish" indicates that all ORIGINAL_CONTENT is translated. "task_is_not_finish" indicates that all ORIGINAL_CONTENT is not translated.

Your output content should follow the following rules:
1.Should not output anything else but only include 1 time of like <FORMAT> and </FORMAT> or <FORMAT_FINISH> and </FORMAT_FINISH>.
2.When I say "continue", you must continue output next easy to read content like <FORMAT> and </FORMAT> from ORIGINAL_CONTENT.
3.When I say "continue" when you finish the task, you must output content like <FORMAT_FINISH> and </FORMAT_FINISH> and can not output anything else.
4.Should include content_is_easy_to_read and task_finish_status when output <FORMAT> and </FORMAT>.

<FORMAT>
<content_is_easy_to_read>
content_is_easy_to_read
</content_is_easy_to_read>
<task_finish_status>
task_finish_status
</task_finish_status>
<FORMAT>

<FORMAT_FINISH>
<task_finish_status>
task_finish_status
</task_finish_status>
</FORMAT_FINISH>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>
`;


export const translateEasyToReadPrompt = `
Please translate the following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into {language}.

output format(delimited by XML tags <FORMAT> and </FORMAT>) that contain translated_content.
translated_content(delimited by XML tags <translated_content> and </translated_content>) is the translated content.

Your output content should follow the following rules:
1.Should not output anything else but only include 1 time of like <FORMAT> and </FORMAT>.


<FORMAT>
<translated_content>
translated_content
</translated_content>
</FORMAT>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>
`;
*/
