// import { Language } from "../../common/ISettings";
// import { i18nService } from "./i18nService";

// // Interfaces for better abstraction and testability
// interface IToastService {
//     show(message: string, options?: ToastOptions): void;
// }

// interface IThemeService {
//     toggle(): void;
//     isDark(): boolean;
// }

// interface IInfoTextService {
//     startDemo(): void;
//     // setText(text: string): void;
// }

// interface ToastOptions {
//     duration?: number;
//     className?: string;
// }

// interface ILanguageService {
//     setLanguage(language: Language): void;
// }

// // Implementation of Toast Service
// export class ToastService implements IToastService {
//     public show(message: string, options: ToastOptions = {}): void {
//         const toast = document.createElement('div');
//         toast.className = `fri-toast ${options.className || ''}`;
//         toast.textContent = message;
//         document.body.appendChild(toast);
//     }
// }

// // Implementation of Theme Service
// export class ThemeService implements IThemeService {
//     private darkMode: boolean = false;
//     private container: HTMLElement | null;
//     private themeButton: HTMLElement | null;

//     constructor() {
//         this.container = document.getElementById('fri-summry-container');
//         this.themeButton = document.getElementById('themeButton');
//         this.initialize();
//     }

//     private initialize(): void {
//         if (!this.themeButton || !this.container) return;

//         this.themeButton.addEventListener('click', () => this.toggle());
//     }

//     public toggle(): void {
//         if (!this.container || !this.themeButton) return;
        
//         this.darkMode = !this.darkMode;

//         const htmlElement = document.documentElement;
//         if (this.darkMode) {
//             htmlElement.removeAttribute('dark');
//         } else {
//             htmlElement.setAttribute('dark', '');
//         }
//     }

//     public isDark(): boolean {
//         return this.darkMode;
//     }
// }

// // Implementation of Language Service
// export class LanguageService implements ILanguageService {
//     private language: Language = Language.English;
//     private languageButton: HTMLElement | null;

//     constructor() {
//         this.languageButton = document.getElementById('languageButton');
//         this.initialize();
//     }

//     private initialize(): void {
//         if (!this.languageButton) return;

//         this.languageButton.addEventListener('click', () => this.setLanguage());
//     }

//     public setLanguage(): void {
//         this.language = this.language === Language.English ? Language.SimplifiedChinese : Language.English;
//         this.languageButton!.textContent = this.language === Language.English ? 'English' : '简体中文';
//         i18nService.setLanguage(this.language);
//     }
// }

// // Implementation of Info Text Service
// export class InfoTextService implements IInfoTextService {
//     private infoTextElement: HTMLElement | null = null;
//     private intervalId: number | null = null;
//     private setFriInfoText: (text: string) => void;

//     constructor(setFriInfoText: (text: string) => void) {
//         this.setFriInfoText = setFriInfoText;
//         this.infoTextElement = document.getElementById('fri-summary-info-text');
//     }

//     public startDemo(): void {
//         const texts = ['summary-fri-waiting', 'summary-fri-generating-summary', 'summary-fri-translating-subtitle', 'summary-fri-finished'];
//         let index = 0;

//         this.intervalId = window.setInterval(() => {
//             this.setFriInfoText(i18nService.getMessage(texts[index]));
//             index = (index + 1) % texts.length;
//         }, 2000);
//     }

//     public stopDemo(): void {
//         if (this.intervalId !== null) {
//             clearInterval(this.intervalId);
//             this.intervalId = null;
//         }
//     }
// } 