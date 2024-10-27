export interface TabConfig {
  id: string;
  label: string;
  component: () => HTMLElement;
}

// Update WidgetDemoConfig to support sections
export interface WidgetDemoConfig {
  id: string;
  label: string;
  type: 'section' | 'button' | 'text' | 'checkbox' | 'radio' | 'dropdown' | 
        'label' | 'slider' | 'progress' | 'icon' | 'toggle' | 'picture';
  props?: Record<string, any>;
  items?: WidgetDemoConfig[]; // Add support for nested items in sections
}

export interface Language {
  code: string;
  label: string;
}

export interface GeneralPageConfig {
  welcomeImage: string;
  languages: Language[];
}

// export interface SummarySettings {
//   promptType: number;
//   customPrompts: string[];
//   autoSummary: boolean;
// }

// export interface TTSSettings {
//   enabled: boolean;
//   autoSpeak: boolean;
//   voice: string;
//   rate: number;
//   pitch: number;
//   [key: string]: boolean | string | number; // Add index signature to allow dynamic property access
// }
