"use strict";

import { getLogoSvg } from "./svgs";
import { ICONS } from "./friSummary/svgs";
import { FriSummary } from "./friSummary/friSummary";
import { SubtitleSummaryView } from "./subtitleSummary/view/subtitleSummaryView";
import { i18nService } from "./friSummary/i18nService";
import { Toast } from "../common/toast";
import { GenerateStatus } from "../common/common";
import { hasSubtitles } from "./transcript";
import { getSearchParam } from "./searchParam";
import { TTSSpeak } from "../common/ttsSpeak";
import { PlayPauseButtonHandler } from "./subtitleSummary/view/buttonHandlers";

// State to track if the summary container is visible or not
let isFriSummaryVisible = false;
let isDebugMode = true; // Set to true to enable debug output

/**
 * Logs debug information to console and optionally to UI
 */
function mobileDebugLog(message: string, level: 'info' | 'error' | 'warn' = 'info'): void {
    const prefix = '[Mobile Friday] ';
    
    // Always log to console
    if (level === 'info') {
        console.log(prefix + message);
    } else if (level === 'error') {
        console.error(prefix + message);
    } else if (level === 'warn') {
        console.warn(prefix + message);
    }
    
    // If debug mode is enabled, add to UI
    if (isDebugMode) {
        const debugContainer = document.getElementById('mobile-friday-debug');
        if (debugContainer) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `mobile-debug-entry mobile-debug-${level}`;
            logEntry.textContent = `[${timestamp}] ${message}`;
            debugContainer.appendChild(logEntry);
            
            // Limit number of entries
            while (debugContainer.children.length > 20) {
                debugContainer.removeChild(debugContainer.firstChild as Node);
            }
            
            // Scroll to bottom
            debugContainer.scrollTop = debugContainer.scrollHeight;
        }
    }
}

/**
 * Attaches event handlers to the buttons in the mobile Friday UI
 */
function attachButtonEventHandlers(): void {
    mobileDebugLog('Attaching event handlers to mobile Friday buttons');

    // Generate button
    const generateButton = document.getElementById('fri-generate-button');
    if (generateButton) {
        mobileDebugLog('Found generate button, attaching click handler');
        generateButton.addEventListener('click', async () => {
            mobileDebugLog('Mobile generate button clicked');
            const subtitleSummaryView = SubtitleSummaryView.getInstance();
            
            if (subtitleSummaryView.getGenerating()) {
                mobileDebugLog('Already generating summary', 'warn');
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
                mobileDebugLog('No video ID found in URL', 'error');
                Toast.show({ 
                    message: 'No video ID found', 
                    type: 'error', 
                    duration: 3000 
                });
                return;
            }
            
            // Update UI to show we're checking for subtitles
            const infoText = document.getElementById('fri-summary-info-text');
            if (infoText) {
                infoText.textContent = 'Checking for video subtitles...';
            }
            
            // Check if subtitles are available
            mobileDebugLog('Checking if video has subtitles');
            const subtitlesAvailable = await hasSubtitles(videoId);
            
            if (!subtitlesAvailable) {
                mobileDebugLog('No subtitles available for this video', 'error');
                
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
            
            mobileDebugLog('Subtitles found, starting manual generation');
            Toast.show({ 
                message: i18nService.getMessage('summary-start-generate') || 'Starting to generate summary...', 
                type: 'info', 
                duration: 3000 
            });
            
            try {
                mobileDebugLog('Calling manualStartGenerate()');
                // Update status text to show progress
                const infoText = document.getElementById('fri-summary-info-text');
                if (infoText) {
                    infoText.textContent = 'Getting video transcript...';
                }
                
                // Add timeout to fail gracefully if taking too long
                const timeout = setTimeout(() => {
                    mobileDebugLog('Generation timeout reached', 'warn');
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
                                mobileDebugLog('Retry button clicked after timeout');
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
                
                mobileDebugLog('Generation started successfully');
            } catch (error) {
                mobileDebugLog('Error in manual generation: ' + (error instanceof Error ? error.message : String(error)), 'error');
                
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
                            mobileDebugLog('Retry button clicked');
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
    } else {
        mobileDebugLog('Generate button not found', 'error');
    }

    // Settings button
    const settingsButton = document.getElementById('fri-settings-button');
    if (settingsButton) {
        mobileDebugLog('Found settings button, attaching click handler');
        settingsButton.addEventListener('click', () => {
            mobileDebugLog('Mobile settings button clicked');
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        });
    }
}

/**
 * Creates and injects CSS for the mobile logo icon
 */
export function injectMobileStyles(): void {
    if (document.getElementById('mobile-friday-styles')) {
        return; // Styles already injected
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'mobile-friday-styles';
    styleElement.textContent = `
        .mobile-friday-logo {
            position: fixed;
            right: 16px;
            bottom: 60px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            cursor: pointer;
            border: none;
            transition: transform 0.2s;
        }
        
        .mobile-friday-logo:active {
            transform: scale(0.95);
        }
        
        .mobile-friday-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: var(--yt-spec-base-background, #ffffff);
            color: var(--yt-spec-text-primary, #0f0f0f);
            z-index: 9999;
            overflow-y: auto;
            font-family: 'Roboto', 'Arial', sans-serif;
            display: none;
        }
        
        [data-theme="dark"] .mobile-friday-container,
        html[dark] .mobile-friday-container {
            background-color: var(--yt-spec-base-background, #0f0f0f);
            color: var(--yt-spec-text-primary, #ffffff);
        }
        
        .mobile-friday-header {
            position: sticky;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background-color: var(--yt-spec-base-background, #ffffff);
            border-bottom: 1px solid var(--yt-spec-10-percent-layer, #e5e5e5);
            z-index: 1;
        }
        
        [data-theme="dark"] .mobile-friday-header,
        html[dark] .mobile-friday-header {
            background-color: var(--yt-spec-base-background, #0f0f0f);
            border-bottom: 1px solid var(--yt-spec-10-percent-layer, #272727);
        }
        
        .mobile-friday-title {
            font-size: 18px;
            font-weight: 500;
            margin: 0;
            flex-grow: 1;
            text-align: center;
        }
        
        .mobile-friday-close {
            font-size: 24px;
            background: none;
            border: none;
            color: var(--yt-spec-text-primary, #0f0f0f);
            cursor: pointer;
            padding: 4px 8px;
        }
        
        [data-theme="dark"] .mobile-friday-close,
        html[dark] .mobile-friday-close {
            color: var(--yt-spec-text-primary, #ffffff);
        }
        
        .mobile-friday-content {
            padding: 16px;
            line-height: 1.5;
        }
        
        /* YouTube mobile style buttons */
        #fri-generate-button, #fri-settings-button {
            background-color: transparent;
            color: #606060;
            border-radius: 18px;
            height: 36px;
            width: 36px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #fri-generate-button {
            color: #065fd4;
            background-color: rgba(6, 95, 212, 0.1);
        }
        
        /* Override fri-summary container for mobile */
        .fri-summry-container {
            margin: 0 !important;
            border-radius: 0 !important;
            width: 94% !important;
            padding: 16px !important;
            box-shadow: none !important;
            border: none !important;
        }
        
        .fri-summary-row {
            flex-wrap: wrap;
            justify-content: space-between;
            padding: 0;
            margin-bottom: 16px;
        }
        
        .fri-summary-info-container {
            width: 100%;
            order: -1;
            margin-bottom: 16px;
            padding: 0 !important;
        }
        
        .fri-summary-info {
            color: var(--yt-spec-text-primary, #030303);
            font-size: 14px;
            font-weight: 400;
        }
        
        .fri-icon-box {
            margin: 0 4px;
        }
        
        .fri-left-controls, .fri-right-controls {
            border: none !important;
            padding: 0 !important;
        }
        
        .fri-summary-content-container {
            border-top: 1px solid rgba(0, 0, 0, 0.1) !important;
            padding: 16px 0 !important;
            margin-top: 0 !important;
        }
        
        .fri-summary-content p {
            color: var(--yt-spec-text-primary, #030303);
            font-size: 14px;
            line-height: 1.4;
            margin: 8px 0 !important;
        }
        
        /* Mobile debug container */
        .mobile-friday-debug {
            border-top: 1px solid var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.1)) !important;
            margin-top: 16px;
            padding: 8px;
            color: var(--yt-spec-text-secondary, #606060);
        }
        
        .mobile-debug-entry {
            font-size: 11px;
            margin-bottom: 4px;
            word-break: break-word;
        }
        
        .mobile-debug-error {
            color: #c00;
        }
        
        .mobile-debug-warn {
            color: #f90;
        }
        
        /* Dark mode overrides */
        html[dark] .mobile-friday-logo {
            background-color: #282828;
        }
        
        html[dark] .fri-summary-info,
        html[dark] .fri-summary-content p {
            color: var(--yt-spec-text-primary, #fff);
        }
        
        html[dark] .mobile-friday-debug {
            color: var(--yt-spec-text-secondary, #aaa);
        }
        
        html[dark] .fri-summary-content-container,
        html[dark] .mobile-friday-debug {
            border-color: rgba(255, 255, 255, 0.1) !important;
        }
        
        html[dark] #fri-generate-button {
            color: #3ea6ff;
            background-color: rgba(62, 166, 255, 0.15);
        }
        
        /* Error and timeout UI styling */
        .friday-error-container {
            background-color: var(--yt-spec-error-background, rgba(249, 38, 38, 0.05));
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            border: 1px solid var(--yt-spec-error-outline, rgba(249, 38, 38, 0.3));
        }
        
        [data-theme="dark"] .friday-error-container,
        html[dark] .friday-error-container {
            background-color: var(--yt-spec-error-background, rgba(249, 38, 38, 0.1));
            border: 1px solid var(--yt-spec-error-outline, rgba(249, 38, 38, 0.3));
        }
        
        .friday-error-container h3 {
            color: var(--yt-spec-error-text, #f92626);
            margin-top: 0;
            margin-bottom: 8px;
        }
        
        .friday-error-container ul {
            padding-left: 20px;
            margin: 8px 0;
        }
        
        .friday-retry-button {
            background-color: var(--yt-spec-brand-button-background, #065fd4);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 18px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 12px;
            transition: background-color 0.2s;
        }
        
        .friday-retry-button:hover, .friday-retry-button:active {
            background-color: var(--yt-spec-brand-button-background-hover, #0b57be);
        }
        
        html[dark] .friday-retry-button {
            background-color: #3ea6ff;
        }
        
        html[dark] .friday-retry-button:hover, 
        html[dark] .friday-retry-button:active {
            background-color: #2196f3;
        }
    `;
    document.head.appendChild(styleElement);
}

/**
 * Toggles the visibility of the Friday summary container
 */
function toggleFriSummaryContainer(): void {
    const container = document.getElementById('mobile-friday-container');
    if (!container) {
        mobileDebugLog('Mobile Friday container not found', 'error');
        return;
    }

    if (isFriSummaryVisible) {
        mobileDebugLog('Hiding Friday summary container');
        container.style.display = 'none';
        isFriSummaryVisible = false;
    } else {
        mobileDebugLog('Showing Friday summary container');
        container.style.display = 'block';
        isFriSummaryVisible = true;
        
        // Initialize Friday summary for mobile if not already done
        initializeMobileFriSummary();
    }
}

/**
 * Initializes the Friday summary UI for mobile
 */
function initializeMobileFriSummary(): void {
    try {
        // Check if we already initialized
        if (document.querySelector('.fri-summry-container')) {
            mobileDebugLog('Friday summary already initialized');
            return;
        }
        
        mobileDebugLog('Initializing Friday summary for mobile');
        
        // Get the container
        const contentContainer = document.getElementById('mobile-friday-content');
        if (!contentContainer) {
            mobileDebugLog('Mobile Friday content container not found', 'error');
            return;
        }
        
        // Create a wrapper for the FriSummary container
        const friSummaryWrapper = document.createElement('div');
        friSummaryWrapper.id = 'bottom-row'; // Add this id to make FriSummary init work
        contentContainer.appendChild(friSummaryWrapper);
        
        mobileDebugLog('Created bottom-row wrapper for FriSummary');
        
        // Initialize manually by creating the container and adding it to the DOM
        const friSummaryContainer = document.createElement('div');
        friSummaryContainer.className = 'fri-summry-container';
        friSummaryContainer.id = 'fri-summry-container';
        
        // Set the HTML content directly for mobile
        friSummaryContainer.innerHTML = `
            <div class="fri-summary-row">
                <div class="fri-left-controls">
                    <div class="fri-icon-box">
                        <button class="fri-icon-button" id="fri-generate-button">
                            ${ICONS ? ICONS['paragraph'] : ''}
                        </button>
                        <div class="fri-tooltip" id="fri-generate-button-tooltip">Generate Summary</div>
                    </div>
                    <div class="fri-icon-box play-pause-container">
                        <button class="fri-icon-button fri-play-button" id="fri-play-button">
                            ${ICONS ? ICONS['play'] : ''}
                        </button>                       
                        <div class="fri-tooltip" id="play-pause-tooltip">Play</div>
                    </div>
                </div>
                <div class="fri-summary-info-container">
                    <div class="fri-summary-info"> <strong>Friday: </strong>
                        <span id="fri-summary-info-text" class="fri-summary-info-text">Ready to summarize mobile video</span>
                    </div>
                </div>
                <div class="fri-right-controls">
                    <div class="fri-icon-box">
                        <button class="fri-icon-button" id="fri-settings-button">
                            ${ICONS ? ICONS['settings'] : ''}
                        </button>
                        <div class="fri-tooltip" id="fri-settings-button-tooltip">Settings</div>
                    </div>
                </div>
            </div>
            <div class="fri-summary-content-container" id="fri-summary-content-container">
                <div id="ytbs_summary_status" class="fri-summary-status-content"> </div>
                <div class="fri-summary-content" id="fri-summary-content"> 
                    <p>Tap the paragraph icon to generate a summary of this video.</p>
                </div>    
            </div>
        `;
        
        friSummaryWrapper.appendChild(friSummaryContainer);
        mobileDebugLog('Added simplified Friday summary container to mobile view');
        
        // Add event handlers to the buttons - Must be after DOM elements are added
        setTimeout(() => {
            attachButtonEventHandlers();
        }, 100);
        
        // Try to initialize FriSummary instance as a fallback
        try {
            const friSummary = FriSummary.getInstance();
            friSummary.init();
            mobileDebugLog('Initialized FriSummary instance');
            
            // Initialize SubtitleSummaryView and button handlers
            const subtitleSummaryView = SubtitleSummaryView.getInstance();
            subtitleSummaryView.init();
            mobileDebugLog('Initialized SubtitleSummaryView');
            
            // Make sure play button works
            const playButton = document.getElementById('fri-play-button');
            if (playButton) {
                mobileDebugLog('Adding click handler to play button');
                const tts = TTSSpeak.getInstance();
                const playPauseButtonHandler = PlayPauseButtonHandler.getInstance();
                playPauseButtonHandler.initVariable(tts, subtitleSummaryView);
                playPauseButtonHandler.init();
                mobileDebugLog('Play button handler initialized');
            } else {
                mobileDebugLog('Play button not found', 'error');
            }
        } catch (instanceError) {
            mobileDebugLog('Error initializing FriSummary instance: ' + (instanceError instanceof Error ? instanceError.message : String(instanceError)), 'error');
            
            // Fallback UI in case of initialization error
            const fallbackContent = document.createElement('div');
            fallbackContent.style.padding = '20px';
            fallbackContent.style.textAlign = 'center';
            fallbackContent.innerHTML = `
                <div style="margin-bottom: 16px;">
                    <p>Sorry, we encountered an error while loading the summary feature.</p>
                </div>
                <button id="mobile-friday-retry" style="padding: 8px 16px; background-color: #3ea6ff; color: white; border: none; border-radius: 4px; font-weight: bold;">
                    Retry
                </button>
            `;
            
            const summaryContent = document.getElementById('fri-summary-content');
            if (summaryContent) {
                summaryContent.innerHTML = '';
                summaryContent.appendChild(fallbackContent);
                
                // Add retry button listener
                const retryButton = document.getElementById('mobile-friday-retry');
                if (retryButton) {
                    retryButton.addEventListener('click', () => {
                        console.log('Retry button clicked');
                        // Clear summary container and try again
                        const container = document.getElementById('mobile-friday-container');
                        if (container) {
                            container.style.display = 'none';
                            isFriSummaryVisible = false;
                            
                            // Remove existing container to force re-creation
                            const oldSummaryContainer = document.querySelector('.fri-summry-container');
                            if (oldSummaryContainer) {
                                oldSummaryContainer.remove();
                            }
                            
                            // Show again with retry
                            setTimeout(() => {
                                container.style.display = 'block';
                                isFriSummaryVisible = true;
                                initializeMobileFriSummary();
                            }, 100);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in initializeMobileFriSummary:', error);
    }
}

/**
 * Creates the mobile logo icon element
 */
function createMobileLogoIcon(): HTMLElement {
    const logoIcon = document.createElement('div');
    logoIcon.className = 'mobile-friday-logo';
    logoIcon.innerHTML = getLogoSvg();
    
    logoIcon.addEventListener('click', () => {
        mobileDebugLog('Mobile logo clicked');
        toggleFriSummaryContainer();
    });
    
    return logoIcon;
}

/**
 * Creates the Friday summary container
 */
function createFriSummaryContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'mobile-friday-container';
    container.className = 'mobile-friday-container';
    
    // Add header with title
    const header = document.createElement('div');
    header.className = 'mobile-friday-header';
    
    const title = document.createElement('div');
    title.className = 'mobile-friday-title';
    title.textContent = 'Friday AI';
    header.appendChild(title);
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'mobile-friday-close';
    closeButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    closeButton.addEventListener('click', () => {
        mobileDebugLog('Close button clicked');
        toggleFriSummaryContainer();
    });
    header.appendChild(closeButton);
    
    // Create the container for FriSummary to insert its content into
    const summaryContent = document.createElement('div');
    summaryContent.id = 'mobile-friday-content';
    
    // Create debug container (only visible in debug mode)
    const debugContainer = document.createElement('div');
    debugContainer.id = 'mobile-friday-debug';
    debugContainer.className = 'mobile-friday-debug';
    debugContainer.style.display = isDebugMode ? 'block' : 'none';
    debugContainer.style.maxHeight = '150px';
    debugContainer.style.overflowY = 'auto';
    debugContainer.style.borderTop = '1px solid var(--fri-border, #ccc)';
    debugContainer.style.marginTop = '16px';
    debugContainer.style.padding = '8px';
    debugContainer.style.fontSize = '12px';
    debugContainer.style.fontFamily = 'monospace';
    
    container.appendChild(header);
    container.appendChild(summaryContent);
    container.appendChild(debugContainer);
    
    return container;
}

/**
 * Main function to insert the mobile logo icon and container
 */
export function insertMobileLogoIcon(): void {
    // Don't insert if already exists
    if (document.querySelector('.mobile-friday-logo')) {
        mobileDebugLog('Mobile logo already exists');
        return;
    }

    // Only insert on watch pages
    if (window.location.pathname.indexOf('/watch') !== 0) {
        mobileDebugLog('Not a watch page, skipping mobile logo insertion');
        return;
    }

    mobileDebugLog('Inserting mobile logo on: ' + window.location.href);

    // Inject styles
    injectMobileStyles();

    // Create and add logo icon
    const logoIcon = createMobileLogoIcon();
    document.body.appendChild(logoIcon);
    mobileDebugLog('Mobile logo added to the page');

    // Create and add Friday summary container
    const container = createFriSummaryContainer();
    document.body.appendChild(container);
    mobileDebugLog('Mobile Friday container added to the page');
}

/**
 * Detects if YouTube is currently in dark mode
 */
function isYouTubeDarkMode(): boolean {
    // Check for html[dark] attribute (mobile YouTube)
    if (document.documentElement.hasAttribute('dark')) {
        return true;
    }
    
    // Check for data-theme="dark" attribute (newer YouTube versions)
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        return true;
    }
    
    // Backup method: check background color of body or a known element
    const ytBackground = getComputedStyle(document.body).getPropertyValue('--yt-spec-base-background');
    if (ytBackground && ytBackground.includes('#0f0f0f')) {
        return true;
    }
    
    return false;
}

/**
 * Creates the mobile UI elements
 */
export function createMobileUI(): void {
    if (document.getElementById('mobile-friday-container')) {
        return; // UI already created
    }

    // Inject styles
    injectMobileStyles();

    // Create logo button
    const logoButton = document.createElement('button');
    logoButton.className = 'mobile-friday-logo';
    logoButton.id = 'mobile-friday-logo';
    logoButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 18H13V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="#065FD4"/>
    </svg>`;
    document.body.appendChild(logoButton);

    // Create container
    const container = document.createElement('div');
    container.className = 'mobile-friday-container';
    container.id = 'mobile-friday-container';
    
    // Apply dark mode attribute if needed
    if (isYouTubeDarkMode()) {
        container.setAttribute('data-theme', 'dark');
    }

    // Create header
    const header = document.createElement('div');
    header.className = 'mobile-friday-header';
    
    const title = document.createElement('h2');
    title.className = 'mobile-friday-title';
    title.textContent = 'YouTube Summary';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'mobile-friday-close';
    closeButton.textContent = '×';
    
    header.appendChild(closeButton);
    header.appendChild(title);
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'mobile-friday-content';
    content.id = 'fri-summary-content';
    content.innerHTML = '<p>Tap the paragraph icon to generate a summary of this video.</p>';
    
    // Assemble container
    container.appendChild(header);
    container.appendChild(content);
    
    // Create debug container if enabled
    if (isDebugMode) {
        const debugContainer = document.createElement('div');
        debugContainer.className = 'mobile-friday-debug';
        debugContainer.id = 'mobile-friday-debug';
        container.appendChild(debugContainer);
    }
    
    document.body.appendChild(container);
    
    // Add event listeners
    logoButton.addEventListener('click', () => {
        mobileDebugLog('Logo clicked, opening summary panel');
        container.style.display = 'block';
    });
    
    closeButton.addEventListener('click', () => {
        mobileDebugLog('Close button clicked, hiding summary panel');
        container.style.display = 'none';
    });
    
    // Setup the generate button functionality is handled by setupMobileGenerateButton()
}

/**
 * Sets up a mutation observer to detect theme changes
 */
function setupThemeChangeObserver(): void {
    // Function to update UI theme
    const updateTheme = () => {
        const container = document.getElementById('mobile-friday-container');
        if (container) {
            if (isYouTubeDarkMode()) {
                container.setAttribute('data-theme', 'dark');
            } else {
                container.removeAttribute('data-theme');
            }
        }
    };

    // Create a mutation observer to watch for dark mode changes
    const themeObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'dark' || mutation.attributeName === 'data-theme')) {
                updateTheme();
                mobileDebugLog('YouTube theme changed, updating UI');
            }
        });
    });

    // Start observing document element for theme changes
    themeObserver.observe(document.documentElement, { 
        attributes: true,
        attributeFilter: ['dark', 'data-theme']
    });
    
    // Also check periodically in case we miss an attribute change
    setInterval(updateTheme, 5000);
}

/**
 * Sets up the mobile generate button
 * This is an alias for attachButtonEventHandlers for better readability
 */
function setupMobileGenerateButton(): void {
    mobileDebugLog('Setting up mobile generate button');
    attachButtonEventHandlers();
}

/**
 * Initialize mobile interface
 */
export function initializeMobile(): void {
    mobileDebugLog('Initializing mobile interface');
    createMobileUI();
    setupMobileGenerateButton();
    setupThemeChangeObserver();
    mobileDebugLog('Mobile interface initialized');
} 