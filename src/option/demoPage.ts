import { WidgetDemoConfig } from './types';
import { Icons } from '../common/icons';

export class DemoPage {
  private container: HTMLElement;
  private widgets: WidgetDemoConfig[] = [
    // Button Section
    {
      id: 'buttons',
      label: 'Buttons',
      type: 'section',
      items: [
        {
          id: 'primary-btn',
          label: 'Primary Button',
          type: 'button',
          props: { text: 'Submit', variant: 'primary' }
        },
        {
          id: 'secondary-btn',
          label: 'Secondary Button',
          type: 'button',
          props: { text: 'Cancel', variant: 'secondary' }
        }
      ]
    },

    // Input Fields Section
    {
      id: 'inputs',
      label: 'Input Fields',
      type: 'section',
      items: [
        {
          id: 'text-input',
          label: 'Text Input',
          type: 'text',
          props: { placeholder: 'Enter your name...', type: 'text' }
        },
        {
          id: 'password-input',
          label: 'Password Input',
          type: 'text',
          props: { placeholder: 'Enter password...', type: 'password' }
        }
      ]
    },

    // Toggle Options Section
    {
      id: 'toggles',
      label: 'Toggle Options',
      type: 'section',
      items: [
        {
          id: 'checkbox-1',
          label: 'Enable notifications',
          type: 'checkbox',
          props: { checked: true }
        },
        {
          id: 'checkbox-2',
          label: 'Auto-play videos',
          type: 'checkbox',
          props: { checked: false }
        }
      ]
    },

    // Radio Options Section
    {
      id: 'radio-options',
      label: 'Language Selection',
      type: 'section',
      items: [
        {
          id: 'radio-group',
          label: 'Select your preferred language',
          type: 'radio',
          props: {
            name: 'language',
            options: [
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' }
            ]
          }
        }
      ]
    },

    // Dropdown Section
    {
      id: 'dropdowns',
      label: 'Dropdown Menus',
      type: 'section',
      items: [
        {
          id: 'theme-dropdown',
          label: 'Theme Selection',
          type: 'dropdown',
          props: {
            options: [
              { value: 'light', label: 'Light Theme' },
              { value: 'dark', label: 'Dark Theme' },
              { value: 'system', label: 'System Default' }
            ]
          }
        }
      ]
    },

    // Slider Controls Section
    {
      id: 'sliders',
      label: 'Slider Controls',
      type: 'section',
      items: [
        {
          id: 'volume-slider',
          label: 'Volume Control',
          type: 'slider',
          props: {
            min: 0,
            max: 100,
            value: 50,
            step: 1
          }
        }
      ]
    }
  ];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'demo-page';
    this.init();
  }

  private createSection(config: WidgetDemoConfig): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';

    const header = document.createElement('div');
    header.className = 'section-header';

    const title = document.createElement('h2');
    title.className = 'section-title';
    title.textContent = config.label;

    header.appendChild(title);
    section.appendChild(header);

    if (config.items) {
      const content = document.createElement('div');
      content.className = 'section-content';

      config.items.forEach(item => {
        const widgetWrapper = this.createWidgetWrapper(item);
        content.appendChild(widgetWrapper);
      });

      section.appendChild(content);
    }

    return section;
  }

  private createWidgetWrapper(config: WidgetDemoConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-wrapper';

    const labelWrapper = document.createElement('div');
    labelWrapper.className = 'widget-label';
    labelWrapper.textContent = config.label;

    const controlWrapper = document.createElement('div');
    controlWrapper.className = 'widget-control';
    controlWrapper.appendChild(this.createWidget(config));

    wrapper.appendChild(labelWrapper);
    wrapper.appendChild(controlWrapper);

    return wrapper;
  }

  private createWidget(config: WidgetDemoConfig): HTMLElement {
    switch (config.type) {
      case 'button':
        return this.createButton(config);
      case 'text':
        return this.createTextField(config);
      case 'checkbox':
        return this.createCheckbox(config);
      case 'radio':
        return this.createRadioGroup(config);
      case 'dropdown':
        return this.createDropdown(config);
      case 'slider':
        return this.createSlider(config);
      default:
        return document.createElement('div');
    }
  }

  private createButton(config: WidgetDemoConfig): HTMLButtonElement {
    const btn = document.createElement('button');
    const variant = config.props?.variant || 'primary';
    btn.className = variant === 'primary' 
      ? 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700'
      : 'px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300';
    btn.textContent = config.props?.text || 'Button';
    return btn;
  }

  private createTextField(config: WidgetDemoConfig): HTMLInputElement {
    const input = document.createElement('input');
    input.type = config.props?.type || 'text';
    input.className = 'w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500';
    input.placeholder = config.props?.placeholder || '';
    return input;
  }

  private createCheckbox(config: WidgetDemoConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center space-x-2';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500';
    checkbox.checked = config.props?.checked || false;
    checkbox.disabled = config.props?.disabled || false;

    const label = document.createElement('label');
    label.className = 'text-sm text-gray-700';
    label.textContent = config.props?.text || '';

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
  }

  private createRadioGroup(config: WidgetDemoConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';

    config.props?.options?.forEach((option: { value: string; label: string }) => {
      const radioWrapper = document.createElement('div');
      radioWrapper.className = 'flex items-center space-x-2';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = config.props?.name;
      radio.value = option.value;
      radio.className = 'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500';

      const label = document.createElement('label');
      label.className = 'text-sm text-gray-700';
      label.textContent = option.label;

      radioWrapper.appendChild(radio);
      radioWrapper.appendChild(label);
      wrapper.appendChild(radioWrapper);
    });

    return wrapper;
  }

  private createDropdown(config: WidgetDemoConfig): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500';

    config.props?.options?.forEach((option: { value: string; label: string }) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);
    });

    return select;
  }

  private createSlider(config: WidgetDemoConfig): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer';
    slider.min = config.props?.min?.toString() || '0';
    slider.max = config.props?.max?.toString() || '100';
    slider.value = config.props?.value?.toString() || '50';
    slider.step = config.props?.step?.toString() || '1';
    return slider;
  }

  private init(): void {
    const title = document.createElement('h1');
    title.className = 'page-title';
    title.textContent = 'Widget Demo';
    this.container.appendChild(title);

    this.widgets.forEach(widget => {
      this.container.appendChild(this.createSection(widget));
    });
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
