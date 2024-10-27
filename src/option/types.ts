export interface TabConfig {
  id: string;
  label: string;
  component: () => HTMLElement;
}

// Update WidgetDemoConfig to support sections and code
export interface WidgetDemoConfig {
  id: string;
  label: string;
  type: 'section' | 'button' | 'text' | 'checkbox' | 'radio' | 'dropdown' | 
        'label' | 'slider' | 'progress' | 'icon' | 'toggle' | 'picture' | 'code';
  props?: {
    // Common props
    variant?: string;
    text?: string;
    disabled?: boolean;
    checked?: boolean;
    placeholder?: string;
    
    // Code specific props
    language?: string;
    code?: string;
    filename?: string;
    description?: string;
    
    // Input specific props
    inputType?: string; // Add this for input type (text, password, etc)
    
    // Other widget specific props
    name?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    value?: number;
    step?: number;
  };
  items?: WidgetDemoConfig[]; // For nested items in sections
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
