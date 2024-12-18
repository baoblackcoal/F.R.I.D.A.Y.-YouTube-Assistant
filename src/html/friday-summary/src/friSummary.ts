import { getCopySvg, getToggleSvg, ICONS } from './svgs.js';
import { ToastService, ThemeService, InfoTextService, LanguageService } from './test.js';
import { FriSummaryPopup, IPopupEvents, ISubtitleEvents, SubtitlePopup } from './friSummaryPopup.js';
import { IFriSummaryState, summaryState, Language, SubtitleType } from './friSummaryState.js';
import { i18nService } from './i18nService.js';


class FriSummary {
    private state!: IFriSummaryState

    private toastService!: ToastService;
    private themeService!: ThemeService;
    private infoTextService!: InfoTextService;
    private languageService!: LanguageService;
    constructor() {
        this.state = summaryState;    
        this.setLanguage();
    }

    private async setLanguage(): Promise<void> {
        await i18nService.setLanguage(this.state.getDisplayLanguage());
    }

    private initServices(): void {        
        this.toastService = new ToastService();
        this.themeService = new ThemeService();
        this.infoTextService = new InfoTextService(this.setFriInfoText);
        this.languageService = new LanguageService();
    }

    private createIconButton(icon: string, tooltip: string, id: string): string {
        return `
            <div class="fri-icon-box">
                <button class="fri-icon-button" id="${id}">
                    ${ICONS[icon]}
                </button>
                <div class="fri-tooltip" id="${id}-tooltip">${i18nService.getMessage(tooltip)}</div>
            </div>
        `;
    }

    private createFriSummaryContainer(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'fri-summry-container';
        container.id = 'fri-summry-container';

        container.innerHTML = `
            <div class="fri-summary-row">
                <div class="fri-left-controls">
                    ${this.createIconButton('paragraph', 'summary-ai-generate', 'generate-button')}
                    <div class="fri-icon-box play-pause-container">
                        <button class="fri-icon-button fri-play-button" id="fri-play-button">
                            ${ICONS['play']}
                        </button>
                        <button class="fri-icon-button pause-button" style="display: none;" id="pause-button">
                            ${ICONS['pause']}
                        </button>
                        <div class="fri-tooltip" id="play-pause-tooltip"></div>
                    </div>
                    ${this.createIconButton('subtitleGenerate', 'summary-subtitle-generate', 'subtitle-generate-button')}
                </div>

                <div class="fri-summary-info-container">
                    <div class="fri-summary-info"> <strong>Friday:  </strong>
                        <span id="fri-summary-info-text" class="fri-summary-info-text">...</span>
                    </div>
                </div>

                <div class="fri-right-controls">
                    ${this.createIconButton('more', 'summary-more', 'more-button')}
                    ${this.createIconButton('settings', 'summary-settings', 'settings-button')}
                    <div class="fri-icon-box expand-collapse-container">
                        <button class="fri-icon-button expand-button" style="display: none;">
                            ${ICONS['expand']}
                        </button>
                        <button class="fri-icon-button collapse-button">
                            ${ICONS['collapse']}
                        </button>
                        <div class="fri-tooltip" id="expand-collapse-tooltip"></div>
                    </div>
                </div>
            </div>

            <div class="fri-summary-content-container" id="fri-summary-content-container">
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
            </div>

            <div id="yt_ai_summary_header" class="yt_ai_summary_header">
                    <p> </p>
                    
                    <p class="yt_ai_summary_header_text">Transcript</p>
                    <div class="yt_ai_summary_header_actions">
                        
                        <div id="yt_ai_summary_header_copy" class="yt_ai_summary_header_action_btn yt-summary-hover-el" data-hover-label="Copy Transcript\n(Plain Text)">
                            ${getCopySvg()}
                        </div>
                        <div style="filter: brightness(0.9);" id="yt_ai_summary_header_toggle" class="yt_ai_summary_header_action_btn">
                            ${getToggleSvg()}
                        </div>
                    </div>
                </div>
                <div id="yt_ai_summary_body" class="yt_ai_summary_body">
                    <div id="yt_ai_summary_lang_select" class="yt_ai_summary_lang_select"></div>
                    <div id="yt_ai_summary_text" class="yt_ai_summary_text"></div>
                </div>
        `;

        return container;
    }

    private initializeToggleButtons(): void {
        this.initializePlayPauseToggle();
        this.initializeExpandCollapseToggle();
        this.initializeActionButtons();
    }

    private initializePlayPauseToggle(): void {
        const playPauseContainer = document.querySelector('.play-pause-container');
        if (!playPauseContainer) return;

        const playButton = playPauseContainer.querySelector('.fri-play-button') as HTMLElement;
        const pauseButton = playPauseContainer.querySelector('.pause-button') as HTMLElement;
        const tooltip = playPauseContainer.querySelector('.fri-tooltip') as HTMLElement;

        playPauseContainer.addEventListener('click', () => {
            const isPlaying = playButton.style.display !== 'none';
            playButton.style.display = isPlaying ? 'none' : 'flex';
            pauseButton.style.display = isPlaying ? 'flex' : 'none';
            tooltip.textContent = isPlaying ? i18nService.getMessage('summary-pause') : i18nService.getMessage('summary-play');
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
            tooltip.textContent = isCollapsed ? i18nService.getMessage('summary-collapse') : i18nService.getMessage('summary-expand');

            if (contentContainer) {
                contentContainer.style.display = isCollapsed ? 'none' : 'block';
            }
        });
    }

    private initializeActionButtons(): void {
        const generateButton = document.getElementById('generate-button');
        const moreButton = document.getElementById('more-button');
        const settingsButton = document.getElementById('settings-button');

        generateButton?.addEventListener('click', () => this.toastService.show('Generate Paragraph'));
        moreButton?.addEventListener('click', () => this.toastService.show('More'));
        settingsButton?.addEventListener('click', () => this.toastService.show('Settings'));
    }

    private initializePopupMenu(): void {
        const moreButton = document.getElementById('more-button');
        if (!moreButton) return;

        const popupEvents: IPopupEvents = {
            onLanguageChange: (language: Language) => {
                summaryState.setSummaryLanguage(language);
                this.toastService.show(`Language changed to ${language}`);
            },
            onAutoGenerateChange: (enabled: boolean) => {
                summaryState.setAutoGenerate(enabled);
                this.toastService.show(`Auto Generate: changed to ${enabled}`);
            },
            onAutoPlayChange: (enabled: boolean) => {
                summaryState.setAutoPlay(enabled);
                this.toastService.show(`Auto Play: changed to ${enabled}`);
            },
            onCopy: () => this.toastService.show('Copy'),
            onDownload: () => this.toastService.show('Download'),
            onYoutubeSubtitleChange: (enabled: boolean) => {
                const youtubeSubtitleContainer = document.getElementById('yt_ai_summary_header');
                const youtubeSubtitleBody = document.getElementById('yt_ai_summary_body');
                if (!youtubeSubtitleContainer || !youtubeSubtitleBody) return;

                youtubeSubtitleContainer.style.display = enabled ? 'flex' : 'none';
                youtubeSubtitleBody.style.display = enabled ? 'block' : 'none';
                summaryState.setYoutubeSubtitleVisible(enabled);
                this.toastService.show(`Youtube Subtitle: changed to ${enabled}`);
            }
        };

        const popup = new FriSummaryPopup(
            this.state,
            popupEvents,
            this.toastService
        );
        
        popup.init(moreButton as HTMLElement);
    }

    public setFriInfoText(text: string): void {
        const infoTextElement = document.getElementById('fri-summary-info-text');
        if (!infoTextElement) return;

        infoTextElement.classList.add('fade-out');
        
        setTimeout(() => {
            infoTextElement.textContent = text;
            infoTextElement.offsetHeight; 
            infoTextElement.classList.remove('fade-out');
        }, 300);
    }

    private updateLanguageTexts(): void {
        const playTooltip = document.querySelector('.play-pause-container .fri-tooltip');
        if (playTooltip) {
            const isPlaying = (document.querySelector('.fri-play-button') as HTMLElement).style.display !== 'none';
            playTooltip.textContent = i18nService.getMessage(isPlaying ? 'summary-play' : 'summary-pause');
        }

        const generateTooltip = document.getElementById('generate-button-tooltip');
        if (generateTooltip) {
            generateTooltip.textContent = i18nService.getMessage('summary-ai-generate');
        }

        const subtitleTooltip = document.getElementById('subtitle-generate-button-tooltip');
        if (subtitleTooltip) {
            subtitleTooltip.textContent = i18nService.getMessage('summary-subtitle-generate');
        }

        const moreTooltip = document.getElementById('more-button-tooltip');
        if (moreTooltip) {
            moreTooltip.textContent = i18nService.getMessage('summary-more');
        }

        const settingsTooltip = document.getElementById('settings-button-tooltip');
        if (settingsTooltip) {
            settingsTooltip.textContent = i18nService.getMessage('summary-settings');
        }   

        const expandTooltip = document.querySelector('.expand-collapse-container .fri-tooltip');
        if (expandTooltip) {
            const isCollapsed = (document.querySelector('.collapse-button') as HTMLElement).style.display !== 'none';
            expandTooltip.textContent = i18nService.getMessage(isCollapsed ? 'summary-expand' : 'summary-collapse');
        }
    }

    private initializeLanguageHandler(): void {
        window.addEventListener('languageChanged', () => {
            this.updateLanguageTexts();
        });
    }

    private initializeSubtitlePopup(): void {
        const subtitleButton = document.getElementById('subtitle-generate-button');
        if (!subtitleButton) return;

        const subtitleEvents: ISubtitleEvents = {
            onSubtitleOptionChange: (option: SubtitleType) => {
                this.handleSubtitleOptionChange(option);
            }
        };


        const popup = new SubtitlePopup(
            subtitleButton,
            this.state,
            subtitleEvents
        );
        
    }

    private handleSubtitleOptionChange(option: SubtitleType): void {
        this.state.setSubtitleType(option);
        
        switch (option) {
            case SubtitleType.None:
                this.toastService.show('Subtitle disabled');
                break;
            case SubtitleType.SubtitleTranslate:
                this.toastService.show('SubtitleTranslate');
                break;
            case SubtitleType.SubtitleToPodcast:
                this.toastService.show('SubtitleToPodcast');
                break;
        }
    }

    public init(): void {
        const root = document.getElementById('#bottom-row');
        if (!root) return;

        root.appendChild(this.createFriSummaryContainer());

        document.addEventListener('DOMContentLoaded', () => {
            this.initializeToggleButtons();
            this.initializePopupMenu();
            this.initializeLanguageHandler();
            this.initializeSubtitlePopup();
            this.updateLanguageTexts();
            this.initServices();
            this.infoTextService.startDemo();
        });
    }
}

// Initialize the FriSummary component
const friSummary = new FriSummary();
friSummary.init(); 