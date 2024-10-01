# Product Requirements Document (PRD)

## Feature: Subtitle Translation

### Overview
The subtitle translation feature is designed to translate video subtitles into a specified language and display them on the video player. Additionally, it supports text-to-speech (TTS) functionality to read the translated subtitles aloud.

### Objectives
- Translate video subtitles into a target language.
- Display translated subtitles on the video player.
- Provide TTS functionality to read the translated subtitles.
- Handle errors gracefully and provide feedback to the user.

### Key Components
1. **API Integration**: Use the Gemini API to translate subtitles.
2. **Text-to-Speech (TTS)**: Utilize the TTSSpeak module to read subtitles aloud.
3. **User Settings**: Fetch user settings for language preferences and TTS options.
4. **Error Handling**: Implement robust error handling and logging mechanisms.

### Functional Requirements

#### 1. Generate Translation Prompt
- **Function**: `generatePrompt(videoId: string): Promise<string>`
- **Description**: Generates a prompt for the Gemini API based on the video title, transcript, and user settings.
- **Inputs**:
  - `videoId`: The ID of the video to translate.
- **Outputs**:
  - Returns a string prompt for the translation API.

#### 2. Translate Subtitles
- **Function**: `translateSubtitles(videoId: string): Promise<void>`
- **Description**: Translates the subtitles of the specified video and displays them on the video player. Optionally, reads the subtitles aloud using TTS.
- **Inputs**:
  - `videoId`: The ID of the video to translate.
- **Outputs**:
  - None (side effects include updating the DOM and playing TTS).

#### 3. Fetch User Settings
- **Function**: `settingsManager.getSummarySettings()`
- **Description**: Retrieves user settings for subtitle translation and TTS options.
- **Outputs**:
  - Returns an object containing user settings.

#### 4. Fetch API Key
- **Function**: `getApiKey(callback: (key: string | null) => void)`
- **Description**: Retrieves the API key for the Gemini API from the extension settings.
- **Outputs**:
  - Calls the callback function with the API key or null if not set.

#### 5. Update Summary Status
- **Function**: `updateSummaryStatus(status: string)`
- **Description**: Updates the status message displayed to the user.
- **Inputs**:
  - `status`: The status message to display.

### Non-Functional Requirements
- **Performance**: The translation process should be efficient and not cause significant delays in video playback.
- **Scalability**: The solution should handle multiple translations concurrently without performance degradation.
- **Error Handling**: The system should handle errors gracefully and provide meaningful feedback to the user.
- **Usability**: The translated subtitles should be easy to read and the TTS should be clear and accurate.

### User Stories
1. **As a user, I want to translate video subtitles into my preferred language so that I can understand the content.**
2. **As a user, I want the translated subtitles to be displayed on the video player so that I can read them while watching the video.**
3. **As a user, I want the translated subtitles to be read aloud so that I can listen to them while watching the video.**
4. **As a user, I want to be notified if there is an error during the translation process so that I can take appropriate action.**
5. **As a user, I want to be able to click on paragraphs to read them aloud, highlight them, and automatically speak all paragraphs until the end of the subtitles.**

### Technical Architecture
- **Chrome Extension**: Manifest V3
- **TypeScript**: ES6, commonjs
- **Testing**: Jest, Puppeteer
- **Tool**: Webpack
- **Linting**: ESLint

### Best Practices
- **Abstract Interfaces**: Define interfaces for key components and use dependency injection.
- **Modularization**: Break down the project into smaller, self-contained modules.
- **Configuration Management**: Centralize environment-specific settings.
- **Error Handling and Logging**: Implement robust error handling and logging mechanisms.
- **Testing Strategy**: Ensure comprehensive integration and end-to-end tests.
- **Code Quality**: Enforce strict linting rules and use tools like Prettier.

### Future Enhancements
- Support for additional languages.
- Improved error messages and user feedback.
- Enhanced TTS options (e.g., different voices, speech rates).

### Dependencies
- **Gemini API**: For translating subtitles.
- **TTSSpeak Module**: For text-to-speech functionality.
- **Settings Manager**: For fetching user settings.

### Glossary
- **TTS**: Text-to-Speech, a technology that reads text aloud.
- **API**: Application Programming Interface, a set of functions and procedures for interacting with external services.

---

This PRD provides a comprehensive overview of the subtitle translation feature, including its objectives, functional and non-functional requirements, user stories, technical architecture, best practices, future enhancements, and dependencies.