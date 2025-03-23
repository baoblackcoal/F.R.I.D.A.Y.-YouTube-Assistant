import { getLangOptionsWithLink, getRawTranscript } from "../transcript";
import { TTSSpeak } from '../../common/ttsSpeak';
import { SubtitleSummaryView } from "./view/subtitleSummaryView";
import { getVideoTitle } from "./subtitleSummary";
import { settingsManager } from '../../common/settingsManager';
import { FridayStatus } from '../../common/common';
import { updateSummaryStatus } from "./subtitleSummary";
import { FriSummary } from "../friSummary/friSummary";
import { i18nService } from "../friSummary/i18nService";
import { Toast } from "../../common/toast";
import { fridayStatusLabels } from "../../common/common";

interface SrtEntry {
    id: number;
    start: number;
    end: number;
    text: string;
    element?: HTMLElement;
}

export class SrtGenerator {
    private static instance: SrtGenerator;
    private srtEntries: SrtEntry[] = [];
    private currentSrtIndex: number = -1;
    private videoCheckInterval: number | null = null;
    private tts: TTSSpeak;
    private speakingEnabled: boolean = false;
    private lastVideoVolume: number = 0.3; // Default volume value
    private originalVideoVolume: number = 1.0; // Store original video volume

    private constructor() {
        this.tts = TTSSpeak.getInstance();
    }

    public static getInstance(): SrtGenerator {
        if (!SrtGenerator.instance) {
            SrtGenerator.instance = new SrtGenerator();
        }
        return SrtGenerator.instance;
    }

    public async generateSrtContent(videoId: string): Promise<boolean> {
        try {
            // First, clear any existing content
            const contentElement = document.querySelector("#fri-summary-content") as HTMLElement;
            if (!contentElement) {
                return false;
            }
            
            contentElement.innerHTML = "";
            this.srtEntries = [];
            this.currentSrtIndex = -1;
            
            // Update status to show we're generating captions
            updateSummaryStatus("Generating SRT captions...", FridayStatus.GeneratingSummary);
            FriSummary.getInstance().setGenerateContentExpand();

            // Get the language options and raw transcript
            const langOptionsWithLink = await getLangOptionsWithLink(videoId);
            if (!langOptionsWithLink) {
                Toast.show({
                    type: 'error',
                    message: i18nService.getMessage('summary-tip-no-youtube-transcript'),
                    duration: 4000
                });
                updateSummaryStatus("No captions available.", FridayStatus.Init);
                return false;
            }

            // Get the video title for display
            const videoTitle = await getVideoTitle();
            
            // Create a title element
            const titleElement = document.createElement('h2');
            titleElement.textContent = videoTitle;
            titleElement.style.marginBottom = '15px';
            contentElement.appendChild(titleElement);
            
            // Add audio control button for TTS
            this.addAudioControlButton(contentElement);
            
            // Get the raw transcript with timing information
            const rawTranscript = await getRawTranscript(langOptionsWithLink[0].link);
            
            // Process each subtitle entry
            rawTranscript.forEach((entry, index) => {
                if (entry.start && entry.duration && entry.text) {
                    const startTime = parseFloat(entry.start);
                    const duration = parseFloat(entry.duration);
                    const endTime = startTime + duration;
                    
                    // Create a SRT entry
                    const srtEntry: SrtEntry = {
                        id: index + 1,
                        start: startTime,
                        end: endTime,
                        text: entry.text
                    };
                    
                    // Create HTML element for this entry
                    const srtElement = document.createElement('p');
                    srtElement.setAttribute('speak-index', index.toString());
                    srtElement.setAttribute('data-start', startTime.toString());
                    srtElement.setAttribute('data-end', endTime.toString());
                    srtElement.setAttribute('data-index', index.toString());
                    srtElement.className = 'srt-subtitle';
                    srtElement.style.marginBottom = '10px';
                    srtElement.style.padding = '5px';
                    srtElement.style.borderRadius = '5px';
                    srtElement.style.cursor = 'pointer';
                    
                    // Add timestamp format
                    const timeString = this.formatTime(startTime);
                    srtElement.innerHTML = `<span class="srt-time">[${timeString}]</span> ${entry.text}`;
                    
                    // Add click handler to seek to this time in the video
                    srtElement.addEventListener('click', () => {
                        const video = document.querySelector('video');
                        if (video) {
                            video.currentTime = startTime;
                            this.highlightAndScrollToSubtitle(index);
                            // If we're not already speaking, speak this subtitle
                            if (!this.speakingEnabled && entry.text) {
                                this.tts.speakAndPlayVideo(entry.text, index);
                            }
                        }
                    });
                    
                    // Append to document
                    contentElement.appendChild(srtElement);
                    
                    // Store the element reference
                    srtEntry.element = srtElement;
                    
                    // Add to our entries array
                    this.srtEntries.push(srtEntry);
                }
            });
            
            // Start monitoring the video time
            this.startVideoTimeMonitoring();
            
            // Update status
            updateSummaryStatus("SRT captions loaded.", FridayStatus.Finished);
            FriSummary.getInstance().setFriInfoText(i18nService.getMessage(fridayStatusLabels[FridayStatus.Finished]));
            
            return true;
        } catch (error) {
            console.error('Error generating SRT content:', error);
            Toast.show({
                type: 'error',
                message: 'Error generating subtitles: ' + (error instanceof Error ? error.message : String(error)),
                duration: 4000
            });
            updateSummaryStatus("Error generating subtitles.", FridayStatus.Init);
            return false;
        }
    }

    public toggleSpeaking(): boolean {
        this.speakingEnabled = !this.speakingEnabled;
        
        if (this.speakingEnabled) {
            // If speaking is now enabled, speak the current subtitle
            if (this.currentSrtIndex >= 0 && this.currentSrtIndex < this.srtEntries.length) {
                const currentEntry = this.srtEntries[this.currentSrtIndex];
                if (currentEntry.text) {
                    this.tts.speakAndPlayVideo(currentEntry.text, this.currentSrtIndex);
                }
            }
        } else {
            // If speaking is now disabled, stop the TTS
            this.tts.stop();
        }
        
        return this.speakingEnabled;
    }
    
    public isSpeakingEnabled(): boolean {
        return this.speakingEnabled;
    }

    public stopSpeaking(): void {
        this.speakingEnabled = false;
        this.tts.stop();
    }

    private startVideoTimeMonitoring(): void {
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
        }
        
        this.videoCheckInterval = window.setInterval(() => {
            const video = document.querySelector('video');
            if (!video) return;
            
            const currentTime = video.currentTime;
            
            // Find the subtitle that should be displayed at the current time
            const matchingIndex = this.srtEntries.findIndex(
                entry => currentTime >= entry.start && currentTime <= entry.end
            );
            
            if (matchingIndex !== -1 && matchingIndex !== this.currentSrtIndex) {
                this.highlightSubtitle(matchingIndex);
                
                // If speaking is enabled, speak this subtitle
                if (this.speakingEnabled) {
                    const entry = this.srtEntries[matchingIndex];
                    if (entry.text) {
                        this.tts.speakAndPlayVideo(entry.text, matchingIndex);
                    }
                }
            }
        }, 100); // Check every 100ms
    }

    private highlightSubtitle(index: number): void {
        // Remove highlight from the previous subtitle
        if (this.currentSrtIndex !== -1 && this.currentSrtIndex < this.srtEntries.length) {
            const prevElement = this.srtEntries[this.currentSrtIndex].element;
            if (prevElement) {
                prevElement.style.backgroundColor = 'transparent';
                prevElement.style.color = 'var(--yt-spec-text-primary)';
            }
        }
        
        // Highlight the new subtitle
        if (index !== -1 && index < this.srtEntries.length) {
            const newElement = this.srtEntries[index].element;
            if (newElement) {
                newElement.style.backgroundColor = 'lightskyblue';
                newElement.style.color = 'black';
            }
        }
        
        this.currentSrtIndex = index;
    }

    // Add a separate method for when user clicks on a subtitle
    private highlightAndScrollToSubtitle(index: number): void {
        this.highlightSubtitle(index);
        
        // Scroll to the element
        if (index !== -1 && index < this.srtEntries.length) {
            const element = this.srtEntries[index].element;
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    private formatTime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    public cleanup(): void {
        if (this.videoCheckInterval) {
            clearInterval(this.videoCheckInterval);
            this.videoCheckInterval = null;
        }
        
        this.stopSpeaking();
        // Restore original volume
        this.setVideoVolume(this.originalVideoVolume);
        this.srtEntries = [];
        this.currentSrtIndex = -1;
    }

    // Add a new method to create the audio control button
    private addAudioControlButton(contentElement: HTMLElement): void {
        const audioControlContainer = document.createElement('div');
        audioControlContainer.className = 'srt-audio-controls-container';
        audioControlContainer.style.marginBottom = '20px';
        audioControlContainer.style.display = 'flex';
        audioControlContainer.style.flexDirection = 'column';
        audioControlContainer.style.gap = '10px';
        
        // Create TTS toggle control
        const audioControlDiv = document.createElement('div');
        audioControlDiv.className = 'srt-audio-control';
        audioControlDiv.style.display = 'flex';
        audioControlDiv.style.alignItems = 'center';
        audioControlDiv.style.gap = '10px';
        
        // Create the toggle button
        const toggleButton = document.createElement('button');
        toggleButton.id = 'srt-audio-toggle';
        toggleButton.style.display = 'flex';
        toggleButton.style.alignItems = 'center';
        toggleButton.style.justifyContent = 'center';
        toggleButton.style.padding = '8px 12px';
        toggleButton.style.borderRadius = '4px';
        toggleButton.style.backgroundColor = 'var(--yt-spec-brand-background-primary)';
        toggleButton.style.color = 'var(--yt-spec-text-primary)';
        toggleButton.style.border = '1px solid var(--yt-spec-text-secondary)';
        toggleButton.style.cursor = 'pointer';
        
        // Set initial button state
        this.updateAudioToggleButton(toggleButton);
        
        // Add click event
        toggleButton.addEventListener('click', () => {
            this.toggleSpeaking();
            this.updateAudioToggleButton(toggleButton);
        });
        
        const label = document.createElement('span');
        label.textContent = 'TTS for subtitles:';
        label.style.fontWeight = 'bold';
        
        audioControlDiv.appendChild(label);
        audioControlDiv.appendChild(toggleButton);
        audioControlContainer.appendChild(audioControlDiv);
        
        // Create YouTube volume control slider
        const volumeControlDiv = document.createElement('div');
        volumeControlDiv.className = 'srt-volume-control';
        volumeControlDiv.style.display = 'flex';
        volumeControlDiv.style.alignItems = 'center';
        volumeControlDiv.style.gap = '10px';
        
        const volumeLabel = document.createElement('span');
        volumeLabel.textContent = 'YouTube Volume:';
        volumeLabel.style.fontWeight = 'bold';
        
        // Try to get saved volume from localStorage
        try {
            const savedVolume = localStorage.getItem('ytbs_video_volume');
            if (savedVolume) {
                this.lastVideoVolume = parseFloat(savedVolume);
            }
        } catch (e) {
            console.error('Error reading volume from localStorage:', e);
        }
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.1';
        volumeSlider.value = this.lastVideoVolume.toString(); // Use saved volume
        volumeSlider.style.width = '150px';
        
        const volumeValue = document.createElement('span');
        volumeValue.textContent = `${Math.round(this.lastVideoVolume * 100)}%`;
        volumeValue.style.minWidth = '40px';
        
        // Update video volume when slider changes
        volumeSlider.addEventListener('input', () => {
            const volume = parseFloat(volumeSlider.value);
            this.lastVideoVolume = volume;
            this.setVideoVolume(volume);
            volumeValue.textContent = `${Math.round(volume * 100)}%`;
            
            // Save to localStorage
            try {
                localStorage.setItem('ytbs_video_volume', volume.toString());
            } catch (e) {
                console.error('Error saving volume to localStorage:', e);
            }
        });
        
        // Save original video volume before setting the custom one
        const video = document.querySelector('video');
        if (video) {
            this.originalVideoVolume = video.volume;
        }
        
        // Initialize YouTube video volume only if TTS is enabled
        if (this.speakingEnabled) {
            this.setVideoVolume(this.lastVideoVolume);
        }
        
        volumeControlDiv.appendChild(volumeLabel);
        volumeControlDiv.appendChild(volumeSlider);
        volumeControlDiv.appendChild(volumeValue);
        audioControlContainer.appendChild(volumeControlDiv);
        
        contentElement.appendChild(audioControlContainer);
    }
    
    // Add method to set YouTube video volume
    private setVideoVolume(volume: number): void {
        const video = document.querySelector('video');
        if (video) {
            video.volume = volume;
        }
    }
    
    private updateAudioToggleButton(button: HTMLElement): void {
        if (this.speakingEnabled) {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
                <span style="margin-left:5px;">On</span>
            `;
            button.style.backgroundColor = 'var(--yt-spec-brand-button-background)';
            button.style.color = 'white';
            
            // When TTS is enabled, lower YouTube volume to saved value
            this.setVideoVolume(this.lastVideoVolume);
        } else {
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
                <span style="margin-left:5px;">Off</span>
            `;
            button.style.backgroundColor = 'var(--yt-spec-brand-background-primary)';
            button.style.color = 'var(--yt-spec-text-primary)';
            
            // When TTS is disabled, restore YouTube volume to original value
            this.setVideoVolume(this.originalVideoVolume);
        }
    }
}

// Create a class for the SRT button handler
export class SrtButtonHandler {
    private buttonId = "fri-srt-button";
    private srtGenerator: SrtGenerator;
    
    private constructor() {
        this.srtGenerator = SrtGenerator.getInstance();
    }
    
    private static instance: SrtButtonHandler;
    public static getInstance(): SrtButtonHandler {
        if (!SrtButtonHandler.instance) {
            SrtButtonHandler.instance = new SrtButtonHandler();
        }
        return SrtButtonHandler.instance;
    }
    
    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
        }
    }
    
    private async handleClick(): Promise<void> {
        // Get the video ID from the URL
        const url = window.location.href;
        const videoId = url.split('v=')[1]?.split('&')[0] || '';
        
        if (!videoId) {
            Toast.show({
                type: 'error',
                message: 'Could not determine video ID',
                duration: 3000
            });
            return;
        }
        
        // Generate the SRT content
        await this.srtGenerator.generateSrtContent(videoId);
    }
    
    // Add a method to update the button state (e.g., if speaking is toggled)
    update(isSpeaking: boolean): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            // Update button appearance based on speaking state if needed
        }
    }
} 