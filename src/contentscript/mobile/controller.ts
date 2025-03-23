/**
 * Mobile UI controller
 * Contains business logic and orchestration for the mobile interface
 */

import { FriSummary } from "../friSummary/friSummary";
import { SubtitleSummaryView } from "../subtitleSummary/view/subtitleSummaryView";
import { ICONS } from "../friSummary/svgs";
import { setupPlayButton } from "./buttons";
import * as state from "./state";

/**
 * Initializes the Friday summary UI for mobile
 */
export function initializeMobileFriSummary(): void {
    try {
        // Check if we already initialized
        if (document.querySelector('.fri-summry-container')) {
            return;
        }
        
        // Get the container
        const contentContainer = document.getElementById('mobile-friday-content');
        if (!contentContainer) {
            return;
        }
        
        // Create a wrapper for the FriSummary container
        const friSummaryWrapper = document.createElement('div');
        friSummaryWrapper.id = 'bottom-row'; // Add this id to make FriSummary init work
        contentContainer.appendChild(friSummaryWrapper);
        
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
        
        // Add event handlers to the buttons - Must be after DOM elements are added
        setTimeout(() => {
            import('./buttons').then(buttons => {
                buttons.attachButtonEventHandlers();
            });
        }, 100);
        
        // Try to initialize FriSummary instance as a fallback
        try {
            const friSummary = FriSummary.getInstance();
            friSummary.init();
            
            // Initialize SubtitleSummaryView and button handlers
            const subtitleSummaryView = SubtitleSummaryView.getInstance();
            subtitleSummaryView.init();
            
            // // Make sure play button works
            // setupPlayButton(subtitleSummaryView);
        } catch (instanceError) {
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
                        // Clear summary container and try again
                        const container = document.getElementById('mobile-friday-container');
                        if (container) {
                            container.style.display = 'none';
                            (window as any).isFriSummaryVisible = false;
                            
                            // Remove existing container to force re-creation
                            const oldSummaryContainer = document.querySelector('.fri-summry-container');
                            if (oldSummaryContainer) {
                                oldSummaryContainer.remove();
                            }
                            
                            // Show again with retry
                            setTimeout(() => {
                                container.style.display = 'block';
                                (window as any).isFriSummaryVisible = true;
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