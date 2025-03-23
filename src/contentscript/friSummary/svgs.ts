interface Icons {
    [key: string]: string;
}

export const ICONS: Icons = {
    srt: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M4 6h16M4 10h12M4 14h16M4 18h8" stroke-linecap="round"></path>
</svg>`,  
    paragraph: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 6h16M4 10h12M4 14h16M4 18h8" stroke-linecap="round"></path>
    </svg>`,    
    play: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z"></path>
    </svg>`,
    pause: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M8 5c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1zm8 0c-.55 0-1 .45-1 1v12c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1z"></path>
    </svg>`,
    subtitleGenerate: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" >
        <rect rx="2" id="svg_7" height="14.92869" width="20.53883" y="4.66194" x="1.54405" stroke-width="1.5"/>
        <text font-weight="bold" xml:space="preserve" text-anchor="start" font-size="10" id="svg_9" y="15.59696" x="5.06228" stroke-width="0" fill="currentColor">SG</text>
    </svg>`,
    settings: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"></path>
    </svg>`,
    more: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
    </svg>`,
    expand: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`,
    collapse: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 15l6-6 6 6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>`,
    copy: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
    </svg>`,
    download: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>`,
    language: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
    </svg>`,
    check: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
    </svg>`,
    subPopupArrow: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
        <path d="M9.4 18.4l-.7-.7 5.6-5.6-5.7-5.7.7-.7 6.4 6.4-6.3 6.3z"/>
    </svg>`,
    youtubeSubtitle: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" >
        <rect rx="2" id="svg_7" height="14.92869" width="20.53883" y="4.66194" x="1.54405" stroke-width="1.5"/>
        <text font-weight="bold" xml:space="preserve" text-anchor="start" font-size="10" id="svg_9" y="15.59696" x="5.06228" stroke-width="0" fill="currentColor">CC</text>
    </svg>`
};

// Function to get the copy button SVG
export const getCopySvg = () => `
<svg style="filter: brightness(0.95);" width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 6.6V5C7 4.44772 7.44772 4 8 4H18C18.5523 4 19 4.44772 19 5V16C19 16.5523 18.5523 17 18 17H16.2308" stroke="#828282" stroke-width="1.5"/>
    <rect x="4.75" y="6.75" width="11.5" height="13.5" rx="1.25" stroke="#828282" stroke-width="1.5"/>
</svg>
`;

// Function to get the toggle button SVG
export const getToggleSvg = () => `
<svg width="28" height="28" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.2447 9.9588C16.5376 9.6659 16.5376 9.19103 16.2447 8.89814C15.9518 8.60524 15.4769 8.60524 15.184 8.89814L16.2447 9.9588ZM6.81611 8.89814C6.52322 8.60524 6.04835 8.60524 5.75545 8.89814C5.46256 9.19103 5.46256 9.6659 5.75545 9.9588L6.81611 8.89814ZM11.7425 14.461L16.2447 9.9588L15.184 8.89814L10.6819 13.4003L11.7425 14.461ZM11.3183 13.4003L6.81611 8.89814L5.75545 9.9588L10.2576 14.461L11.3183 13.4003ZM10.6819 13.4003C10.8576 13.2246 11.1425 13.2246 11.3183 13.4003L10.2576 14.461C10.6677 14.871 11.3325 14.871 11.7425 14.461L10.6819 13.4003Z" fill="#8B8B8B"/>
</svg>
`;
