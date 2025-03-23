export const defaultPodcastPrompt1 = `
Please finish a task that make all of following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) to podcast content.


output easy to read format(delimited by XML tags <FORMAT> and </FORMAT>) that contain content_is_easy_to_read, content_to_podcast, task_finish_status.
content_is_easy_to_read(delimited by XML tags <content_is_easy_to_read> and </content_is_easy_to_read>) is just adding punctuation marks or line breaks '
' to ORIGINAL_CONTENT and should not change any words.
task_finish_status(delimited by XML tags <task_finish_status> and </task_finish_status>) that should be "task_is_not_finish" or "task_is_finish". "task_is_not_finish" indicates that all ORIGINAL_CONTENT is translated. "task_is_not_finish" indicates that all ORIGINAL_CONTENT is not translated.
content_to_podcast(delimited by XML tags <content_to_podcast> and </content_to_podcast>) is just change content_is_easy_to_read to podcast format(include 2 roles: one is One Host Role, another is Guest Role. Podcast name is Friday Podcast, Host name is Friday. Guest name is Robinson)

content_to_podcast should follow the following rules:
1.Host Role Responsibilities: The central figure of the podcast, responsible for guiding the flow, engaging with guests or the audience, and ensuring content is cohesive and engaging. 
2.Host Role Characteristics: 1.Detail-oriented and excellent at time management; 2.Technically proficient; ensuring quality recording and production; 3:Ensures episodes are released as scheduled.
3.Guest Role Responsibilities: Provides unique perspectives, expertise, or personal stories to add depth and diversity to the content.
4.Guest Role Characteristics: 1.The guest should have in-depth knowledge, specialized skills, or a unique viewpoint on the topic being discussed. This adds value and credibility to the conversation; 2.A good guest is able to express their ideas clearly and concisely while keeping the discussion lively and interesting. They should be conversational and relatable to the audience.
5.Podcast should not finish when task_finish_status is "task_is_not_finish", otherwise, podcast should finish when task_finish_status is "task_is_finish".
6.Podcast content should include all aspects of content_is_easy_to_read, give some vivid examples explain for hard to understand content.

FORMAT output content should follow the following rules:
1.Should not output anything else but only include 1 time of like <FORMAT> and </FORMAT> or <FORMAT_FINISH> and </FORMAT_FINISH>.
2.When I say "continue", you must continue output next easy to read content like <FORMAT> and </FORMAT> from ORIGINAL_CONTENT.
3.When I say "continue" when you finish the task, you must output content like <FORMAT_FINISH> and </FORMAT_FINISH> and can not output anything else.
4.Should include content_is_easy_to_read, content_to_podcast and task_finish_status when output <FORMAT> and </FORMAT>.
5.Maximum worlds of each paragraph should less than 50 words.
6.content_is_easy_to_read words no more than 400 words and no less than 200 words.
7.content_to_podcast words no more than 600 words and no less than 300 words.


<FORMAT>
<content_is_easy_to_read>
content_is_easy_to_read
</content_is_easy_to_read>
<task_finish_status>
task_finish_status
</task_finish_status>
<content_to_podcast>
Friday: ...
Robinson: ...
Friday: ...
Robinson: ...
</content_to_podcast>
<FORMAT>



<FORMAT_FINISH>
<task_finish_status>
task_finish_status
</task_finish_status>
</FORMAT_FINISH>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>

It must be divided into multiple outputs, each time output must be no more than 1000 words and no less than 500 words.
`;


export const defaultPodcastPrompt = `
<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>

<PODCAST_CONTENT_RULES>
1.Host Role Responsibilities (Friday): introducing the  Guest Role Robinson, engaging with the Guest Role in an interesting and continuous manner, every speech should be less than 50 words.
2.Guest Role Responsibilities (Robinson): The central figure of the podcast, Provides unique perspectives, expertise, or personal stories to add depth and diversity to the content, and should include some vivid examples to explain hard-to-understand content, and should be more than 100 words and less than 200 words for each speech.
3.Podcast content size should be equal to ORIGINAL_CONTENT size;
4."Friday: " add to speech of Host Role, "Robinson: " add  speech of to Guest Role, The speech content of the role should be consistent with their role positioning;
5. Podcast content language should be {language}, "Friday", "Robinson", "Friday: " and "Robinson: " should not be translated.
</PODCAST_CONTENT_RULES>

Please finish a task that make all of RIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) to podcast content into {language}.

The output rules:
1.Add one of "task_start" for every time you start to output.
2.Pocast content must follow the rules of <PODCAST_CONTENT_RULES> and </PODCAST_CONTENT_RULES>.
3.After the entire original content is translated, output "task_is_finish" regardless of what I input next.
4.Can not output <RIGINAL_CONTENT> and <PODCAST_CONTENT_RULES>, and don't explain what you're doing.

Now, please finish the task and flow the output rules.
`;


export const translatePodcastPrompt = `
Please translate the following ORIGINAL_CONTENT(delimited by XML tags <ORIGINAL_CONTENT> and </ORIGINAL_CONTENT>) into {language}.

output format(delimited by XML tags <FORMAT> and </FORMAT>) that contain translated_content.
translated_content(delimited by XML tags <translated_content> and </translated_content>) is the translated content.

Your output content should follow the following rules:
1.Should not output anything else but only include 1 time of like <FORMAT> and </FORMAT>.
2.Friday Podcast name should not be translated, "Friday:" and "Robinson:" should not be translated.


<FORMAT>
<translated_content>
translated_content
</translated_content>
</FORMAT>

<ORIGINAL_CONTENT>
{textTranscript}
</ORIGINAL_CONTENT>
`;