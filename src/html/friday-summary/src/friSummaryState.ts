

export enum Language {
    English = 'en',
    SimplifiedChinese = 'zh_CN',
    TraditionalChinese = 'zh_TW'
}


export interface IFriSummaryState {
    isDark: boolean;
    getAutoGenerate(): boolean;
    setAutoGenerate(value: boolean): void;
    getAutoPlay(): boolean;
    setAutoPlay(value: boolean): void;
    getLanguage(): Language;
    setLanguage(value: Language): void;
}


class FriSummaryState implements IFriSummaryState {
    isDark: boolean = false;
    private autoGenerate: boolean = true;
    private autoPlay: boolean = false;
    private language: Language = Language.TraditionalChinese;

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

    getAutoGenerate(): boolean {
        return this.autoGenerate;
    }

     setAutoGenerate(value: boolean): void {
        this.autoGenerate = value;
    }

     getAutoPlay(): boolean {
        return this.autoPlay;
    }

     setAutoPlay(value: boolean): void {
        this.autoPlay = value;
    }

     getLanguage(): Language {
        return this.language;
    }

     setLanguage(value: Language): void {
        this.language = value;
    }   
}


export const summaryState = FriSummaryState.getInstance();
