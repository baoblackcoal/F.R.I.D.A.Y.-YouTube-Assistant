import { Language, SubtitleType } from "../../common/ISettings";
import { settingsManager } from "../../common/settingsManager";

export interface IFriSummaryState {
    getAutoGenerate(): Promise<boolean>;
    setAutoGenerate(value: boolean): Promise<void>;
    getAutoPlay(): Promise<boolean>;
    setAutoPlay(value: boolean): Promise<void>;
    getSummaryLanguage(): Promise<Language>;
    setSummaryLanguage(value: Language): Promise<void>;
    getDisplayLanguage(): Promise<Language>;
    setDisplayLanguage(value: Language): Promise<void>;
    getSubtitleType(): Promise<SubtitleType>;
    setSubtitleType(value: SubtitleType): Promise<void>;
    getYoutubeSubtitleVisible(): Promise<boolean>;
    setYoutubeSubtitleVisible(value: boolean): Promise<void>;
}


class FriSummaryState implements IFriSummaryState {
    // private autoGenerate: boolean = true;
    // private autoPlay: boolean = false;
    // private summaryLanguage: Language = Language.SimplifiedChinese;
    // private displayLanguage: Language = Language.English;
    // private subtitleType: SubtitleType = SubtitleType.SubtitleToPodcast;
    private youtubeSubtitleVisible: boolean = true;


    private static instance: FriSummaryState;

    public static getInstance() {
        if (FriSummaryState.instance) {
            return FriSummaryState.instance;
        }

        FriSummaryState.instance = new FriSummaryState();
        return FriSummaryState.instance;
    }

    private constructor() {
        // private constructor
    }

    async getYoutubeSubtitleVisible(): Promise<boolean> {
        return Promise.resolve(this.youtubeSubtitleVisible);
    }

    async setYoutubeSubtitleVisible(value: boolean): Promise<void> {
        this.youtubeSubtitleVisible = value;
        return Promise.resolve();
    }

    async getSubtitleType(): Promise<SubtitleType> {
        const settings = await settingsManager.getSummarySettings();
        return settings.generateSubtitleType;
    }

    async setSubtitleType(value: SubtitleType): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.generateSubtitleType = value;
        await settingsManager.setSummarySettings(settings);
        // this.subtitleType = value;
        return Promise.resolve();
    }

    async getAutoGenerate(): Promise<boolean> {
        const settings = await settingsManager.getSummarySettings();
        return settings.autoSummary;
    }

    async setAutoGenerate(value: boolean): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.autoSummary = value;
        await settingsManager.setSummarySettings(settings);
        // this.autoGenerate = value;
        return Promise.resolve();
    }

    async getAutoPlay(): Promise<boolean> {
        const settings = await settingsManager.getSummarySettings();
        return settings.autoTtsSpeak;
    }

    async setAutoPlay(value: boolean): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.autoTtsSpeak = value;
        await settingsManager.setSummarySettings(settings);
        // this.autoPlay = value;
        return Promise.resolve();
    }

    async getSummaryLanguage(): Promise<Language> {
        const settings = await settingsManager.getSummarySettings();
        return settings.language;
    }

    async setSummaryLanguage(value: Language): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.language = value;
        await settingsManager.setSummarySettings(settings);
        // this.summaryLanguage = value;
        return Promise.resolve();
    }

    async getDisplayLanguage(): Promise<Language> {
        const settings = await settingsManager.getSummarySettings();
        return settings.language;
    }

    async setDisplayLanguage(value: Language): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.language = value;
        await settingsManager.setSummarySettings(settings);
        // this.displayLanguage = value;
        return Promise.resolve();
    }
}


export const summaryState = FriSummaryState.getInstance();
