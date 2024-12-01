// Function to create language menu items
function createLanguageMenuItems(selectedLanguage) {
    const languages = [
        LANGUAGES.ENGLISH,
        LANGUAGES.SIMPLE_CHINESE,
        LANGUAGES.TRAN_CHINESE
    ];
    
    return languages.map(lang => `
        <div class="fri-popup-item language-item" data-language="${lang}">
            ${lang === selectedLanguage ? ICONS.check : '<div style="width: 24px;"></div>'}
            <span style="margin-left: 4px;">${lang}</span>
        </div>
    `).join('');
}

// Function to create icon button
function createIconButton(icon, tooltip, id) {
    return `
        <div class="fri-icon-box">
            <button class="fri-icon-button" id="${id}">
                ${ICONS[icon]}
            </button>
            <div class="fri-tooltip">${tooltip}</div>
        </div>
    `;
}

// Function to create the main container
function createFriSummaryContainer() {
    const container = document.createElement('div');
    container.className = 'fri-summry-container';
    container.id = 'fri-summry-container';

    container.innerHTML = `
        <div class="fri-icons-row">
            <div class="fri-left-controls">
                ${createIconButton('paragraph', 'Generate Paragraph', 'generate-paragraph-button')}
                <div class="fri-icon-box play-pause-container">
                    <button class="fri-icon-button play-button" id="play-button">
                        ${ICONS['play']}
                    </button>
                    <button class="fri-icon-button pause-button" style="display: none;" id="pause-button">
                        ${ICONS['pause']}
                    </button>
                    <div class="fri-tooltip">Play</div>
                </div>
            </div>

            <div class="fri-summary-info-container">
                <div class="fri-summary-info"> <strong>Friday: </strong>
                    <span id="fri-summary-info-text" class="fri-summary-info-text">...</span>
                </div>
            </div>

            <div class="fri-right-controls">
                ${createIconButton('more', 'More', 'more-button')}
                ${createIconButton('settings', 'Settings', 'settings-button')}
                <div class="fri-icon-box expand-collapse-container">
                    <button class="fri-icon-button expand-button" style="display: none;">
                        ${ICONS['expand']}
                    </button>
                    <button class="fri-icon-button collapse-button">
                        ${ICONS['collapse']}
                    </button>
                    <div class="fri-tooltip">Expand</div>
                </div>
            </div>
        </div>

        <div class="fri-summary-content-container" id="fri-summary-content-container">
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
        </div>
    `;

    return container;
}

// Initialize the container
document.getElementById('root').appendChild(createFriSummaryContainer());

// Theme handling
let isDark = false;
const friSummryContainer = document.getElementById('fri-summry-container');
const themeButton = document.getElementById('themeButton');

themeButton.addEventListener('click', () => {
    isDark = !isDark;
    friSummryContainer.classList.toggle('dark');
    themeButton.setAttribute('data-lucide', isDark ? 'sun-medium' : 'moon');
});

// Button hover effects
function initializeButtonEffects() {
    const buttons = document.querySelectorAll('.fri-icon-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        });

        button.addEventListener('mousedown', () => {
            button.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        });

        button.addEventListener('mouseup', () => {
            button.style.backgroundColor = 'transparent';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
        });
    });
}


// Toggle functionality for play/pause and expand/collapse
function initializeToggleButtons() {
    // Play/Pause toggle
    const playPauseContainer = document.querySelector('.play-pause-container');
    const playButton = playPauseContainer.querySelector('.play-button');
    const pauseButton = playPauseContainer.querySelector('.pause-button');
    const playPauseTooltip = playPauseContainer.querySelector('.fri-tooltip');

    playPauseContainer.addEventListener('click', () => {
        const isPlaying = playButton.style.display !== 'none';
        playButton.style.display = isPlaying ? 'none' : 'flex';
        pauseButton.style.display = isPlaying ? 'flex' : 'none';
        playPauseTooltip.textContent = isPlaying ? 'Pause' : 'Play';
    });

    // Expand/Collapse toggle
    const expandCollapseContainer = document.querySelector('.expand-collapse-container');
    const expandButton = expandCollapseContainer.querySelector('.expand-button');
    const collapseButton = expandCollapseContainer.querySelector('.collapse-button');
    const expandCollapseTooltip = expandCollapseContainer.querySelector('.fri-tooltip');

    expandCollapseContainer.addEventListener('click', () => {
        const isCollapsed = collapseButton.style.display !== 'none';
        expandButton.style.display = isCollapsed ? 'flex' : 'none';
        collapseButton.style.display = isCollapsed ? 'none' : 'flex';
        expandCollapseTooltip.textContent = isCollapsed ? 'Collapse' : 'Expand';

        // fri-summary-content-container show or hide
        const summaryContentContainer = document.getElementById('fri-summary-content-container');
        summaryContentContainer.style.display = isCollapsed ? 'none' : 'block';
    });

    // Generate Paragraph button click
    const generateParagraphButton = document.getElementById('generate-paragraph-button');
    generateParagraphButton.addEventListener('click', () => {
        displayToast('Generate Paragraph');
    });

    // More button click
    const moreButton = document.getElementById('more-button');
    moreButton.addEventListener('click', () => {
        displayToast('More');
    });

    // Settings button click
    const settingsButton = document.getElementById('settings-button');
    settingsButton.addEventListener('click', () => {
        displayToast('Settings');
    });
}

function setFriSummryInfoText(text) {
    const friSummryInfoText = document.getElementById('fri-summary-info-text');
    
    // Add fade out effect
    friSummryInfoText.classList.add('fade-out');
    
    // Wait for fade out to complete before changing text
    setTimeout(() => {
        friSummryInfoText.textContent = text;
        
        // Force a reflow to ensure the fade-in animation plays
        friSummryInfoText.offsetHeight;
        
        // Remove fade out class to trigger fade in
        friSummryInfoText.classList.remove('fade-out');
    }, 300); // Match this with the CSS transition duration
}

// // Initialize toggle buttons after DOM content is loaded
// document.addEventListener('DOMContentLoaded', () => {
   
// });

// Popup Menu Implementation
function createPopupMenu() {
    const popupMenu = document.createElement('div');
    popupMenu.className = 'fri-popup-menu';
    
    popupMenu.innerHTML = `
        <div class="fri-popup-item" id="copy-item">
            ${ICONS.copy}
            Copy
        </div>
        <div class="fri-popup-item" id="download-item">
            ${ICONS.download}
            Download
        </div>
        <div class="fri-popup-item with-sub">
            ${ICONS.language}
            AI Language
            <div class="fri-sub-popup fri-popup-menu" id="language-submenu">
                ${createLanguageMenuItems(LANGUAGES.ENGLISH)}
            </div>
        </div>
        <div class="fri-popup-item" id="auto-generate-item">
            ${ICONS.paragraph}
            Auto Generate
            <div class="fri-toggle" id="auto-generate-toggle"></div>
        </div>
        <div class="fri-popup-item" id="auto-play-item">
            ${ICONS.play}
            Auto Play
            <div class="fri-toggle" id="auto-play-toggle"></div>
        </div>
    `;

    return popupMenu;
}

function displayToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fri-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
}

function initializePopupMenu() {
    const moreButton = document.querySelector('.fri-right-controls .fri-icon-button');
    const popupMenu = createPopupMenu();
    
    moreButton.parentElement.appendChild(popupMenu);
    
    // Toggle popup on more button click
    moreButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = popupMenu.style.display === 'block';
        popupMenu.style.display = isVisible ? 'none' : 'block';
    });

    // Close popup when clicking outside
    document.addEventListener('click', (e) => {
        if (!popupMenu.contains(e.target) && e.target !== moreButton) {
            popupMenu.style.display = 'none';
        }
    });

    // Add language selection handling
    const languageSubmenu = popupMenu.querySelector('#language-submenu');
    let currentLanguage = LANGUAGES.ENGLISH;

    languageSubmenu.addEventListener('click', (e) => {
        const languageItem = e.target.closest('.language-item');
        if (!languageItem) return;

        e.stopPropagation();
        const newLanguage = languageItem.dataset.language;
        
        if (newLanguage === currentLanguage) return;
        
        currentLanguage = newLanguage;
        languageSubmenu.innerHTML = createLanguageMenuItems(currentLanguage);
        
        // Dispatch custom event for language change
        document.dispatchEvent(new CustomEvent('languageChange', {
            detail: { language: currentLanguage }
        }));
    });


    // Add click handlers for toggle items
    const autoGenerateItem = popupMenu.querySelector('#auto-generate-item');
    const autoPlayItem = popupMenu.querySelector('#auto-play-item');
    const autoGenerateToggle = popupMenu.querySelector('#auto-generate-toggle');
    const autoPlayToggle = popupMenu.querySelector('#auto-play-toggle');

    autoGenerateItem.addEventListener('click', (e) => {
        e.stopPropagation();
        autoGenerateToggle.classList.toggle('active');
        
        // Dispatch custom event for auto generate toggle
        document.dispatchEvent(new CustomEvent('autoGenerateChange', {
            detail: { enabled: autoGenerateToggle.classList.contains('active') }
        }));
    });

    autoPlayItem.addEventListener('click', (e) => {
        e.stopPropagation();
        autoPlayToggle.classList.toggle('active');
        
        // Dispatch custom event for auto play toggle
        document.dispatchEvent(new CustomEvent('autoPlayChange', {
            detail: { enabled: autoPlayToggle.classList.contains('active') }
        }));
    });

    // Remove the previous toggle click handlers to prevent double-toggling
    autoGenerateToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        autoGenerateToggle.classList.toggle('active');
    });

    autoPlayToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        autoPlayToggle.classList.toggle('active');
    });

    // Toast display click info when click Copy and Download items
    const copyItem = document.getElementById('copy-item');
    const downloadItem = document.getElementById('download-item');

    copyItem.addEventListener('click', () => {
        displayToast('Copy');
    }); 
    downloadItem.addEventListener('click', () => {
        displayToast('Download');
    });

}

function setFriSummryInfoTextDemo() {
    // Set the multiple text every 1 seconds for fri-summary-info-text
    const texts = ['随时等候吩咐。', '正在生成总结...', '正在翻译字幕...'];
    let index = 0;
    setInterval(() => {
        setFriSummryInfoText(texts[index]);
        index = (index + 1) % texts.length;
    }, 2000);
}

// Initialize popup menu after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeButtonEffects();
    initializeToggleButtons();
    initializePopupMenu();

    setFriSummryInfoTextDemo();
});