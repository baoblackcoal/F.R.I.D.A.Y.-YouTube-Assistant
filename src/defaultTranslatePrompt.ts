export const defaultTranslatePrompt = `
Please finish a task that make following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) more easy to read in {language}.

The output format should follow the following rules:
1. should output 500 words every your response follow format(delimited by XML tags <FORMAT> and </FORMAT>), becasue your output size is limited.
2. content is easy to read (delimited by tags {{content_is_easy_to_read}} and {{/content_is_easy_to_read}}) that should not modify the original words, but change error words, add New Line Symbol for split paragraph or excpet {language} != ORIGINAL_CONTENT language.
3. task_finish_status(delimited by tags {{task_status}} and {{/task_status}}) that should be "task_is_not_finish" or "task_is_finish". "task_is_not_finish" meas you have not finish the task, "task_is_finish" meas you have finish the task.

Your output content should follow the following rules:
1. should not output anything else like <FORMAT> and </FORMAT>.
2. when I say "continue", you must continue output content like <FORMAT> and </FORMAT>.
3. when I say "continue" when you finish the task, you must output content like <FORMAT_FINISH> and </FORMAT_FINISH> and can not output anything else.
4. your ouput should be include just include 1 time of <FORMAT> and </FORMAT> or <FORMAT_FINISH> and </FORMAT_FINISH>.
5. all output should be in {language}.

<FORMAT>
{{content_is_easy_to_read}}
content is easy to read.
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
