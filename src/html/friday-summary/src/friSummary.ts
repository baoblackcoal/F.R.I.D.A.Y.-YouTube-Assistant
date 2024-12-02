import { ICONS } from './svgs.js';
import { ToastService, ThemeService, InfoTextService } from './test.js';
import { FriSummaryPopup, IPopupEvents } from './friSummaryPopup.js';
import { IFriSummaryState, summaryState, Language } from './friSummaryState.js';


class FriSummary {
    private state!: IFriSummaryState

    private toastService!: ToastService;
    private themeService!: ThemeService;
    private infoTextService!: InfoTextService;

    constructor() {
        this.state = summaryState;       
    }

    private initServices(): void {        
        this.toastService = new ToastService();
        this.themeService = new ThemeService();
        this.infoTextService = new InfoTextService();
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
            <div class="fri-summary-row">
                <div class="fri-left-controls">
                    ${this.createIconButton('paragraph', 'Generate Paragraph', 'generate-button')}
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
                (button as HTMLElement).style.backgroundColor = 'var(--fri-hover-bg)';
            });

            button.addEventListener('mousedown', () => {
                (button as HTMLElement).style.backgroundColor = 'var(--fri-active-bg)';
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
        const generateButton = document.getElementById('generate-button');
        const moreButton = document.getElementById('more-button');
        const settingsButton = document.getElementById('settings-button');

        generateButton?.addEventListener('click', () => this.toastService.show('Generate Paragraph'));
        moreButton?.addEventListener('click', () => this.toastService.show('More'));
        settingsButton?.addEventListener('click', () => this.toastService.show('Settings'));
    }

    private initializePopupMenu(): void {
        const moreButton = document.querySelector('.fri-right-controls .fri-icon-button');
        if (!moreButton) return;

        const popupEvents: IPopupEvents = {
            onLanguageChange: (language: Language) => {
                summaryState.setLanguage(language);
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
            onDownload: () => this.toastService.show('Download')
        };

        const popup = new FriSummaryPopup(
            this.state,
            popupEvents,
            this.toastService
        );
        
        popup.init(moreButton as HTMLElement);
    }

    public init(): void {
        const root = document.getElementById('root');
        if (!root) return;

        root.appendChild(this.createFriSummaryContainer());

        document.addEventListener('DOMContentLoaded', () => {
            this.initializeButtonEffects();
            this.initializeToggleButtons();
            this.initializePopupMenu();

            this.initServices();
            this.infoTextService.startDemo();
        });
    }
}

// Initialize the FriSummary component
const friSummary = new FriSummary();
friSummary.init(); 