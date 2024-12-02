import { ICONS, LANGUAGES } from './svgs.js';
import { ToastService } from './test.js';

export interface PopupState {
    currentLanguage: string;
    isDark: boolean;
}

export interface PopupEvents {
    onLanguageChange: (language: string) => void;
    onAutoGenerateChange: (enabled: boolean) => void;
    onAutoPlayChange: (enabled: boolean) => void;
    onCopy: () => void;
    onDownload: () => void;
}

export class FriSummaryPopup {
    private state: PopupState;
    private popupMenu: HTMLElement;
    private toastService: ToastService;
    private events: PopupEvents;

    constructor(
        initialState: PopupState,
        events: PopupEvents,
        toastService: ToastService
    ) {
        this.state = initialState;
        this.events = events;
        this.toastService = toastService;
        this.popupMenu = this.createPopupMenu();
    }

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

    public init(moreButton: HTMLElement): void {
        moreButton.parentElement?.appendChild(this.popupMenu);
        this.initializePopupMenuEvents(moreButton);
        this.initializeLanguageSubmenu();
        this.initializeToggleItems();
        this.initializePopupEvents();
    }

    private initializePopupMenuEvents(moreButton: HTMLElement): void {
        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = this.popupMenu.style.display === 'block';
            this.popupMenu.style.display = isVisible ? 'none' : 'block';
        });

        document.addEventListener('click', (e) => {
            if (!this.popupMenu.contains(e.target as Node) && e.target !== moreButton) {
                this.popupMenu.style.display = 'none';
            }
        });
    }

    private initializeLanguageSubmenu(): void {
        const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
        if (!languageSubmenu) return;

        languageSubmenu.addEventListener('click', (e) => {
            const languageItem = (e.target as HTMLElement).closest('.language-item');
            if (!languageItem) return;

            e.stopPropagation();
            const newLanguage = languageItem.getAttribute('data-language');
            if (!newLanguage || newLanguage === this.state.currentLanguage) return;

            this.state.currentLanguage = newLanguage;
            languageSubmenu.innerHTML = this.createLanguageMenuItems(this.state.currentLanguage);
            this.events.onLanguageChange(newLanguage);
        });
    }

    private initializeToggleItems(): void {
        const toggleItems = [
            { id: 'auto-generate', onChange: this.events.onAutoGenerateChange },
            { id: 'auto-play', onChange: this.events.onAutoPlayChange }
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
} 