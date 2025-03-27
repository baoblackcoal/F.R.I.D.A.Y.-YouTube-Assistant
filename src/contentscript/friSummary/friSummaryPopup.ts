import { languageLabels, subtitleOptionLabels } from '../../common/common';
import { SubtitleType, Language } from '../../common/ISettings';
import { ICONS } from './svgs';
import { IFriSummaryState } from './friSummaryState';
import { i18nService } from './i18nService';

export interface IPopupEvents {
    onLanguageChange: (language: Language) => void;
    onAutoGenerateChange: (enabled: boolean) => void;
    onAutoPlayChange: (enabled: boolean) => void;
    onCopy: () => void;
    onDownload: () => void;
    onYoutubeSubtitleChange: (enabled: boolean) => void;
    onAutoDownloadChange: (enabled: boolean) => void;
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
        submenu.style.top = '110%';
        submenu.style.left = '0';
        this.button.appendChild(submenu);
        return submenu;
    }

    private async createMenuItems(): Promise<string> {
        const subtitleType = await this.state.getSubtitleType();
        return Object.entries(subtitleOptionLabels).map(([key, label]) => `
            <div class="fri-popup-item subtitle-item" data-subtitle-option="${key}">
                ${key === subtitleType ? ICONS.check : '<div style="width: 24px;"></div>'}
                <span style="margin-left: 4px;">${i18nService.getMessage(label)}</span>
            </div>
        `).join('');
    }


    private async initialize(): Promise<void> {
        this.submenu.innerHTML = await this.createMenuItems();

        // Button click handler
        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = this.submenu.style.display === 'block';
            
            this.updateMenuItems();     
            this.submenu.style.display = isVisible ? 'none' : 'block';
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

    private async updateMenuItems(): Promise<void> {
        this.submenu.innerHTML = await this.createMenuItems();
        
        // 为子菜单项添加点击处理
        const subtitleItems = this.submenu.querySelectorAll('.subtitle-item');
        subtitleItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // 添加active类并在延迟后移除，产生点击效果
                item.classList.add('active');
                setTimeout(() => item.classList.remove('active'), 300);
            });
        });
    }

    public destroy(): void {
        this.submenu.remove();
    }
}

export class FriSummaryPopup {
    private state: IFriSummaryState;
    private popupMenu!: HTMLElement;
    private events: IPopupEvents;

    constructor(
        initialState: IFriSummaryState,

        events: IPopupEvents,
    ) {
        this.state = initialState;
        this.events = events;
    }

    private createLanguageMenuItems(selectedLanguage: Language): string {
        return Object.entries(languageLabels).map(([key, lang]) => `
            <div class="fri-popup-item language-sub-item" data-language="${key}">
                ${key === selectedLanguage ? ICONS.check : '<div style="width: 24px;"></div>'}
                <span style="margin-left: 4px;">${lang}</span>
            </div>
        `).join('');    
    }

    private async createPopupMenu(): Promise<HTMLElement> {
        const popupMenu = document.createElement('div');
        popupMenu.className = 'fri-popup-menu';
        popupMenu.id = 'fri-summary-more-menu';
        popupMenu.innerHTML = `
            <div class="fri-popup-item" id="copy-item">
                ${ICONS.copy}
                <span>${i18nService.getMessage('summary-pupup-copy')}</span>
            </div>
            <div class="fri-popup-item" id="download-item">
                ${ICONS.download}
                <span>${i18nService.getMessage('summary-pupup-download')}</span>
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
            <div class="fri-popup-item" id="auto-download-item">
                ${ICONS.download}
                <span>${i18nService.getMessage('summary-pupup-auto-download')}</span>
                <div class="fri-toggle" id="auto-download-toggle"></div>
            </div>
            <div class="fri-popup-item" id="youtube-subtitle-item">
                ${ICONS.youtubeSubtitle}
                <span>${i18nService.getMessage('summary-pupup-youtube-subtitle')}</span>
                <div class="fri-toggle" id="youtube-subtitle-toggle"></div>
            </div>
        `;

        return popupMenu;
    }

    public async init(moreButton: HTMLElement): Promise<void> {
        this.popupMenu = await this.createPopupMenu();
        moreButton.parentElement?.appendChild(this.popupMenu);
        this.loadState();
        this.initializePopupMenuEvents(moreButton);
        this.initializeLanguageSubmenu();
        this.initializeToggleItems();
        this.initializePopupEvents();
    }

    private async loadState(): Promise<void> {
        // const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
        const autoGenerateToggle = this.popupMenu.querySelector('#auto-generate-toggle');
        const autoPlayToggle = this.popupMenu.querySelector('#auto-play-toggle');
        const autoDownloadToggle = this.popupMenu.querySelector('#auto-download-toggle');
        const youtubeSubtitleToggle = this.popupMenu.querySelector('#youtube-subtitle-toggle');
        // if (!languageSubmenu || !autoGenerateToggle || !autoPlayToggle || !autoDownloadToggle || !youtubeSubtitleToggle) return;

        // set language submenu items checked
        // languageSubmenu.innerHTML = this.createLanguageMenuItems(await this.state.getSummaryLanguage());

        // set toggle items checked
        autoGenerateToggle!.classList.toggle('active', await this.state.getAutoGenerate());
        autoPlayToggle!.classList.toggle('active', await this.state.getAutoPlay());
        autoDownloadToggle!.classList.toggle('active', await this.state.getAutoDownload());
        youtubeSubtitleToggle!.classList.toggle('active', await this.state.getYoutubeSubtitleVisible());
    }

    private initializePopupMenuEvents(moreButton: HTMLElement): void {
        moreButton.addEventListener('click', async (e) => {
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
            console.log('Failed to change language:', error);
        }
    }

    private initializeLanguageSubmenu(): void {
        const languageSubmenu = this.popupMenu.querySelector('#language-submenu');
        if (!languageSubmenu) return;

        // 为所有语言子菜单项添加点击处理
        const addClickHandlers = () => {
            const langItems = languageSubmenu.querySelectorAll('.language-sub-item');
            langItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    // 添加active类并延迟移除，产生点击效果
                    item.classList.add('active');
                    setTimeout(() => item.classList.remove('active'), 300);
                });
            });
        };
        
        // 初始添加处理程序
        addClickHandlers();

        languageSubmenu.addEventListener('click', async (e) => {
            const languageItem = (e.target as HTMLElement).closest('.language-sub-item');
            if (!languageItem) return;

            e.stopPropagation();
            const newLanguage = languageItem.getAttribute('data-language') as Language;
            if (!newLanguage || newLanguage === (await this.state.getSummaryLanguage())) return;

            await this.handleLanguageChange(newLanguage);
            
            // 更新语言后重新添加处理程序
            setTimeout(addClickHandlers, 100);
        });
    }

    private initializeToggleItems(): void {
        const toggleItems = [
            { id: 'auto-generate', onChange: this.events.onAutoGenerateChange },
            { id: 'auto-play', onChange: this.events.onAutoPlayChange },
            { id: 'auto-download', onChange: this.events.onAutoDownloadChange },
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

        copyItem?.addEventListener('click', () => {
            copyItem.classList.add('active');
            this.events.onCopy();
            setTimeout(() => copyItem.classList.remove('active'), 300);
        });
        
        downloadItem?.addEventListener('click', () => {
            downloadItem.classList.add('active');
            this.events.onDownload();
            setTimeout(() => downloadItem.classList.remove('active'), 300);
        });
    }

    public updateText(): void {
        const copyItem = this.popupMenu.querySelector('#copy-item span');
        const downloadItem = this.popupMenu.querySelector('#download-item span');
        const languageItem = this.popupMenu.querySelector('#language-item span');
        const autoGenerateItem = this.popupMenu.querySelector('#auto-generate-item span');
        const autoPlayItem = this.popupMenu.querySelector('#auto-play-item span');
        const autoDownloadItem = this.popupMenu.querySelector('#auto-download-item span');
        const youtubeSubtitleItem = this.popupMenu.querySelector('#youtube-subtitle-item span');

        copyItem!.textContent = i18nService.getMessage('summary-pupup-copy');
        downloadItem!.textContent = i18nService.getMessage('summary-pupup-download');
        //languageItem!.textContent = i18nService.getMessage('summary-pupup-language');
        autoGenerateItem!.textContent = i18nService.getMessage('summary-pupup-auto-generate');
        autoPlayItem!.textContent = i18nService.getMessage('summary-pupup-auto-play');
        autoDownloadItem!.textContent = i18nService.getMessage('summary-pupup-auto-download');
        youtubeSubtitleItem!.textContent = i18nService.getMessage('summary-pupup-youtube-subtitle');
    }
} 