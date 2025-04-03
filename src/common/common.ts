import { ILlmSettings, ISummarySettings, SubtitleType } from "./ISettings";
import { Language } from "./ISettings";

export enum Env {
  Dev = "dev",
  Prod = "prod",
}


export const responseOk = { status: 'ok' };
export const responseNoHandlers = { status: 'no_handlers' };


export const languageLabels: Record<Language, string> = {
  [Language.English]: 'English',
  [Language.SimplifiedChinese]: '简体中文',
  [Language.TraditionalChinese]: '繁體中文'
};


export const subtitleOptionLabels: Record<SubtitleType, string> = {
  [SubtitleType.None]: 'summary-subtitle-none',
  [SubtitleType.Translation]: 'summary-subtitle-translate',
  [SubtitleType.Podcast]: 'summary-subtitle-to-podcast'
};

export enum FridayStatus {
  Init = 'init',
  Waiting = 'waiting',
  GeneratingSummary = 'generating-summary',
  TranslatingSubtitle = 'translating-subtitle',
  GeneratingPodcast = 'generating-podcast',
  GenerateSubtitleError = 'generate-subtitle-error',
  Finished = 'finished'
}

export enum GenerateStatus {
  Init = 'Init',
  Generating = 'Generating',
  Finished = 'Finished'
}

export const fridayStatusLabels: Record<FridayStatus, string> = {
  [FridayStatus.Init]: 'init',
  [FridayStatus.Waiting]: 'summary-fri-waiting',
  [FridayStatus.GeneratingSummary]: 'summary-fri-generating-summary',
  [FridayStatus.TranslatingSubtitle]: 'summary-fri-translating-subtitle',
  [FridayStatus.GeneratingPodcast]: 'summary-fri-generating-podcast',
  [FridayStatus.GenerateSubtitleError]: 'summary-fri-generate-subtitle-error',
  [FridayStatus.Finished]: 'summary-fri-finished'
};

export class Common {

  private static instance: Common;
  public static getInstance(): Common {
    if (!Common.instance) {
      Common.instance = new Common();
    }
    return Common.instance;
  }

  private getCommonKeyApiKey(): string {
    return process.env.GEMINI_API_KEY ?? '';
  }

  public async getApiKey(settings: ISummarySettings): Promise<string> {
    if (settings.isCommonKey) {
      return this.getCommonKeyApiKey();
    } else {
      const r = await chrome.storage.sync.get('geminiApiKey');
      return r.geminiApiKey;
    }
  }

  public getEnvironment(): Env {
    return process.env.NODE_ENV === 'production' ? Env.Prod : Env.Dev;
  }
}

export const common = Common.getInstance();
