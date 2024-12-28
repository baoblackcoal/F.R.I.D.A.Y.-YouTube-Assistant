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
import { fridayStatusLabels } from '../../../common/common';
// Interfaces
interface IButtonHandler {
    init(): void;
    update(): Promise<void>;
}

export function initializeButtons(tts: TTSSpeak, subtitleSummaryView: SubtitleSummaryView): void {
    new GenerateButtonHandler(tts).init();
    // new LanguageButtonHandler().init();
    new SettingsButtonHandler().init();
    new SummaryToggleButtonHandler().init();

    // new MoreButtonHandler().init();
    const playPauseButtonHandler = PlayPauseButtonHandler.getInstance();
    playPauseButtonHandler.initVariable(tts, subtitleSummaryView);
    playPauseButtonHandler.init();
    // new AutoSummaryButtonHandler().init();
}

// Button Handlers
class GenerateButtonHandler implements IButtonHandler {
    private buttonId = "fri-generate-button";
    private tts: TTSSpeak;

    constructor(tts: TTSSpeak) {
        this.tts = tts;
    }

    init(): void {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.addEventListener("click", this.handleClick.bind(this));
        }
    }

    async update(): Promise<void> {
      
    }

    private async handleClick(): Promise<void> {
        const subtitleSummaryView = SubtitleSummaryView.getInstance();
        if (subtitleSummaryView.getGenerating()) {
            Toast.show({ message: i18nService.getMessage('summary-generating'), type: 'info', duration: 3000 });
        } else {
            const contentContainer = document.getElementById('fri-summary-content-container');
            if (contentContainer) {
                if (contentContainer.style.display === 'none') {
                    FriSummary.getInstance().updateExpandCollapse(true);
                } 
            }

            subtitleSummaryView.manualStartGenerate();
            Toast.show({ message: i18nService.getMessage('summary-start-generate'), type: 'info', duration: 3000 });
        }
    }    
}


// class LanguageButtonHandler implements IButtonHandler {
//     private buttonId = "ytbs_language";

//     init(): void {
//         const button = document.getElementById(this.buttonId);
//         if (button) {
//             button.addEventListener("click", this.handleClick.bind(this));
//             this.update();
//         }
//     }

//     async update(): Promise<void> {
//         const button = document.getElementById(this.buttonId);
//         if (button) {
//             const settings = await getSettings();
//             button.textContent = settings.summary.language;
//         }
//     }

//     private async handleClick(): Promise<void> {
//         const settings = await getSettings();
//         const currentLanguage = settings.summary.language as Language;
//         const languages = Object.values(Language) as Language[];
//         const nextLanguageIndex = (languages.indexOf(currentLanguage) + 1) % languages.length;
//         settings.summary.language = languages[nextLanguageIndex];
//         await settingsManager.setSummarySettings(settings.summary);
//         await this.update();
//         window.dispatchEvent(new CustomEvent('generalLanguageSyncChanged', {}));
//     }
// }

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

// class MoreButtonHandler implements IButtonHandler {
//     private buttonId = "ytbs_more_btn";
//     private popupHandler: MorePopupHandler;

//     constructor() {
//         this.popupHandler = new MorePopupHandler();
//     }

//     init(): void {
//         const button = document.getElementById(this.buttonId);
//         if (button) {
//             button.addEventListener("click", (event) => {
//                 event.stopPropagation();
//                 this.popupHandler.open(button);
//             });
//         }
//     }

//     async update(): Promise<void> {
//         // No update needed for this button
//     }
// }

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
            const [hasContent, text] = SubtitleSummaryView.getInstance().checkGenerateContentAndToast();
            if (hasContent) {
                await this.tts.resetStreamSpeak();
                this.resumeSpeaking();
                this.updatePlayPauseButton(true);
            }
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

// class AutoSummaryButtonHandler implements IButtonHandler {
//     private buttonId = "ytbs_auto_summary";

//     init(): void {
//         const button = document.getElementById(this.buttonId);
//         if (button) {
//             button.addEventListener("click", this.handleClick.bind(this));
//             this.update();
//         }
//     }

//     async update(): Promise<void> {
//         const button = document.getElementById(this.buttonId);
//         if (button) {
//             const settings = await getSettings();
//             button.textContent = settings.summary.autoGenerate ? "Summary: ON" : "Summary: OFF";
//         }
//     }

//     private async handleClick(): Promise<void> {
//         const settings = await getSettings();
//         settings.summary.autoGenerate = !settings.summary.autoGenerate;
//         await settingsManager.setSummarySettings(settings.summary);
//         await this.update();
//         window.location.reload();
//     }
// }