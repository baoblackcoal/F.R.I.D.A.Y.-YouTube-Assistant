/**
 * Mobile interface entry point
 * Exports main functions for the mobile interface
 */

import { createMobileUI, insertMobileLogoIcon } from './ui';
import { setupMobileGenerateButton } from './buttons';
import { setupThemeChangeObserver } from './theme';
import { initializeMobileFriSummary } from './controller';

/**
 * Initialize mobile interface
 * This is the main entry point for the mobile interface
 */
export function initializeMobile(): void {
    createMobileUI();
    setupMobileGenerateButton();
    setupThemeChangeObserver();
}

// Export all public functions
export {
    insertMobileLogoIcon,
    initializeMobileFriSummary,
    createMobileUI
}; 