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
            background-color: var(--yt-spec-base-background, #f9f9f9);
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
            padding: 6px 16px;
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
            display: flex;
            align-items: center;
            justify-content: center;
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
            background-color: var(--yt-spec-base-background, #f9f9f9) !important;
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 94% !important;
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
            margin-left: 12px;
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
            line-height: 1.4;
            margin: 8px 0 !important;
        }

        .fri-summary-content h3 {
            font-size: 16px;
            font-weight: 500;
            margin: 0 0 8px 0 !important;
            font-weight: bold;
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
        
        /* 移动端弹出菜单样式 */
        #fri-summary-more-menu {
            position: fixed !important;
            right: 8px !important;
            top: 170px !important;
            width: 70% !important;
            max-width: 250px !important;
            background-color: var(--yt-spec-menu-background, #ffffff) !important;
            border: 1px solid var(--yt-spec-10-percent-layer, #e5e5e5) !important;
            box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1) !important;
            z-index: 1000 !important;
            border-radius: 8px !important;
            padding: 0 !important;
            overflow: hidden !important;
        }
        
        html[dark] #fri-summary-more-menu {
            background-color: var(--yt-spec-menu-background, #282828) !important;
            border-color: var(--yt-spec-10-percent-layer, #3f3f3f) !important;
        }
        
        /* 修复菜单项点击状态 */
        .fri-popup-item, .subtitle-item {
            padding: 12px 16px !important;
            height: auto !important;
            display: flex !important;
            align-items: center !important;
            border-bottom: 1px solid var(--yt-spec-10-percent-layer, rgba(0,0,0,0.05)) !important;
        }
        
        .fri-popup-item:last-child, .subtitle-item:last-child {
            border-bottom: none !important;
        }
        
        /* 特别处理当前点击项的背景色 */
        .fri-popup-item.active,
        .fri-popup-item:active,
        .subtitle-item.active,
        .subtitle-item:active,
        .language-sub-item.active,
        .language-sub-item:active {
            background-color: var(--yt-spec-10-percent-layer, rgba(0,0,0,0.08)) !important;
        }
        
        [data-theme="dark"] .fri-popup-item.active,
        [data-theme="dark"] .fri-popup-item:active,
        [data-theme="dark"] .subtitle-item.active,
        [data-theme="dark"] .subtitle-item:active,
        [data-theme="dark"] .language-sub-item.active,
        [data-theme="dark"] .language-sub-item:active,
        html[dark] .fri-popup-item.active,
        html[dark] .fri-popup-item:active,
        html[dark] .subtitle-item.active,
        html[dark] .subtitle-item:active,
        html[dark] .language-sub-item.active,
        html[dark] .language-sub-item:active {
            background-color: var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1)) !important;
        }
        
        /* 修改菜单项中的图标颜色 */
        .fri-popup-item svg {
            fill: var(--yt-spec-text-primary, #0f0f0f) !important;
            color: var(--yt-spec-text-primary, #0f0f0f) !important;
            width: 24px !important;
            height: 24px !important;
            margin-right: 16px !important;
        }
        
        [data-theme="dark"] .fri-popup-item svg,
        html[dark] .fri-popup-item svg {
            fill: var(--yt-spec-text-primary, #ffffff) !important;
            color: var(--yt-spec-text-primary, #ffffff) !important;
        }
        
        /* 修复图标高亮状态 */
        #fri-generate-button {
            color: var(--yt-spec-text-primary, #030303) !important;
            background-color: transparent !important;
        }
        
        #fri-generate-button.active {
            color: #065fd4 !important;
            background-color: rgba(6, 95, 212, 0.1) !important;
        }
        
        html[dark] #fri-generate-button {
            color: var(--yt-spec-text-primary, #ffffff) !important;
        }
        
        html[dark] #fri-generate-button.active {
            color: #3ea6ff !important;
            background-color: rgba(62, 166, 255, 0.15) !important;
        }
        
        /* 确保toast显示正确 */
        .fri-toast-container {
            top: 60px !important;
            z-index: 9999 !important;
        }
        
        .fri-toast {
            width: auto !important;
            max-width: 90% !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
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
        
        /* 子菜单样式 */
        .fri-sub-popup {
            background-color: var(--yt-spec-menu-background, #ffffff) !important;
            border: 1px solid var(--yt-spec-10-percent-layer, #e5e5e5) !important;
            box-shadow: 0 4px 32px rgba(0, 0, 0, 0.1) !important;
            border-radius: 8px !important;
            overflow: hidden !important;
            z-index: 1001 !important;
        }
        
        [data-theme="dark"] .fri-sub-popup,
        html[dark] .fri-sub-popup {
            background-color: var(--yt-spec-menu-background, #282828) !important;
            border-color: var(--yt-spec-10-percent-layer, #3f3f3f) !important;
        }
        
        /* 子菜单项hover状态 */
        .subtitle-item:hover,
        .language-sub-item:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(0,0,0,0.05)) !important;
        }
        
        [data-theme="dark"] .subtitle-item:hover,
        [data-theme="dark"] .language-sub-item:hover,
        html[dark] .subtitle-item:hover,
        html[dark] .language-sub-item:hover {
            background-color: var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1)) !important;
        }
    `;
    document.head.appendChild(styleElement);
} 