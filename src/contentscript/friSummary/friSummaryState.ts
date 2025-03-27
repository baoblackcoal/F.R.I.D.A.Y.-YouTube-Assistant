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
    getAutoDownload(): Promise<boolean>;
    setAutoDownload(value: boolean): Promise<void>;
}


class FriSummaryState implements IFriSummaryState {
    private youtubeSubtitleVisible: boolean = false;


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
        return Promise.resolve();
    }

    async getAutoGenerate(): Promise<boolean> {
        const settings = await settingsManager.getSummarySettings();
        return settings.autoGenerate;
    }

    async setAutoGenerate(value: boolean): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.autoGenerate = value;
        await settingsManager.setSummarySettings(settings);
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
        return Promise.resolve();
    }

    async getDisplayLanguage(): Promise<Language> {
        const settings = await settingsManager.getGeneralSettings();
        return settings.language;
    }

    async setDisplayLanguage(value: Language): Promise<void> {
        const settings = await settingsManager.getGeneralSettings();
        settings.language = value;
        await settingsManager.setGeneralSettings(settings);
        return Promise.resolve();
    }

    async getAutoDownload(): Promise<boolean> {
        const settings = await settingsManager.getSummarySettings();
        return settings.autoDownload;
    }

    async setAutoDownload(value: boolean): Promise<void> {
        const settings = await settingsManager.getSummarySettings();
        settings.autoDownload = value;
        await settingsManager.setSummarySettings(settings);
        return Promise.resolve();
    }
}


export const summaryState = FriSummaryState.getInstance();
