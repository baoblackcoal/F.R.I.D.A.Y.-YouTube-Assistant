import { Language, languageLabels, SubtitleType } from './friSummaryState.js';
import { ICONS } from './svgs.js';
import { ToastService } from './test.js';
import { IFriSummaryState } from './friSummaryState.js';
import { i18nService } from './i18nService.js';

// export type SubtitleOption = 'none' | 'translate' | 'podcast';

export const subtitleOptionLabels: Record<SubtitleType, string> = {
    [SubtitleType.None]: 'summary-subtitle-none',
    [SubtitleType.SubtitleTranslate]: 'summary-subtitle-translate',
    [SubtitleType.SubtitleToPodcast]: 'summary-subtitle-to-podcast'
};

export interface IPopupEvents {
    onLanguageChange: (language: Language) => void;
    onAutoGenerateChange: (enabled: boolean) => void;
    onAutoPlayChange: (enabled: boolean) => void;
    onCopy: () => void;
    onDownload: () => void;
    onYoutubeSubtitleChange: (enabled: boolean) => void;
}

export interface ISubtitleEvents {
    onSubtitleOptionChange: (option: SubtitleType) => void;
}

export class SubtitlePopup {
    private submenu: HTMLElement;
    private button: HTMLElement;
    private state: IFriSummaryState;
    private events: ISubtitleEvents;

    constructor(
        button: HTMLElement,
        state: IFriSummaryState,
        events: ISubtitleEvents
    ) {
        this.button = button;
        this.state = state;
        this.events = events;
        this.submenu = this.createSubmenu();
        this.initialize();
    }

    private createSubmenu(): HTMLElement {
        const submenu = document.createElement('div');
        submenu.className = 'fri-sub-popup fri-popup-menu';
        submenu.id = 'subtitle-submenu';
        submenu.style.display = 'none';
        document.body.appendChild(submenu);
        return submenu;
    }

    private createMenuItems(): string {
        return Object.entries(subtitleOptionLabels).map(([key, label]) => `
            <div class="fri-popup-item subtitle-item" data-subtitle-option="${key}">
                ${key === this.state.getSubtitleType() ? ICONS.check : '<div style="width: 24px;"></div>'}
                <span style="margin-left: 4px;">${i18nService.getMessage(label)}</span>
            </div>
        `).join('');
    }

    private positionSubmenu(): void {
        const buttonRect = this.button.getBoundingClientRect();
        this.submenu.style.top = `${buttonRect.bottom + 5}px`;
        this.submenu.style.left = `${buttonRect.left}px`;
    }

    private initialize(): void {
        this.submenu.innerHTML = this.createMenuItems();

        // Button click handler
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = this.submenu.style.display === 'block';
            this.submenu.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.positionSubmenu();
            } 
            this.updateMenuItems();     
        });

        // Submenu item click handler
        this.submenu.addEventListener('click', async (e) => {
            const subtitleItem = (e.target as HTMLElement).closest('.subtitle-item');
            if (!subtitleItem) return;

            e.stopPropagation();
            const newOption = subtitleItem.getAttribute('data-subtitle-option') as SubtitleType;
            if (!newOption) return;

            this.events.onSubtitleOptionChange(newOption);
            this.submenu.style.display = 'none';
            this.updateMenuItems();
        });

        // Close submenu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.submenu.contains(e.target as Node) && e.target !== this.button) {
                this.submenu.style.display = 'none';
            }
        });
    }

    private updateMenuItems(): void {
        this.submenu.innerHTML = this.createMenuItems();
    }

    public destroy(): void {
        this.submenu.remove();
    }
}

export class FriSummaryPopup {
    private state: IFriSummaryState;
    private popupMenu: HTMLElement;
    private toastService: ToastService;
    private events: IPopupEvents;

    constructor(
        initialState: IFriSummaryState,

        events: IPopupEvents,
        toastService: ToastService
    ) {
        this.state = initialState;
        this.events = events;
        this.toastService = toastService;
        this.popupMenu = this.createPopupMenu();
    }

    private createLanguageMenuItems(selectedLanguage: Language): string {
        return Object.entries(languageLabels).map(([key, lang]) => `
            <div class="fri-popup-item language-sub-item" data-language="${key}">
                ${key === selectedLanguage ? ICONS.check : '<div style="width: 24px;"></div>'}
                <span style="margin-left: 4px;">${lang}</span>
            </div>
        `).join('');    
    }

    private createPopupMenu(): HTMLElement {
        const popupMenu = document.createElement('div');
        popupMenu.className = 'fri-popup-menu';
        
        popupMenu.innerHTML = `
            <div class="fri-popup-item" id="copy-item">
                ${ICONS.copy}
                <span>${i18nService.getMessage('summary-pupup-copy')}</span>
            </div>
            <div class="fri-popup-item" id="download-item">
                ${ICONS.download}
                <span>${i18nService.getMessage('summary-pupup-download')}</span>
            </div>
            <div class="fri-popup-item with-sub" id="language-item">
                ${ICONS.language}
                <span>${i18nService.getMessage('summary-pupup-language')}</span>
                <div class="fri-sub-popup-arrow">${ICONS.subPopupArrow}</div>
                <div class="fri-sub-popup fri-popup-menu" id="language-submenu">
                    ${this.createLanguageMenuItems(this.state.getSummaryLanguage())}
                </div>
            </div>
            <div class="fri-popup-item" id="auto-generate-item">
                ${ICONS.paragraph}
                <span>${i18nService.getMessage('summary-pupup-auto-generate')}</span>
                <div class="fri-toggle" id="auto-generate-toggle"></div>
            </div>
            <div class="fri-popup-item" id="auto-play-item">
                ${ICONS.play}
                <span>${i18nService.getMessage('summary-pupup-auto-play')}</span>
                <div class="fri-toggle" id="auto-play-toggle"></div>
            </div>
            <div class="fri-popup-item" id="youtube-subtitle-item">
                ${ICONS.youtubeSubtitle}
                <span>${i18nService.getMessage('summary-pupup-youtube-subtitle')}</span>
                <div class="fri-toggle" id="youtube-subtitle-toggle"></div>
            </div>
        `;

        return popupMenu;
    }

    public init(moreButton: HTMLElement): void {
        moreButton.parentElement?.appendChild(this.popupMenu);
        this.loadState();
        this.initializePopupMenuEvents(moreButton);
        this.initializeLanguageSubmenu();
        this.initializeToggleItems();
        this.initializePopupEvents();
    }

    private loadState(): void {
        const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
        const autoGenerateToggle = this.popupMenu.querySelector('#auto-generate-toggle');
        const autoPlayToggle = this.popupMenu.querySelector('#auto-play-toggle');
        const youtubeSubtitleToggle = this.popupMenu.querySelector('#youtube-subtitle-toggle');
        if (!languageSubmenu || !autoGenerateToggle || !autoPlayToggle || !youtubeSubtitleToggle) return;

        // set language submenu items checked
        languageSubmenu.innerHTML = this.createLanguageMenuItems(this.state.getSummaryLanguage());

        // set toggle items checked
        autoGenerateToggle.classList.toggle('active', this.state.getAutoGenerate());
        autoPlayToggle.classList.toggle('active', this.state.getAutoPlay());
        youtubeSubtitleToggle.classList.toggle('active', this.state.getYoutubeSubtitleVisible());
    }

    private initializePopupMenuEvents(moreButton: HTMLElement): void {
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = this.popupMenu.style.display === 'block';
            this.popupMenu.style.display = isVisible ? 'none' : 'block';
            this.updateText();
        });

        document.addEventListener('click', (e) => {
            if (!this.popupMenu.contains(e.target as Node) && e.target !== moreButton) {
                this.popupMenu.style.display = 'none';
            }
        });
    }

    private async handleLanguageChange(newLanguage: Language): Promise<void> {
        try {
            const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
            if (languageSubmenu) {
                languageSubmenu.innerHTML = this.createLanguageMenuItems(newLanguage);
            }
            this.events.onLanguageChange(newLanguage);
        } catch (error) {
            console.error('Failed to change language:', error);
            this.toastService.show('Failed to change language');
        }
    }

    private initializeLanguageSubmenu(): void {
        const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
        if (!languageSubmenu) return;

        languageSubmenu.addEventListener('click', async (e) => {
            const languageItem = (e.target as HTMLElement).closest('.language-sub-item');
            if (!languageItem) return;

            e.stopPropagation();
            const newLanguage = languageItem.getAttribute('data-language') as Language;
            if (!newLanguage || newLanguage === this.state.getSummaryLanguage()) return;

            await this.handleLanguageChange(newLanguage);
        });
    }

    private initializeToggleItems(): void {
        const toggleItems = [
            { id: 'auto-generate', onChange: this.events.onAutoGenerateChange },
            { id: 'auto-play', onChange: this.events.onAutoPlayChange },
            { id: 'youtube-subtitle', onChange: this.events.onYoutubeSubtitleChange }
        ];

        toggleItems.forEach(({ id, onChange }) => {
            const toggleItem = this.popupMenu.querySelector(`#${id}-item`);
            const toggle = this.popupMenu.querySelector(`#${id}-toggle`);            
            if (!toggleItem || !toggle) return;

            toggleItem.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle.classList.toggle('active');
                onChange(toggle.classList.contains('active'));
            });
        });
    }

    private initializePopupEvents(): void {
        const copyItem = this.popupMenu.querySelector('#copy-item');
        const downloadItem = this.popupMenu.querySelector('#download-item');

        copyItem?.addEventListener('click', () => this.events.onCopy());
        downloadItem?.addEventListener('click', () => this.events.onDownload());
    }

    public updateText(): void {
        const copyItem = this.popupMenu.querySelector('#copy-item span');
        const downloadItem = this.popupMenu.querySelector('#download-item span');
        const languageItem = this.popupMenu.querySelector('#language-item span');
        const autoGenerateItem = this.popupMenu.querySelector('#auto-generate-item span');
        const autoPlayItem = this.popupMenu.querySelector('#auto-play-item span');
        const youtubeSubtitleItem = this.popupMenu.querySelector('#youtube-subtitle-item span');

        copyItem!.textContent = i18nService.getMessage('summary-pupup-copy');
        downloadItem!.textContent = i18nService.getMessage('summary-pupup-download');
        languageItem!.textContent = i18nService.getMessage('summary-pupup-language');
        autoGenerateItem!.textContent = i18nService.getMessage('summary-pupup-auto-generate');
        autoPlayItem!.textContent = i18nService.getMessage('summary-pupup-auto-play');
        youtubeSubtitleItem!.textContent = i18nService.getMessage('summary-pupup-youtube-subtitle');
    }
} 