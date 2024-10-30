import { GeneralPage } from './generalPage';
import { SummaryPage } from './summaryPage';
import { TTSPage } from './ttsPage';
// import { TabConfig } from './types.ts0';
import { settingsManager, ISettingsManager } from '../common/settingsManager';

export interface TabConfig {
  id: string;
  label: string;
  component: () => HTMLElement;
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

  private init(): void {
    this.initializeTabContent();
    this.attachEventListeners();
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

    // // Save button
    // const saveButton = document.getElementById('saveBtn');
    // saveButton?.addEventListener('click', () => this.saveSettings());

    // // Reset button
    // const resetButton = document.getElementById('resetBtn');
    // resetButton?.addEventListener('click', () => this.resetSettings());
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

  // private async saveSettings(): Promise<void> {
  //   try {
  //     // Collect and save settings from all tabs
  //     await this.settingsManager.saveSettings();
      
  //     this.showToast('Settings saved successfully', 'success');
  //   } catch (error) {
  //     this.showToast('Failed to save settings', 'error');
  //     console.error('Error saving settings:', error);
  //   }
  // }

  // private async resetSettings(): Promise<void> {
  //   if (confirm('Are you sure you want to reset all settings to default?')) {
  //     try {
  //       await this.settingsManager.resetSettings();
  //       window.location.reload();
  //     } catch (error) {
  //       this.showToast('Failed to reset settings', 'error');
  //       console.error('Error resetting settings:', error);
  //     }
  //   }
  // }

  // private showToast(message: string, type: 'success' | 'error' = 'success'): void {
  //   if (this.toast) {
  //     this.toast.textContent = message;
  //     this.toast.className = `
  //       fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg 
  //       transform transition-transform duration-300
  //       ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white
  //     `;
      
  //     // Show toast
  //     this.toast.style.transform = 'translateY(0)';

  //     // Hide toast after 3 seconds
  //     setTimeout(() => {
  //       if (this.toast) {
  //         this.toast.style.transform = 'translateY(100%)';
  //       }
  //     }, 3000);
  //   }
  // }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
