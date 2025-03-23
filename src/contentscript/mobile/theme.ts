/**
 * Theme utilities for mobile interface
 * Manages theme detection and theme changes observation
 */

/**
 * Detects if YouTube is currently in dark mode
 * @returns boolean indicating whether YouTube is in dark mode
 */
export function isYouTubeDarkMode(): boolean {
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
 * Sets up a mutation observer to detect theme changes and updates UI accordingly
 */
export function setupThemeChangeObserver(): void {
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