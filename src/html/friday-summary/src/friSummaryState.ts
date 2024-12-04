

export enum Language {
    English = 'en',
    SimplifiedChinese = 'zh_CN',
    TraditionalChinese = 'zh_TW'
}
    
export const languageLabels: Record<Language, string> = {
    [Language.English]: 'English',
    [Language.SimplifiedChinese]: '简体中文',
    [Language.TraditionalChinese]: '繁體中文'
};

export interface IFriSummaryState {
    getAutoGenerate(): boolean;
    setAutoGenerate(value: boolean): void;
    getAutoPlay(): boolean;
    setAutoPlay(value: boolean): void;
    getSummaryLanguage(): Language;
    setSummaryLanguage(value: Language): void;
    getDisplayLanguage(): Language;
    setDisplayLanguage(value: Language): void;
}


class FriSummaryState implements IFriSummaryState {
    private autoGenerate: boolean = true;
    private autoPlay: boolean = false;
    private summaryLanguage: Language = Language.English;
    private displayLanguage: Language = Language.English;

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

     getSummaryLanguage(): Language {
        return this.summaryLanguage;
    }

     setSummaryLanguage(value: Language): void {
        this.summaryLanguage = value;
    }   

    getDisplayLanguage(): Language {
        return this.displayLanguage;
    }

    setDisplayLanguage(value: Language): void {
        this.displayLanguage = value;
    }
}


export const summaryState = FriSummaryState.getInstance();
