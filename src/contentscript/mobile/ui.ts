/**
 * Mobile UI components
 * Contains UI creation and management functions
 */

import { getLogoSvg } from "../svgs";
import { injectMobileStyles } from "./styles";
import { isYouTubeDarkMode } from "./theme";
import * as state from "./state";
import { i18n } from "../../common/i18n";

/**
 * Creates the mobile logo icon element
 * @returns HTMLElement The created logo icon element
 */
export function createMobileLogoIcon(): HTMLElement {
    const logoIcon = document.createElement('div');
    logoIcon.className = 'mobile-friday-logo';
    logoIcon.innerHTML = `<img src="${chrome.runtime.getURL('friday_logo_48.png')}" alt="Friday AI" />`;
    
    logoIcon.addEventListener('click', () => {
        toggleFriSummaryContainer();
    });
    
    return logoIcon;
}

/**
 * Toggles the visibility of the Friday summary container
 */
export function toggleFriSummaryContainer(): void {
    const container = document.getElementById('mobile-friday-container');
    if (!container) {
        return;
    }

    const isVisible = state.toggleFriSummaryVisible();
    container.style.display = isVisible ? 'block' : 'none';
    
    // If becoming visible, initialize
    if (isVisible) {
        // Import dynamically to avoid circular dependencies
        import('./controller').then(controller => {
            controller.initializeMobileFriSummary();
        });
    }
}

/**
 * Creates the Friday summary container
 * @returns HTMLElement The created container element
 */
export function createFriSummaryContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'mobile-friday-container';
    container.className = 'mobile-friday-container';
    
    // Add header with title
    const header = document.createElement('div');
    header.className = 'mobile-friday-header';
    
    const title = document.createElement('div');
    title.className = 'mobile-friday-title';
    title.innerHTML = `Friday`;
    header.appendChild(title);
    
    // Add close button
    const closeButton = document.createElement('div');
    closeButton.className = 'mobile-friday-close';
    closeButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    closeButton.addEventListener('click', () => {
        toggleFriSummaryContainer();
    });
    header.appendChild(closeButton);
    
    // Create the container for FriSummary to insert its content into
    const summaryContent = document.createElement('div');
    summaryContent.id = 'mobile-friday-content';
    
    container.appendChild(header);
    container.appendChild(summaryContent);
    
    return container;
}

/**
 * Creates the mobile UI elements
 */
export function createMobileUI(): void {
    // Don't create UI if it already exists
    if (document.getElementById('mobile-friday-container')) {
        return; // UI already created
    }

    // Inject styles
    injectMobileStyles();

    // Create logo button
    const logoButton = document.createElement('button');
    logoButton.className = 'mobile-friday-logo';
    logoButton.id = 'mobile-friday-logo';
    logoButton.innerHTML = `<img src="${chrome.runtime.getURL('friday-logo_48.png')}" alt="Friday AI" />`;
    document.body.appendChild(logoButton);

    // Create container using the same method as insertMobileLogoIcon to ensure consistency
    const container = createFriSummaryContainer();
    document.body.appendChild(container);
    
    // Add event listeners
    logoButton.addEventListener('click', () => {
        toggleFriSummaryContainer();
    });
}

/**
 * Main function to insert the mobile logo icon and container
 */
export function insertMobileLogoIcon(): void {
    // Don't insert if already exists
    if (document.querySelector('.mobile-friday-logo')) {
        return;
    }

    // Only insert on watch pages
    if (window.location.pathname.indexOf('/watch') !== 0) {
        return;
    }

    // Inject styles
    injectMobileStyles();

    // Create and add logo icon
    const logoIcon = createMobileLogoIcon();
    document.body.appendChild(logoIcon);

    // Create and add Friday summary container
    const container = createFriSummaryContainer();
    
    // 确保容器初始状态为隐藏
    container.style.display = 'none';
    state.setFriSummaryVisible(false);
    
    document.body.appendChild(container);
} 