export interface TabConfig {
  id: string;
  label: string;
  component: () => HTMLElement;
}

export interface WidgetDemoConfig {
  id: string;
  label: string;
  type: 'button' | 'text' | 'checkbox' | 'radio' | 'dropdown' | 'label' | 
        'slider' | 'progress' | 'icon' | 'toggle' | 'picture';
  props?: Record<string, any>;
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
