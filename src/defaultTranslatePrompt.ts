export const defaultTranslatePrompt = `
Please finish a task that make all of following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) more easy to read in {language}.

the following is output format(delimited by XML tags <FORMAT> and </FORMAT>).
content_is_easy_to_read(delimited by XML tags <content_is_easy_to_read> and </content_is_easy_to_read>) is just adding punctuation marks or line breaks '\n' to ORIGINAL_CONTENT and should not change any words.
task_finish_status(delimited by XML tags <task_finish_status> and </task_finish_status>) that should be "task_is_not_finish" or "task_is_finish". "task_is_not_finish" indicates that all ORIGINAL_CONTENT is translated. "task_is_not_finish" indicates that all ORIGINAL_CONTENT is not translated.

Your output content should follow the following rules:
1.should output 500 words every your response , becasue your output size is limited.
2.should not output anything else but only include 1 time of like <FORMAT> and </FORMAT> or <FORMAT_FINISH> and </FORMAT_FINISH>.
3.when I say "continue", you must continue output next 500 easy to read words content like <FORMAT> and </FORMAT> from ORIGINAL_CONTENT.
4.when I say "continue" when you finish the task, you must output content like <FORMAT_FINISH> and </FORMAT_FINISH> and can not output anything else.
5.maximum words of each paragraph should less than 100 words.
6.all output should be in {language}.

<FORMAT>
{{content_is_easy_to_read}}
content_is_easy_to_read
{{/content_is_easy_to_read}}

{{task_status}}
task_finish_status
{{/task_status}}
<FORMAT>

<FORMAT_FINISH>
{{content_is_easy_to_read}}
task_is_finish
{{/content_is_easy_to_read}}

{{task_status}}
task_finish_status
{{/task_status}}
</FORMAT_FINISH>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>
`;
