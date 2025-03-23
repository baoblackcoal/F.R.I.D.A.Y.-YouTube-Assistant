/**
 * Mobile UI components
 * Contains UI creation and management functions
 */

import { getLogoSvg } from "../svgs";
import { injectMobileStyles } from "./styles";
import { isYouTubeDarkMode } from "./theme";
import { toggleFriSummaryContainer } from "./controller";

// State to track if the summary container is visible or not
export let isFriSummaryVisible = false;

/**
 * Creates the mobile logo icon element
 * @returns HTMLElement The created logo icon element
 */
export function createMobileLogoIcon(): HTMLElement {
    const logoIcon = document.createElement('div');
    logoIcon.className = 'mobile-friday-logo';
    logoIcon.innerHTML = getLogoSvg();
    
    logoIcon.addEventListener('click', () => {
        toggleFriSummaryContainer();
    });
    
    return logoIcon;
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
    
    document.body.appendChild(container);
    
    // Add event listeners
    logoButton.addEventListener('click', () => {
        container.style.display = 'block';
        isFriSummaryVisible = true;
    });
    
    closeButton.addEventListener('click', () => {
        container.style.display = 'none';
        isFriSummaryVisible = false;
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
    document.body.appendChild(container);
} 