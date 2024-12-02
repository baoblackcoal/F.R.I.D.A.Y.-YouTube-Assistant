import { ICONS, LANGUAGES } from './svgs.js';

interface FriSummaryState {
    isDark: boolean;
    currentLanguage: string;
}

interface ToastOptions {
    duration?: number;
    className?: string;
}

class FriSummary {
    private state: FriSummaryState = {
        isDark: false,
        currentLanguage: LANGUAGES.ENGLISH
    };

    private createLanguageMenuItems(selectedLanguage: string): string {
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

    private createIconButton(icon: string, tooltip: string, id: string): string {
        return `
            <div class="fri-icon-box">
                <button class="fri-icon-button" id="${id}">
                    ${ICONS[icon]}
                </button>
                <div class="fri-tooltip">${tooltip}</div>
            </div>
        `;
    }

    private createFriSummaryContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'fri-summry-container';
        container.id = 'fri-summry-container';

        container.innerHTML = `
            <div class="fri-icons-row">
                <div class="fri-left-controls">
                    ${this.createIconButton('paragraph', 'Generate Paragraph', 'generate-paragraph-button')}
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
                    ${this.createIconButton('more', 'More', 'more-button')}
                    ${this.createIconButton('settings', 'Settings', 'settings-button')}
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
            </div>
        `;

        return container;
    }

    private initializeButtonEffects(): void {
        const buttons = document.querySelectorAll('.fri-icon-button');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                (button as HTMLElement).style.backgroundColor = 
                    this.state.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            });

            button.addEventListener('mousedown', () => {
                (button as HTMLElement).style.backgroundColor = 
                    this.state.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
            });

            button.addEventListener('mouseup', () => {
                (button as HTMLElement).style.backgroundColor = 'transparent';
            });

            button.addEventListener('mouseleave', () => {
                (button as HTMLElement).style.backgroundColor = 'transparent';
            });
        });
    }

    private initializeToggleButtons(): void {
        this.initializePlayPauseToggle();
        this.initializeExpandCollapseToggle();
        this.initializeActionButtons();
    }

    private initializePlayPauseToggle(): void {
        const playPauseContainer = document.querySelector('.play-pause-container');
        if (!playPauseContainer) return;

        const playButton = playPauseContainer.querySelector('.play-button') as HTMLElement;
        const pauseButton = playPauseContainer.querySelector('.pause-button') as HTMLElement;
        const tooltip = playPauseContainer.querySelector('.fri-tooltip') as HTMLElement;

        playPauseContainer.addEventListener('click', () => {
            const isPlaying = playButton.style.display !== 'none';
            playButton.style.display = isPlaying ? 'none' : 'flex';
            pauseButton.style.display = isPlaying ? 'flex' : 'none';
            tooltip.textContent = isPlaying ? 'Pause' : 'Play';
        });
    }

    private initializeExpandCollapseToggle(): void {
        const container = document.querySelector('.expand-collapse-container');
        if (!container) return;

        const expandButton = container.querySelector('.expand-button') as HTMLElement;
        const collapseButton = container.querySelector('.collapse-button') as HTMLElement;
        const tooltip = container.querySelector('.fri-tooltip') as HTMLElement;
        const contentContainer = document.getElementById('fri-summary-content-container');

        container.addEventListener('click', () => {
            const isCollapsed = collapseButton.style.display !== 'none';
            expandButton.style.display = isCollapsed ? 'flex' : 'none';
            collapseButton.style.display = isCollapsed ? 'none' : 'flex';
            tooltip.textContent = isCollapsed ? 'Collapse' : 'Expand';

            if (contentContainer) {
                contentContainer.style.display = isCollapsed ? 'none' : 'block';
            }
        });
    }

    private initializeActionButtons(): void {
        const generateButton = document.getElementById('generate-paragraph-button');
        const moreButton = document.getElementById('more-button');
        const settingsButton = document.getElementById('settings-button');

        generateButton?.addEventListener('click', () => this.displayToast('Generate Paragraph'));
        moreButton?.addEventListener('click', () => this.displayToast('More'));
        settingsButton?.addEventListener('click', () => this.displayToast('Settings'));
    }

    private createPopupMenu(): HTMLElement {
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
                    ${this.createLanguageMenuItems(this.state.currentLanguage)}
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

    private initializePopupMenu(): void {
        const moreButton = document.querySelector('.fri-right-controls .fri-icon-button');
        if (!moreButton) return;

        const popupMenu = this.createPopupMenu();
        moreButton.parentElement?.appendChild(popupMenu);

        this.initializePopupMenuEvents(moreButton as HTMLElement, popupMenu);
        this.initializeLanguageSubmenu(popupMenu);
        this.initializeToggleItems(popupMenu);
    }

    private initializePopupMenuEvents(moreButton: HTMLElement, popupMenu: HTMLElement): void {
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = popupMenu.style.display === 'block';
            popupMenu.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!popupMenu.contains(e.target as Node) && e.target !== moreButton) {
                popupMenu.style.display = 'none';
            }
        });
    }

    private initializeLanguageSubmenu(popupMenu: HTMLElement): void {
        const languageSubmenu = popupMenu.querySelector('#language-submenu');
        if (!languageSubmenu) return;

        languageSubmenu.addEventListener('click', (e) => {
            const languageItem = (e.target as HTMLElement).closest('.language-item');
            if (!languageItem) return;

            e.stopPropagation();
            const newLanguage = languageItem.getAttribute('data-language');
            if (!newLanguage || newLanguage === this.state.currentLanguage) return;

            this.state.currentLanguage = newLanguage;
            languageSubmenu.innerHTML = this.createLanguageMenuItems(this.state.currentLanguage);

            document.dispatchEvent(new CustomEvent('languageChange', {
                detail: { language: this.state.currentLanguage }
            }));
        });
    }

    private initializeToggleItems(popupMenu: HTMLElement): void {
        const toggleItems = ['auto-generate', 'auto-play'];

        toggleItems.forEach(item => {
            const toggleItem = popupMenu.querySelector(`#${item}-item`);
            const toggle = popupMenu.querySelector(`#${item}-toggle`);
            if (!toggleItem || !toggle) return;

            toggleItem.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle.classList.toggle('active');

                document.dispatchEvent(new CustomEvent(`${item}Change`, {
                    detail: { enabled: toggle.classList.contains('active') }
                }));
            });
        });
    }

    private setFriSummryInfoText(text: string): void {
        const infoText = document.getElementById('fri-summary-info-text');
        if (!infoText) return;

        infoText.classList.add('fade-out');
        
        setTimeout(() => {
            infoText.textContent = text;
            infoText.offsetHeight; // Force reflow
            infoText.classList.remove('fade-out');
        }, 300);
    }

    
    private displayToast(message: string, options: ToastOptions = {}): void {
        const toast = document.createElement('div');
        toast.className = `fri-toast ${options.className || ''}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, options.duration || 3000);
    }

    private setFriSummryInfoTextDemo(): void {
        const texts = ['随时等候吩咐。', '正在生成总结...', '正在翻译字幕...'];
        let index = 0;
        setInterval(() => {
            this.setFriSummryInfoText(texts[index]);
            index = (index + 1) % texts.length;
        }, 2000);
    }

    private initializeThemeToggle(): void {
        const themeButton = document.getElementById('themeButton');
        const friSummryContainer = document.getElementById('fri-summry-container');
        if (!themeButton || !friSummryContainer) return;

        themeButton.addEventListener('click', () => {
            this.state.isDark = !this.state.isDark;
            friSummryContainer.classList.toggle('dark');
            themeButton.setAttribute('data-lucide', this.state.isDark ? 'sun-medium' : 'moon');
        });
    }

    public init(): void {
        const root = document.getElementById('root');
        if (!root) return;

        root.appendChild(this.createFriSummaryContainer());

        document.addEventListener('DOMContentLoaded', () => {
            this.initializeButtonEffects();
            this.initializeToggleButtons();
            this.initializePopupMenu();

            this.setFriSummryInfoTextDemo();
            this.initializeThemeToggle();
        });
    }
}

// Initialize the FriSummary component
const friSummary = new FriSummary();
friSummary.init(); 