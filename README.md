## Quickly provide multilingual summaries of YouTube videos. This is achieved through the following methods:

1. Utilize local or database to store video summaries. The browser extension will prioritize displaying matching video summaries. If no corresponding summary is found in the database, it will call an LLM (Language Learning Model) to generate a summary and store.
2. The browser extension will also collect 10 recommended videos to database, summarize them in parallel, and store the summaries in the local or database.

####  [Project Plan And Status](https://github.com/users/baoblackcoal/projects/2/views/1)

### Start the Project from  [YouTube Summary with ChatGPT](https://github.com/kazuki-sf/YouTube_Summary_with_ChatGPT)
-------------------------------------------------


# YouTube Summary with ChatGPT


YouTube Summary with ChatGPT is a simple Chrome Extension (manifest v3) that allows you to get both YouTube video transcripts and summary of the video with OpenAI's ChatGPT AI technology. Chrome Extension is available on [Chrome Web Store](https://chrome.google.com/webstore/detail/chatgpt-youtube-summary/nmmicjeknamkfloonkhhcjmomieiodli).

## How to Install

To install this extension, follow these steps:

1. Download the code on GitHub.
2. Unzip the downloaded file.
3. Open the code in your favorite IDE like VS Code.
4. Run `npm install` in terminal
```
npm install
```
5. Run `npm run build` or `npm run build-release` to run webpack to generate **dist** folder.
```
npm run build
# or
npm run build-release
```
6. In case of Google Chrome, open the Extensions page (chrome://extensions/).
7. Turn on Developer mode by clicking the toggle switch in the top right corner of the page.
8. Click the `Load unpacked` button and select the **dist** directory.
9. YouTube Summary with ChatGPT extension should be installed and active!

## How to Use

To use YouTube Summary with ChatGPT extension, follow these steps (or [watch this video](https://www.youtube.com/watch?v=pNxsdLif2cs)):

1. Go to any YouTube videos.
2. Click the small box on the right top that says `Transcript & Summary`.
3. Click `View AI Summary` button (It automatically copies the prompt for you and opens the ChatGPT page!)
4. Hit `Cmd + V` if you use Mac
5. You'll see a magic!

## Notes

- According to OpenAI, ChatGPT is experiencing exceptionally high demand. They work on scaling their systems but I can't guarantee that ChatGPT keeps free and is open forever.
- This code manually fetches the YouTube video transcripts, and the platform might change the system so I also cannot guarantee that the YouTube video transcript code works forever. I'll try my best to keep updated!

## Feedback & Support

If you have any questions or feedback about YouTube Summary with ChatGPT Extension, please reach out to me on [Twitter](https://twitter.com/kazuki_sf_). Also, I'm building Glasp, a social web annotation tool to build your own AI models to write, search, and summarize better. If you're interested, please check out [Glasp](https://glasp.co/ai-summary).
