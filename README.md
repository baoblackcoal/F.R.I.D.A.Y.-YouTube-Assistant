# YouTube Summary Extension

## Overview

The YouTube Summary Extension is a Chrome extension that provides multilingual summaries of YouTube videos using AI technology. It aims to enhance the user's video-watching experience by offering quick, concise summaries and additional features.

## Features


#### The Project is under development, the main features refer to [Product Requirements Document (PRD)](./prd.md)

####  [Project Plan And Status](https://github.com/users/baoblackcoal/projects/2/views/1)


### Start the Project from  [YouTube Summary with ChatGPT](https://github.com/kazuki-sf/YouTube_Summary_with_ChatGPT)


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


## Environment Variables

The application requires the following environment variables to be set in a `.env` file:

### API Keys
- `GEMINI_API_KEY_DEV`: Google Gemini API key for development environment
- `GEMINI_API_KEY_TEST`: Google Gemini API key for test environment
- `GEMINI_API_KEY_PRODUCTION`: Google Gemini API key for production environment

### Speech Services
- `SPEECH_KEY`: Azure Speech Services API key
- `SPEECH_REGION`: Azure Speech Services region (e.g., 'eastus')

Make sure to create a `.env` file in the root directory and add these variables with your own API keys before running the application.

**Note**: Never commit your actual API keys to version control. The `.env` file should be added to your `.gitignore`.


