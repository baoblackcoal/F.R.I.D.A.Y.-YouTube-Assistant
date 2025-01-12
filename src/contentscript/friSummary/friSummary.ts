import { getCopySvg, getToggleSvg, ICONS } from './svgs';
import { FriSummaryPopup, IPopupEvents, ISubtitleEvents, SubtitlePopup } from './friSummaryPopup';
import { IFriSummaryState, summaryState } from './friSummaryState';
import { i18nService } from './i18nService';
import { Language, SubtitleType } from '../../common/ISettings';
import { TTSSpeak } from '../../common/ttsSpeak';
import { settingsManager } from '../../common/settingsManager';
import { copyTextToClipboard } from '../copy';
import { Toast } from '../../common/toast';
import { getVideoTitle } from '../subtitleSummary/subtitleSummary';
import { SubtitleSummaryView } from '../subtitleSummary/view/subtitleSummaryView';
import { toggleYoutubeSubtitle } from '../youtube';
import { common, Env, GenerateStatus } from '../../common/common';

export class FriSummary {
    private state!: IFriSummaryState
    private tts!: TTSSpeak;
    private static instance: FriSummary;

    private constructor() {
        this.state = summaryState;    
        this.tts = TTSSpeak.getInstance();
        this.setLanguage();
        this.handleEvents();
    }

    public static getInstance(): FriSummary {
        if (!FriSummary.instance) {
            FriSummary.instance = new FriSummary();
        }
        return FriSummary.instance;
    }

    private handleEvents(): void {
        window.addEventListener('GenerateStatus', (event: Event) => {
            const generateStatus = (event as CustomEvent).detail.GenerateStatus;
            if (generateStatus === GenerateStatus.Generating) {
                this.setGenerateAndPlayTooltip(true);
            }
        });
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
                        <button class="fri-icon-button fri-expand-button">
                            ${ICONS['expand']}
                        </button>
                        <button class="fri-icon-button fri-collapse-button" style="display: none;">
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

    private initializeElement(): void {
        if (common.getEnvironment() == Env.Prod) {
            const summaryStatus = document.getElementById("ytbs_summary_status");
            summaryStatus!.style.display = 'none';

        }

        this.initializeExpandCollapseToggle();
    }

    private handleExpandCollapseToggle(): void {
        const contentContainer = document.getElementById('fri-summary-content-container');
        const needSetExpand = contentContainer!.style.display === 'none';
        this.updateGenerateContentExpandCollapse(needSetExpand);
    }

    public setGenerateContentExpand(): void {
        const contentContainer = document.getElementById('fri-summary-content-container');
        if (contentContainer) {
            if (contentContainer.style.display === 'none') {
                FriSummary.getInstance().updateGenerateContentExpandCollapse(true);
            } 
        }
    }

    public updateGenerateContentExpandCollapse(expand: boolean): void {
        const container = document.querySelector('.fri-expand-collapse-container');
        const contentContainer = document.getElementById('fri-summary-content-container');

        if (!container || !contentContainer) return;

        const collapseButton = container.querySelector('.fri-collapse-button') as HTMLElement;
        const expandButton = container.querySelector('.fri-expand-button') as HTMLElement;
        const tooltip = container.querySelector('.fri-tooltip') as HTMLElement;

        if (!collapseButton || !expandButton || !tooltip) return;
                
        if (expand) {
            expandButton.style.display = 'none';
            collapseButton.style.display = 'flex';
            tooltip.textContent = i18nService.getMessage('summary-collapse');
            contentContainer.style.display = 'block';
        } else {
            expandButton.style.display = 'flex';
            collapseButton.style.display = 'none';
            tooltip.textContent = i18nService.getMessage('summary-expand');
            contentContainer.style.display = 'none';            
        }
    }

    private initializeExpandCollapseToggle(): void {
        const container = document.querySelector('.fri-expand-collapse-container');
        if (!container) return;

        this.updateGenerateContentExpandCollapse(false);

        container.addEventListener('click', () => {
            const [hasContent, text] = SubtitleSummaryView.getInstance().checkGenerateContentAndToast();
            if (hasContent) {
                this.handleExpandCollapseToggle()
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
            onCopy: () => {                
                const [hasContent, text] = SubtitleSummaryView.getInstance().checkGenerateContentAndToast();
                if (hasContent) {
                    copyTextToClipboard(text);          
                    Toast.show({
                        type: 'success',
                        message: i18nService.getMessage('summary-popup-copy-success')
                    });
                    // close popup
                    const popup = document.getElementById('fri-summary-more-menu');
                    if (popup) {
                        popup.style.display = 'none';
                    }
                }                 
            },
            onDownload: async () => {
                const [hasContent, text] = SubtitleSummaryView.getInstance().checkGenerateContentAndToast()
                if (hasContent) {
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const videoTitle = await getVideoTitle();
                    a.download = `${videoTitle}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            },
            onYoutubeSubtitleChange: (enabled: boolean) => {
                toggleYoutubeSubtitle();
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

    public setGenerateAndPlayTooltip(startGenerate: boolean = false): void {
        const playTooltip = document.querySelector('.play-pause-container .fri-tooltip');
        if (playTooltip) {
            if (!startGenerate) {
                playTooltip.textContent = i18nService.getMessage('summary-generate-and-play');
            } else {
                const isPlaying = (document.querySelector('.fri-play-button') as HTMLElement).style.display !== 'none';
                playTooltip.textContent = i18nService.getMessage(isPlaying ? 'summary-play' : 'summary-pause');
            }
        }
    }

    private updateLanguageTexts(): void {
        this.setGenerateAndPlayTooltip();

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

        const contentContainer = document.getElementById('fri-summary-content-container');
        const expandTooltip = document.querySelector('.fri-expand-collapse-container .fri-tooltip');
        if (contentContainer && expandTooltip) {
            const needExpand = contentContainer.style.display === 'none';
            expandTooltip.textContent = i18nService.getMessage(needExpand ? 'summary-expand' : 'summary-collapse');
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

        this.initializeElement();
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