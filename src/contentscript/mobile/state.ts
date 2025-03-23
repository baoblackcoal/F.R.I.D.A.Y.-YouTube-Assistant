/**
 * Mobile UI state management
 * Contains state variables and functions for state manipulation
 */

// State to track if the summary container is visible or not
let _isFriSummaryVisible = false;

/**
 * Get the current visibility state of the Friday summary container
 * @returns boolean indicating whether the container is visible
 */
export function isFriSummaryVisible(): boolean {
    return _isFriSummaryVisible;
}

/**
 * Set the visibility state of the Friday summary container
 * @param isVisible boolean indicating whether the container should be visible
 */
export function setFriSummaryVisible(isVisible: boolean): void {
    _isFriSummaryVisible = isVisible;
}

/**
 * Toggle the visibility state of the Friday summary container
 * @returns boolean the new visibility state
 */
export function toggleFriSummaryVisible(): boolean {
    _isFriSummaryVisible = !_isFriSummaryVisible;
    return _isFriSummaryVisible;
} 