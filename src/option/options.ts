import { GeneralPage } from './generalPage';
import { SummaryPage } from './summaryPage';
import { TTSPage } from './ttsPage';
// import { TabConfig } from './types.ts0';
import { settingsManager, ISettingsManager } from '../common/settingsManager';
import { i18n } from '../common/i18n';
import { Language } from '../common/ISettings';
import { DeviceDetector, DeviceInfo } from '../utils/deviceDetector';

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
  private deviceDetector: DeviceDetector;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.settingsManager = settingsManager;
    this.toast = document.getElementById('toast') as HTMLElement;
    
    // Initialize device detector
    this.deviceDetector = DeviceDetector.instance;
    
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
    await i18n.init();
    this.initializeTabContent();
    this.attachEventListeners();
    this.updateTabLabels();
    this.setupResponsiveLayout();
    
    i18n.attachI18nEvent({
      eventId: 'optionsPage',
      callback: async (language: Language) => {
        this.updateTabLabels();
      }
    });
  }

  private setupResponsiveLayout(): void {
    // Apply device-specific attributes to the document
    this.deviceDetector.applyDeviceAttributes();
    
    // Add listener for device changes (resize, orientation change)
    this.deviceDetector.addResizeListener((deviceInfo: DeviceInfo) => {
      this.updateLayoutForDeviceType(deviceInfo);
    });
    
    // Initial layout update based on current device
    this.updateLayoutForDeviceType(this.deviceDetector.deviceInfo);
  }

  private updateLayoutForDeviceType(deviceInfo: DeviceInfo): void {
    // Apply specific layout adjustments if needed
    if (deviceInfo.isMobile) {
      // Mobile-specific UI adjustments beyond CSS
      console.log("Mobile device detected - applying mobile layout");
    } else if (deviceInfo.isTablet) {
      // Tablet-specific UI adjustments beyond CSS
      console.log("Tablet device detected - applying tablet layout");
    } else {
      // Desktop-specific UI adjustments beyond CSS
      console.log("Desktop device detected - applying desktop layout");
    }
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
      
      // Add event listeners for mobile tab buttons
      const mobileTabButton = document.getElementById(`mobile-tab-${tab.id}`);
      if (mobileTabButton) {
        mobileTabButton.addEventListener('click', () => {
          // Update both desktop and mobile tab indicators
          this.tabs.forEach(t => {
            const desktopBtn = document.getElementById(`tab-${t.id}`);
            const mobileBtn = document.getElementById(`mobile-tab-${t.id}`);
            
            if (desktopBtn) {
              if (t.id === tab.id) {
                desktopBtn.classList.add('active');
                desktopBtn.classList.remove('inactive');
              } else {
                desktopBtn.classList.remove('active');
                desktopBtn.classList.add('inactive');
              }
            }
            
            if (mobileBtn) {
              if (t.id === tab.id) {
                mobileBtn.classList.add('mobile-active');
              } else {
                mobileBtn.classList.remove('mobile-active');
              }
            }
          });
          
          this.showTab(tab.id);
        });
      }
    });

    // Listen for window resize events
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }

  private handleWindowResize(): void {
    // Throttle resize events to prevent performance issues
    if (!this.resizeObserver) {
      return;
    }
  }

  private showTab(tabId: string): void {
    // Update tab buttons
    this.tabs.forEach(tab => {
      const button = document.getElementById(`tab-${tab.id}`);
      const mobileButton = document.getElementById(`mobile-tab-${tab.id}`);
      const content = document.getElementById(`content-${tab.id}`);
      
      if (button && content) {
        if (tab.id === tabId) {
          button.classList.add('active');
          button.classList.remove('inactive');
          content.classList.remove('hidden');
          
          if (mobileButton) {
            mobileButton.classList.add('mobile-active');
            // Show the indicator for the active tab
            const indicator = mobileButton.querySelector('.mobile-tab-indicator');
            if (indicator) {
              (indicator as HTMLElement).style.opacity = '1';
            }
          }
        } else {
          button.classList.remove('active');
          button.classList.add('inactive');
          content.classList.add('hidden');
          
          if (mobileButton) {
            mobileButton.classList.remove('mobile-active');
            // Hide the indicator for inactive tabs
            const indicator = mobileButton.querySelector('.mobile-tab-indicator');
            if (indicator) {
              (indicator as HTMLElement).style.opacity = '0';
            }
          }
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
      
      // Update mobile tab labels as well
      const mobileTabButton = document.getElementById(`mobile-tab-${tab.id}`);
      if (mobileTabButton) {
        const labelElement = mobileTabButton.querySelector('span');
        if (labelElement) {
          labelElement.textContent = tabLabels[tab.id as keyof typeof tabLabels];
        }
      }
    });
  }
  
  // Cleanup when page is unloaded
  public dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    window.removeEventListener('resize', this.handleWindowResize.bind(this));
    console.log("Options page disposed");
  }
}

// Initialize the options page when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const optionsPage = new OptionsPage();
  
  // Clean up when window is unloaded
  window.addEventListener('unload', () => {
    optionsPage.dispose();
  });
});
