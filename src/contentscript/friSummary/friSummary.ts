import { getCopySvg, getToggleSvg, ICONS } from './svgs';
import { FriSummaryPopup, IPopupEvents, ISubtitleEvents, SubtitlePopup } from './friSummaryPopup';
import { IFriSummaryState, summaryState } from './friSummaryState';
import { i18nService } from './i18nService';
import { Language, SubtitleType } from '../../common/ISettings';
import { TTSSpeak } from '../../common/ttsSpeak';
import { settingsManager } from '../../common/settingsManager';

export class FriSummary {
    private state!: IFriSummaryState
    private tts!: TTSSpeak;
    private static instance: FriSummary;

    private constructor() {
        this.state = summaryState;    
        this.tts = TTSSpeak.getInstance();
        this.setLanguage();
    }

    public static getInstance(): FriSummary {
        if (!FriSummary.instance) {
            FriSummary.instance = new FriSummary();
        }
        return FriSummary.instance;
    }

    private async setLanguage(): Promise<void> {
        await i18nService.setLanguage(await this.state.getDisplayLanguage());
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
        const div = document.createElement('div');

        const container = div.appendChild(document.createElement('div'));
        container.className = 'fri-summry-container';
        container.id = 'fri-summry-container';

        container.innerHTML = `
            <div class="fri-summary-row">
                <div class="fri-left-controls">
                    ${this.createIconButton('paragraph', 'summary-ai-generate', 'fri-generate-button')}
                    <div class="fri-icon-box play-pause-container">
                        <button class="fri-icon-button fri-play-button" id="fri-play-button">
                            ${ICONS['play']}
                        </button>                       
                        <div class="fri-tooltip" id="play-pause-tooltip"></div>
                    </div>
                    ${this.createIconButton('subtitleGenerate', 'summary-subtitle-generate', 'fri-subtitle-generate-button')}
                </div>

                <div class="fri-summary-info-container">
                    <div class="fri-summary-info"> <strong>Friday:  </strong>
                        <span id="fri-summary-info-text" class="fri-summary-info-text">...</span>
                    </div>
                </div>

                <div class="fri-right-controls">
                    ${this.createIconButton('more', 'summary-more', 'fri-more-button')}
                    ${this.createIconButton('settings', 'summary-settings', 'fri-settings-button')}
                    <div class="fri-icon-box fri-expand-collapse-container">
                        <button class="fri-icon-button fri-expand-button" style="display: none;">
                            ${ICONS['expand']}
                        </button>
                        <button class="fri-icon-button fri-collapse-button">
                            ${ICONS['collapse']}
                        </button>
                        <div class="fri-tooltip" id="fri-expand-collapse-tooltip"></div>
                    </div>
                </div>
            </div>

            <div class="fri-summary-content-container" id="fri-summary-content-container">
                <div id="ytbs_summary_status" class="fri-summary-status-content"> </div>
                <div class="fri-summary-content" id="fri-summary-content"> </div>    
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

        return div;
    }

    private initializeToggleButtons(): void {
        this.initializeExpandCollapseToggle();
    }

    private initializeExpandCollapseToggle(): void {
        const container = document.querySelector('.fri-expand-collapse-container');
        if (!container) return;

        const expandButton = container.querySelector('.fri-expand-button') as HTMLElement;
        const collapseButton = container.querySelector('.fri-collapse-button') as HTMLElement;
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

    private initializePopupMenu(): void {
        const moreButton = document.getElementById('fri-more-button');
        if (!moreButton) return;

        const popupEvents: IPopupEvents = {
            onLanguageChange: (language: Language) => {
                summaryState.setSummaryLanguage(language);
            },
            onAutoGenerateChange: (enabled: boolean) => {
                summaryState.setAutoGenerate(enabled);
            },
            onAutoPlayChange: (enabled: boolean) => {
                summaryState.setAutoPlay(enabled);
            },
            onCopy: () => {},
            onDownload: () => {},
            onYoutubeSubtitleChange: (enabled: boolean) => {
                const youtubeSubtitleContainer = document.getElementById('yt_ai_summary_header');
                const youtubeSubtitleBody = document.getElementById('yt_ai_summary_body');
                if (!youtubeSubtitleContainer || !youtubeSubtitleBody) return;

                youtubeSubtitleContainer.style.display = enabled ? 'flex' : 'none';
                youtubeSubtitleBody.style.display = enabled ? 'block' : 'none';
                summaryState.setYoutubeSubtitleVisible(enabled);
            }
        };

        const popup = new FriSummaryPopup(
            this.state,
            popupEvents,
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

        const generateTooltip = document.getElementById('fri-generate-button-tooltip');
        if (generateTooltip) {
            generateTooltip.textContent = i18nService.getMessage('summary-ai-generate');
        }

        const subtitleTooltip = document.getElementById('fri-subtitle-generate-button-tooltip');
        if (subtitleTooltip) {
            subtitleTooltip.textContent = i18nService.getMessage('summary-subtitle-generate');
        }

        const moreTooltip = document.getElementById('fri-more-button-tooltip');
        if (moreTooltip) {
            moreTooltip.textContent = i18nService.getMessage('summary-more');
        }

        const settingsTooltip = document.getElementById('fri-settings-button-tooltip');
        if (settingsTooltip) {
            settingsTooltip.textContent = i18nService.getMessage('summary-settings');
        }   

        const expandTooltip = document.querySelector('.fri-expand-collapse-container .fri-tooltip');
        if (expandTooltip) {
            const isCollapsed = (document.querySelector('.fri-collapse-button') as HTMLElement).style.display !== 'none';
            expandTooltip.textContent = i18nService.getMessage(isCollapsed ? 'summary-expand' : 'summary-collapse');
        }
    }

    private initializeLanguageHandler(): void {
        window.addEventListener('languageChanged', () => {
            this.updateLanguageTexts();
        });
    }

    private initializeSubtitlePopup(): void {
        const subtitleButton = document.getElementById('fri-subtitle-generate-button');
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
                this.state.setSubtitleType(SubtitleType.None);
                break;
            case SubtitleType.EasyToRead:
                this.state.setSubtitleType(SubtitleType.EasyToRead);
                break;
            case SubtitleType.Podcast:
                this.state.setSubtitleType(SubtitleType.Podcast);
                break;
        }
        window.location.reload();
    }

    public init(): void {        
        const friSummaryContainer = document.getElementById('fri-summry-container');
        if (friSummaryContainer) {
            friSummaryContainer.remove();
        }
        const container = this.createFriSummaryContainer();
        document.querySelector("#bottom-row")!.insertAdjacentHTML("afterbegin", container.innerHTML);

        this.initializeToggleButtons();
        this.initializePopupMenu();
        this.initializeLanguageHandler();
        this.initializeSubtitlePopup();
        this.updateLanguageTexts();
    }
}

export function friSummaryInit(): void {
    const friSummary = FriSummary.getInstance();
    friSummary.init();
}