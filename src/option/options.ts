import { GeneralPage } from './generalPage';
import { SummaryPage } from './summaryPage';
import { TTSPage } from './ttsPage';
// import { TabConfig } from './types.ts0';
import { settingsManager, ISettingsManager } from '../common/settingsManager';
import { i18n } from '../common/i18n';

export interface TabConfig {
  id: string;
  label: string;
  component: () => HTMLElement;
}

export interface II18n {
  updateI18nAndAttachEvent(): Promise<void>;
}

class OptionsPage {
  private currentTab: string = 'general';
  private settingsManager: ISettingsManager;
  private tabs: TabConfig[];
  private toast: HTMLElement;

  constructor() {
    this.settingsManager = settingsManager;
    this.toast = document.getElementById('toast') as HTMLElement;
    
    // Initialize tab configurations
    this.tabs = [
      {
        id: 'general',
        label: 'General',
        component: () => new GeneralPage().getElement()
      },
      {
        id: 'summary',
        label: 'Summary',
        component: () => new SummaryPage().getElement()
      },
      {
        id: 'tts',
        label: 'TTS',
        component: () => new TTSPage().getElement()
      }
    ];

    this.init();
  }

  private async init(): Promise<void> {
    await i18n.initLoadLocale();
    this.initializeTabContent();
    this.attachEventListeners();
    this.updateTabLabels();
  }

  private initializeTabContent(): void {
    // Initialize all tab contents
    this.tabs.forEach(tab => {
      const contentElement = document.getElementById(`content-${tab.id}`);
      if (contentElement) {
        contentElement.appendChild(tab.component());
      }
    });

    // Show the default tab
    this.showTab(this.currentTab);
  }

  private attachEventListeners(): void {
    // Tab switching with active state management
    this.tabs.forEach(tab => {
      const tabButton = document.getElementById(`tab-${tab.id}`);
      if (tabButton) {
        tabButton.addEventListener('click', (e) => {
          // Remove active class from all buttons
          this.tabs.forEach(t => {
            const btn = document.getElementById(`tab-${t.id}`);
            if (btn) {
              btn.classList.remove('active');
            }
          });
          
          // Add active class to clicked button
          (e.target as HTMLElement).classList.add('active');
          
          this.showTab(tab.id);
        });
      }
    });

    // Add language change event listener
    window.addEventListener('generalLanguageChanged', () => {
      this.updateTabLabels();
    });

  }

  private showTab(tabId: string): void {
    // Update tab buttons
    this.tabs.forEach(tab => {
      const button = document.getElementById(`tab-${tab.id}`);
      const content = document.getElementById(`content-${tab.id}`);
      
      if (button && content) {
        if (tab.id === tabId) {
          button.classList.add('active');
          button.classList.remove('inactive');
          content.classList.remove('hidden');
        } else {
          button.classList.remove('active');
          button.classList.add('inactive');
          content.classList.add('hidden');
        }
      }
    });

    this.currentTab = tabId;
  }


  private updateTabLabels(): void {
    const tabLabels = {
      general: i18n.getMessage('option_tab_general'),
      summary: i18n.getMessage('option_tab_summary'),
      tts: i18n.getMessage('option_tab_tts')
    };

    this.tabs.forEach(tab => {
      const tabButton = document.getElementById(`tab-${tab.id}`);
      if (tabButton) {
        tabButton.textContent = tabLabels[tab.id as keyof typeof tabLabels];
      }
    });
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
