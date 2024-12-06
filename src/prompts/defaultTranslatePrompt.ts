export const easyToReadPrompt = `
Please finish a task that make all of following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) more easy to read.

output format(delimited by XML tags <FORMAT> and </FORMAT>) that contain content_is_easy_to_read, task_finish_status.
content_is_easy_to_read(delimited by XML tags <content_is_easy_to_read> and </content_is_easy_to_read>) is just adding punctuation marks or line breaks '
' to ORIGINAL_CONTENT and should not change any words.
task_finish_status(delimited by XML tags <task_finish_status> and </task_finish_status>) that should be "task_is_not_finish" or "task_is_finish". "task_is_not_finish" indicates that all ORIGINAL_CONTENT is translated. "task_is_not_finish" indicates that all ORIGINAL_CONTENT is not translated.

Your output content should follow the following rules:
1.Should not output anything else but only include 1 time of like <FORMAT> and </FORMAT> or <FORMAT_FINISH> and </FORMAT_FINISH>.
2.When I say "continue", you must continue output next easy to read content like <FORMAT> and </FORMAT> from ORIGINAL_CONTENT.
3.When I say "continue" when you finish the task, you must output content like <FORMAT_FINISH> and </FORMAT_FINISH> and can not output anything else.
4.Should include content_is_easy_to_read and task_finish_status when output <FORMAT> and </FORMAT>.
5.Maximum worlds of each paragraph should less than 50 tokens.

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

Each time you output no more than 2000 words and no less than 500, divided into multiple outputs.
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

