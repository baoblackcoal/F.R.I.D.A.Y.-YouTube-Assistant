/**
 * Mobile UI styles
 * Contains all CSS styles for the mobile interface
 */

/**
 * Creates and injects CSS for the mobile UI
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
            background-color: var(--yt-spec-base-background, #ffffff) !important;
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12px !important;
        }
        
        [data-theme="dark"] .fri-summry-container,
        html[dark] .fri-summry-container {
            background-color: var(--yt-spec-base-background, #0f0f0f) !important;
            color: var(--yt-spec-text-primary, #ffffff) !important;
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
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
            font-size: 14px;
            font-weight: 400;
        }
        
        [data-theme="dark"] .fri-summary-info,
        html[dark] .fri-summary-info {
            color: var(--yt-spec-text-primary, #ffffff) !important;
        }
        
        .fri-icon-box {
            margin: 0 4px;
        }
        
        .fri-icon-button {
            color: var(--yt-spec-text-secondary, #606060) !important;
            background: transparent !important;
        }
        
        [data-theme="dark"] .fri-icon-button,
        html[dark] .fri-icon-button {
            color: var(--yt-spec-text-secondary, #aaaaaa) !important;
        }
        
        .fri-icon-button:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.05)) !important;
        }
        
        [data-theme="dark"] .fri-icon-button:hover,
        html[dark] .fri-icon-button:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1)) !important;
        }
        
        .fri-left-controls, .fri-right-controls {
            border: none !important;
            padding: 0 !important;
        }
        
        .fri-summary-content-container {
            border-top: 1px solid var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.1)) !important;
            padding: 16px 0 !important;
            margin-top: 0 !important;
        }
        
        [data-theme="dark"] .fri-summary-content-container,
        html[dark] .fri-summary-content-container {
            border-top: 1px solid var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1)) !important;
        }
        
        .fri-summary-content p {
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
            font-size: 14px;
            line-height: 1.4;
            margin: 8px 0 !important;
        }
        
        [data-theme="dark"] .fri-summary-content p,
        html[dark] .fri-summary-content p {
            color: var(--yt-spec-text-primary, #ffffff) !important;
        }
        
        /* 调整菜单项样式 */
        .fri-popup-item {
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
        }
        
        [data-theme="dark"] .fri-popup-item,
        html[dark] .fri-popup-item {
            color: var(--yt-spec-text-primary, #ffffff) !important;
        }
        
        .fri-popup-item:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.05)) !important;
        }
        
        [data-theme="dark"] .fri-popup-item:hover,
        html[dark] .fri-popup-item:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1)) !important;
        }
        
        /* Dark mode overrides */
        html[dark] .mobile-friday-logo {
            background-color: #282828;
        }
        
        html[dark] .fri-summary-info,
        html[dark] .fri-summary-content p {
            color: var(--yt-spec-text-primary, #fff);
        }
        
        html[dark] .fri-summary-content-container {
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