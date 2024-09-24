import { AbstractSettings, Language } from '../../settings';
import { TTSSpeak } from '../ttsSpeak';
import { settingsManager } from '../../settingsManager';


export function getSubtitleSummaryView() {
    return `<div class="ytbs_container" style="font-size: 15px; background-color: rgb(255, 255, 255);  padding:6px;">
                    <div class="ytbs_content"> </div>    
                    <button id="ytbs_speak">Speak</button>
                    <button id="ytbs_auto_speak">Auto Speak</button>
                    <button id="ytbs_language">English</button>
                    <button id="ytbs_settings">Settings</button>
                </div>`;
}


const tts = TTSSpeak.getInstance();



// Handle the view of subtitle summary
export function handleSubtitleSummaryView(videoId: string): void {
    buttonSpeakHandle();
    buttonAutoSpeakHandle();
    buttonLanguageHandle();
    buttonSettingsHandle();
}

async function getSettings(): Promise<AbstractSettings> {
    return await settingsManager.getSettings();
}

function buttonSpeakHandle(): void {
    async function updateSpeakButtonDisplay(){
        const buttonSpeak = document.getElementById("ytbs_speak");
        if (buttonSpeak) {
            if (await tts.isSpeaking()) {
                buttonSpeak.textContent = "Speaking...";
            } else {
                buttonSpeak.textContent = "Speak";
            }
        } 
    }

    // update the display of the speak button every 3 seconds
    setInterval(updateSpeakButtonDisplay, 3000);
    
    const buttonSpeak = document.getElementById("ytbs_speak");

    // click buttonSpeak, call tts.speak()
    if (buttonSpeak) {
        buttonSpeak.addEventListener("click", async () => {
            console.log("ytbs_speak clicked");
            if (await tts.isSpeaking()) {
                tts.stop();
                buttonSpeak.textContent = "Speak";
            } else {
                //get text from ytbs_content    
                const text = (document.querySelector(".ytbs_content") as HTMLElement).innerText;
                tts.speak(text);
                buttonSpeak.textContent = "Speaking...";
            }
        });
    }
}

function buttonAutoSpeakHandle(): void {
    const buttonAutoSpeak = document.getElementById("ytbs_auto_speak");
    if (buttonAutoSpeak) {
        // update the display of the auto speak button
        async function updateAutoSpeakButtonDisplay(buttonAutoSpeak: HTMLElement){
                const settings = await getSettings();
                buttonAutoSpeak.textContent = settings.summary.autoTtsSpeak ? "Auto Speak: ON" : "Auto Speak: OFF";
        }
        updateAutoSpeakButtonDisplay(buttonAutoSpeak);

        buttonAutoSpeak.addEventListener("click", async () => {
            const settings = await getSettings();
            settings.summary.autoTtsSpeak = !settings.summary.autoTtsSpeak;
            await settingsManager.setSummarySettings(settings.summary);
            await updateAutoSpeakButtonDisplay(buttonAutoSpeak);
            console.log(`Auto Speak set to ${settings.summary.autoTtsSpeak}`);
        });
    }
}

function buttonLanguageHandle(): void {
    const buttonLanguage = document.getElementById("ytbs_language");
    if (buttonLanguage) {
        async function updateLanguageButtonDisplay(buttonLanguage: HTMLElement){
            const settings = await getSettings();
            buttonLanguage.textContent = settings.summary.language;
        }   
        updateLanguageButtonDisplay(buttonLanguage);

        buttonLanguage.addEventListener("click", async () => {
            const settings = await getSettings();
            const currentLanguage = settings.summary.language as Language;
            const languages = Object.values(Language) as Language[];
            const nextLanguageIndex = (languages.indexOf(currentLanguage) + 1) % languages.length;
            settings.summary.language = languages[nextLanguageIndex];
            await settingsManager.setSummarySettings(settings.summary);
            await updateLanguageButtonDisplay(buttonLanguage);
            console.log(`Language set to ${settings.summary.language}`);
        });
    }
}

function buttonSettingsHandle(): void {
    const buttonSettings = document.getElementById("ytbs_settings");
    if (buttonSettings) {
        buttonSettings.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: 'openOptionsPage' });
        });
    }
}


