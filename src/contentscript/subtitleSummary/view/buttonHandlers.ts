import { TTSSpeak } from '../../../common/ttsSpeak';
import { getSettings } from './utils';
import { settingsManager } from '../../../common/settingsManager';
import { SubtitleSummaryView } from './subtitleSummaryView';
import { MorePopupHandler } from './popupHandlers';
import { Language } from '../../../common/ISettings';
import { ICONS } from '../../friSummary/svgs';
import { i18nService } from '../../friSummary/i18nService';
import { MessageObserver } from '../../../utils/messageObserver';
import { ITtsMessage } from '../../../utils/messageQueue';
import { Toast } from '../../../common/toast';
import { FriSummary } from '../../friSummary/friSummary';
import { FridayStatus, fridayStatusLabels, GenerateStatus } from '../../../common/common';
import { SrtGenerator } from '../srtGenerate';

// Interfaces
interface IButtonHandler {
    init(): void;
    update(): Promise<void>;
}

export function initializeButtons(tts: TTSSpeak, subtitleSummaryView: SubtitleSummaryView): void {
    GenerateButtonHandler.getInstance().initVariable(tts);
    GenerateButtonHandler.getInstance().init();

    SettingsButtonHandler.getInstance().init();
    SummaryToggleButtonHandler.getInstance().init();

    const playPauseButtonHandler = PlayPauseButtonHandler.getInstance();
    playPauseButtonHandler.initVariable(tts, subtitleSummaryView);
    playPauseButtonHandler.init();
    
    // Add SRT toggle button to the fri-buttons-container
    addSrtButtonToContainer();
}

// Add SRT button to the container
function addSrtButtonToContainer(): void {
    const buttonsContainer = document.querySelector('.fri-buttons-container');
    if (buttonsContainer && !document.getElementById('fri-srt-button')) {
        // Create SRT button
        const srtButton = document.createElement('button');
        srtButton.id = 'fri-srt-button';
        srtButton.className = 'fri-button';
        srtButton.setAttribute('aria-label', 'Show SRT Subtitles');
        srtButton.innerHTML = createSrtButtonSvg();
        
        // Create tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'fri-tooltip';
        tooltip.id = 'srt-tooltip';
        tooltip.textContent = 'Show SRT Subtitles';
        
        // Append elements
        srtButton.appendChild(tooltip);
        buttonsContainer.appendChild(srtButton);
    }
}

// Create SVG for SRT button
function createSrtButtonSvg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
        <path d="M6 10h4"></path>
        <path d="M14 10h4"></path>
        <path d="M6 14h8"></path>
        <path d="M16 14h2"></path>
    </svg>`;
}

// Button Handlers
class GenerateButtonHandler implements IButtonHandler {
    private buttonId = "fri-generate-button";
    private tts!: TTSSpeak;
    // private fridayStatus: FridayStatus = FridayStatus.Init;
    private generateStatus: GenerateStatus = GenerateStatus.Init;
    private generateFinished: boolean = false;

    private constructor() {
        window.addEventListener('GenerateStatus', (event: any) => {
            this.generateStatus = event.detail.GenerateStatus;
            this.generateFinished = this.generateStatus == GenerateStatus.Finished;
            if (this.generateStatus == GenerateStatus.Init) {
                this.generateFinished = false;
            }
        });
    }

    //single instance
    private static instance: GenerateButtonHandler;
    public static getInstance(): GenerateButtonHandler {
        if (!GenerateButtonHandler.instance) {
            GenerateButtonHandler.instance = new GenerateButtonHandler();
        }
        return GenerateButtonHandler.instance;
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
        }
    }

    initVariable(tts: TTSSpeak): void {
        this.tts = tts;
    }

    async update(): Promise<void> {
      
    }

    private async handleClick(): Promise<void> {
        const subtitleSummaryView = SubtitleSummaryView.getInstance();
        let status = this.generateStatus;
        if (!this.generateFinished && subtitleSummaryView.getGenerating()) {
            status = GenerateStatus.Generating; //GenerateStatus update slow, so use subtitleSummaryView.getGenerating() to update
        }

        switch (status) {
            case GenerateStatus.Init:
                subtitleSummaryView.manualStartGenerate();
                Toast.show({ message: i18nService.getMessage('summary-start-generate'), type: 'info', duration: 3000 });
                break;           
            case GenerateStatus.Generating:
                Toast.show({ message: i18nService.getMessage('summary-generating'), type: 'info', duration: 3000 });
                break;
            case GenerateStatus.Finished:
                await this.tts.resetStreamSpeak();

                subtitleSummaryView.reInitContent();
                subtitleSummaryView.manualStartGenerate();
                // Toast.show({ message: i18nService.getMessage('summary-generate-finished'), type: 'info', duration: 3000 });
                break;
        }          
    }    
}

class SettingsButtonHandler implements IButtonHandler {
    private buttonId = "fri-settings-button";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", () => {
                chrome.runtime.sendMessage({ action: 'openOptionsPage' });
            });
        }
    }

    //single instance
    private static instance: SettingsButtonHandler;
    public static getInstance(): SettingsButtonHandler {
        if (!SettingsButtonHandler.instance) {
            SettingsButtonHandler.instance = new SettingsButtonHandler();
        }
        return SettingsButtonHandler.instance;
    }

    async update(): Promise<void> {
        // No update needed for this button
    }
}

class SummaryToggleButtonHandler implements IButtonHandler {
    private buttonId = "ytbs_summary_logo";

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
        }
    }

    //single instance
    private static instance: SummaryToggleButtonHandler;
    public static getInstance(): SummaryToggleButtonHandler {
        if (!SummaryToggleButtonHandler.instance) {
            SummaryToggleButtonHandler.instance = new SummaryToggleButtonHandler();
        }
        return SummaryToggleButtonHandler.instance;
    }

    async update(): Promise<void> {
        // No update needed for this button
    }

    private handleClick(): void {
        const container = document.querySelector(".yt_ai_summary_container") as HTMLElement;
        if (container) {
            container.style.display = container.style.display === "none" ? "block" : "none";
        }
    }
}

export class PlayPauseButtonHandler implements IButtonHandler {
    private buttonId = "fri-play-button";
    private tts!: TTSSpeak;
    private subtitleSummaryView!: SubtitleSummaryView;
    private isSpeaking: boolean = false;

    private addingSpeakContent: boolean = false;

    private constructor() {

    }

    //single instance
    private static instance: PlayPauseButtonHandler;

    public static getInstance(): PlayPauseButtonHandler {
        if (!PlayPauseButtonHandler.instance) {
            PlayPauseButtonHandler.instance = new PlayPauseButtonHandler();
        }
        return PlayPauseButtonHandler.instance;
    }

    public initVariable(tts: TTSSpeak, subtitleSummaryView: SubtitleSummaryView) {
        this.tts = tts;
        this.subtitleSummaryView = subtitleSummaryView;
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
            // setInterval(this.update.bind(this), 3000);
        }

        const messageObserver = MessageObserver.getInstance();
        messageObserver.addObserverTtsMessage({ action: 'ttsCheckSpeaking' }, (message: any) => {
            const isSpeaking = message!.speaking;
            if (this.isSpeaking !== isSpeaking) {
                this.updatePlayPauseButton(isSpeaking);
            }            
        });

        window.addEventListener('GenerateStatus', (event: any) => {
            const generateStatus = event.detail.GenerateStatus;
            if (generateStatus == GenerateStatus.Init) {
                this.updatePlayPauseButton(false);
            }
        });
    }

    private updatePlayPauseButton(isPlaying: boolean): void {
        const playButton = document.getElementById('fri-play-button') as HTMLElement;
        const tooltip = document.getElementById('play-pause-tooltip') as HTMLElement;
        if (!playButton || !tooltip) return;

        this.isSpeaking = isPlaying;
        if (isPlaying) {
            playButton.innerHTML = ICONS['pause'];
            tooltip.textContent = i18nService.getMessage('summary-pause');
        } else {
            playButton.innerHTML = ICONS['play'];
            tooltip.textContent = i18nService.getMessage('summary-play');
        }
    }

    async update(): Promise<void> {
        this.updatePlayPauseButton(this.tts.isSpeaking());
    }

    private async handleClick(): Promise<void> {
        if (await this.tts.isSpeaking()) {
            await this.tts.stop();
            this.updatePlayPauseButton(false);
        } else {
            const [hasContent, text] = this.subtitleSummaryView.checkGenerateContent();
            if (!hasContent) {
                this.subtitleSummaryView.manualStartGenerate();
            } 

            await this.tts.resetStreamSpeak();
            this.resumeSpeaking();
            this.updatePlayPauseButton(true);
        }
    }

    private resumeSpeaking(): void {
        this.addingSpeakContent = true;
        const parser = new DOMParser();
        const content = document.querySelector("#fri-summary-content") as HTMLElement;
        if (content) {
            Array.from(content.children).forEach((node) => {
                if (node instanceof HTMLElement) {
                    const speakIndex = Number(node.getAttribute('speak-index') ?? -1);
                    if (speakIndex >= this.subtitleSummaryView.getCurrentIndex()) {
                        const text = parser.parseFromString(node.innerHTML, 'text/html').documentElement.textContent ?? '';
                        this.tts.speak(text, speakIndex);
                    }
                }
            });
        }
        this.addingSpeakContent = false;
    }

    public getSpeaking(): boolean {
        return this.isSpeaking;
    }

    public async awaitAddingSpeakContent(): Promise<void> {
        while (this.addingSpeakContent) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}
