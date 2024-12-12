import { ILlmSettings, SubtitleType } from "./ISettings";
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
  [SubtitleType.SubtitleTranslate]: 'summary-subtitle-translate',
  [SubtitleType.SubtitleToPodcast]: 'summary-subtitle-to-podcast'
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
    return 'AIzaSyDkPJhsoRJcLvbYurWIWtf_n50izLzSGN4';
  }

  public getApiKey(settings: ILlmSettings): string {
    if (settings.isCommonKey) {
      return this.getCommonKeyApiKey();
    } else {
      return settings.userApiKey;
    }
  }

  public getEnvironment(): Env {
    return process.env.NODE_ENV === 'production' ? Env.Prod : Env.Dev;
  }
}

export const common = Common.getInstance();
