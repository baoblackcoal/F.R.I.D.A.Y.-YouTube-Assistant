/**
 * Mobile UI button handlers
 * Contains all button event handlers for the mobile interface
 */

import { SubtitleSummaryView } from "../subtitleSummary/view/subtitleSummaryView";
import { i18nService } from "../friSummary/i18nService";
import { Toast } from "../../common/toast";
import { hasSubtitles } from "../transcript";
import { getSearchParam } from "../searchParam";
import { TTSSpeak } from "../../common/ttsSpeak";
import { PlayPauseButtonHandler } from "../subtitleSummary/view/buttonHandlers";

/**
 * Attaches event handlers to the buttons in the mobile Friday UI
 */
export function attachButtonEventHandlers(): void {
    // Generate button
    const generateButton = document.getElementById('fri-generate-button');
    if (generateButton) {
        // 初始状态下移除高亮
        generateButton.classList.remove('active');
        
        // 监听生成状态变化
        window.addEventListener('GenerateStatus', (event: any) => {
            const status = event.detail?.GenerateStatus;
            if (status && status !== 'Init') {
                generateButton.classList.add('active');
            } else {
                generateButton.classList.remove('active');
            }
        });
        
        generateButton.addEventListener('click', async () => {
            const subtitleSummaryView = SubtitleSummaryView.getInstance();
            
            if (subtitleSummaryView.getGenerating()) {
                // 点击时添加active类
                generateButton.classList.add('active');
                
                Toast.show({ 
                    message: i18nService.getMessage('summary-generating') || 'Already generating summary...', 
                    type: 'info', 
                    duration: 3000 
                });
                return;
            }
            
            // Get current video ID
            const videoId = getSearchParam(window.location.href).v;
            if (!videoId) {
                Toast.show({ 
                    message: 'No video ID found', 
                    type: 'error', 
                    duration: 3000 
                });
                return;
            }
            
            // 开始生成时添加active类
            generateButton.classList.add('active');
            
            // Update UI to show we're checking for subtitles
            const infoText = document.getElementById('fri-summary-info-text');
            if (infoText) {
                infoText.textContent = 'Checking for video subtitles...';
            }
            
            // Check if subtitles are available
            const subtitlesAvailable = await hasSubtitles(videoId);
            
            if (!subtitlesAvailable) {
                // Update UI to show no subtitles available
                if (infoText) {
                    infoText.textContent = 'No subtitles available';
                }
                
                const summaryContent = document.getElementById('fri-summary-content');
                if (summaryContent) {
                    summaryContent.innerHTML = `
                        <div style="padding: 16px; text-align: center;">
                            <h3 style="margin-bottom: 16px; color: #cc0000;">No Subtitles Available</h3>
                            <p style="margin-bottom: 16px;">This video doesn't have subtitles or captions, which are required for generating a summary.</p>
                            <p>You can try another video that has subtitles enabled.</p>
                        </div>
                    `;
                }
                
                Toast.show({ 
                    message: 'This video does not have subtitles available', 
                    type: 'error', 
                    duration: 5000 
                });
                return;
            }
            
            Toast.show({ 
                message: i18nService.getMessage('summary-start-generate') || 'Starting to generate summary...', 
                type: 'info', 
                duration: 3000 
            });
            
            try {
                // Update status text to show progress
                const infoText = document.getElementById('fri-summary-info-text');
                if (infoText) {
                    infoText.textContent = 'Getting video transcript...';
                }
                
                // Add timeout to fail gracefully if taking too long
                const timeout = setTimeout(() => {
                    Toast.show({ 
                        message: 'Generation is taking longer than expected. Please try again.', 
                        type: 'info', 
                        duration: 3000 
                    });
                    if (infoText) {
                        infoText.textContent = 'Timed out. Please try again.';
                    }
                    
                    // Show timeout error UI
                    const summaryContent = document.getElementById('fri-summary-content');
                    if (summaryContent) {
                        summaryContent.innerHTML = `
                            <div class="friday-error-container">
                                <h3>Generation timed out</h3>
                                <p>The summary generation is taking longer than expected. This might be because:</p>
                                <ul>
                                    <li>The video is very long with complex subtitles</li>
                                    <li>Your connection is currently unstable</li>
                                    <li>YouTube's servers are busy</li>
                                </ul>
                                <button id="mobile-friday-retry-gen" class="friday-retry-button">
                                    Try Again
                                </button>
                            </div>
                        `;
                        
                        // Add retry button event listener
                        const retryButton = document.getElementById('mobile-friday-retry-gen');
                        if (retryButton) {
                            retryButton.addEventListener('click', () => {
                                // Clear error message
                                if (summaryContent) {
                                    summaryContent.innerHTML = '<p>Tap the paragraph icon to generate a summary of this video.</p>';
                                }
                                // Try again
                                setTimeout(() => {
                                    const generateButton = document.getElementById('fri-generate-button');
                                    if (generateButton) {
                                        generateButton.click();
                                    }
                                }, 100);
                            });
                        }
                    }
                }, 15000); // 15 second timeout
                
                await subtitleSummaryView.manualStartGenerate();
                clearTimeout(timeout);
            } catch (error) {
                // Update UI to show the error
                const summaryContent = document.getElementById('fri-summary-content');
                const infoText = document.getElementById('fri-summary-info-text');
                
                if (infoText) {
                    infoText.textContent = 'Failed to generate summary';
                }
                
                if (summaryContent) {
                    summaryContent.innerHTML = `
                        <div class="friday-error-container">
                            <h3>Unable to generate summary</h3>
                            <p>We couldn't access the video's transcript. This might be because:</p>
                            <ul>
                                <li>The video doesn't have captions/subtitles</li>
                                <li>There was a network issue accessing the subtitles</li>
                                <li>The current mobile YouTube version has changed</li>
                            </ul>
                            <button id="mobile-friday-retry-gen" class="friday-retry-button">
                                Try Again
                            </button>
                        </div>
                    `;
                    
                    // Add retry button event listener
                    const retryButton = document.getElementById('mobile-friday-retry-gen');
                    if (retryButton) {
                        retryButton.addEventListener('click', () => {
                            // Clear error message
                            if (summaryContent) {
                                summaryContent.innerHTML = '<p>Tap the paragraph icon to generate a summary of this video.</p>';
                            }
                            // Try again
                            setTimeout(() => {
                                const generateButton = document.getElementById('fri-generate-button');
                                if (generateButton) {
                                    generateButton.click();
                                }
                            }, 100);
                        });
                    }
                }
                
                Toast.show({ 
                    message: 'Error generating summary: Could not access video transcript', 
                    type: 'error', 
                    duration: 5000 
                });
            }
        });
    }

    // Settings button
    const settingsButton = document.getElementById('fri-settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        });
    }
}

/**
 * Sets up the mobile generate button
 * This is an alias for attachButtonEventHandlers for better readability
 */
export function setupMobileGenerateButton(): void {
    attachButtonEventHandlers();
}

/**
 * Sets up play button to properly work with TTS
 * @param subtitleSummaryView Instance of SubtitleSummaryView
 */
export function setupPlayButton(subtitleSummaryView: SubtitleSummaryView): void {
    const playButton = document.getElementById('fri-play-button');
    if (playButton) {
        const tts = TTSSpeak.getInstance();
        const playPauseButtonHandler = PlayPauseButtonHandler.getInstance();
        playPauseButtonHandler.initVariable(tts, subtitleSummaryView);
        playPauseButtonHandler.init();
    }
} 