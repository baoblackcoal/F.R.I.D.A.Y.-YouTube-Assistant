import { WidgetDemoConfig } from './types';
import { Icons } from '../common/icons';

export class DemoPage {
  private container: HTMLElement;
  private widgets: WidgetDemoConfig[] = [
    // Button Examples
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
    },
    
    // Text Input Examples
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
    },

    // Checkbox Examples
    {
      id: 'checkbox-1',
      label: 'Checkbox with Label',
      type: 'checkbox',
      props: { text: 'Enable notifications', checked: true }
    },
    {
      id: 'checkbox-2',
      label: 'Disabled Checkbox',
      type: 'checkbox',
      props: { text: 'Disabled option', disabled: true }
    },

    // Radio Button Examples
    {
      id: 'radio-group',
      label: 'Language Selection',
      type: 'radio',
      props: {
        name: 'language',
        options: [
          { value: 'en', label: 'English' },
          { value: 'es', label: 'Spanish' },
          { value: 'fr', label: 'French' }
        ]
      }
    },

    // Dropdown Example
    {
      id: 'dropdown',
      label: 'Theme Selection',
      type: 'dropdown',
      props: {
        options: [
          { value: 'light', label: 'Light Theme' },
          { value: 'dark', label: 'Dark Theme' },
          { value: 'system', label: 'System Default' }
        ]
      }
    },

    // Label Examples
    {
      id: 'label-info',
      label: 'Information Label',
      type: 'label',
      props: { 
        text: 'This is an informative label',
        variant: 'info'
      }
    },
    {
      id: 'label-warning',
      label: 'Warning Label',
      type: 'label',
      props: {
        text: 'This is a warning message',
        variant: 'warning'
      }
    },

    // Slider Example
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
    },

    // Progress Bar Examples
    {
      id: 'progress-determinate',
      label: 'Download Progress',
      type: 'progress',
      props: {
        value: 70,
        max: 100,
        variant: 'determinate'
      }
    },
    {
      id: 'progress-indeterminate',
      label: 'Loading',
      type: 'progress',
      props: {
        variant: 'indeterminate'
      }
    },

    // Icon Examples
    {
      id: 'icon-home',
      label: 'Home Icon',
      type: 'icon',
      props: {
        name: 'home',
        size: 24,
        color: 'blue'
      }
    },
    {
      id: 'icon-settings',
      label: 'Settings Icon',
      type: 'icon',
      props: {
        name: 'settings',
        size: 24,
        color: 'gray'
      }
    },

    // Toggle Switch Examples
    {
      id: 'toggle-theme',
      label: 'Dark Mode',
      type: 'toggle',
      props: {
        checked: false,
        onText: 'ON',
        offText: 'OFF'
      }
    },

    // Picture & Label Examples
    {
      id: 'picture-label-1',
      label: 'Feature Preview',
      type: 'picture',
      props: {
        src: 'path/to/feature-image.png',
        alt: 'Feature preview',
        caption: 'New features coming soon'
      }
    }
  ];

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'p-6 space-y-6';
    this.init();
  }

  private createWidget(config: WidgetDemoConfig): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'widget-demo-item p-4 border rounded-lg';

    const label = document.createElement('label');
    label.textContent = config.label;
    label.className = 'block text-sm font-medium text-gray-700 mb-2';

    const widget = this.renderWidget(config);
    
    wrapper.appendChild(label);
    wrapper.appendChild(widget);
    
    return wrapper;
  }

  private renderWidget(config: WidgetDemoConfig): HTMLElement {
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
      case 'label':
        return this.createLabel(config);
      case 'slider':
        return this.createSlider(config);
      case 'progress':
        return this.createProgressBar(config);
      case 'icon':
        return this.createIcon(config);
      case 'toggle':
        return this.createToggle(config);
      case 'picture':
        return this.createPictureLabel(config);
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

  private createLabel(config: WidgetDemoConfig): HTMLDivElement {
    const label = document.createElement('div');
    const variant = config.props?.variant || 'info';
    
    label.className = variant === 'warning'
      ? 'px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md'
      : 'px-4 py-2 bg-blue-100 text-blue-800 rounded-md';
    
    label.textContent = config.props?.text || '';
    return label;
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

  private createProgressBar(config: WidgetDemoConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full bg-gray-200 rounded-full h-2.5';

    if (config.props?.variant === 'indeterminate') {
      wrapper.innerHTML = `
        <div class="bg-blue-600 h-2.5 rounded-full w-1/2 animate-[loading_1s_ease-in-out_infinite]"></div>
      `;
    } else {
      const progress = document.createElement('div');
      progress.className = 'bg-blue-600 h-2.5 rounded-full';
      progress.style.width = `${config.props?.value || 0}%`;
      wrapper.appendChild(progress);
    }

    return wrapper;
  }

  private createIcon(config: WidgetDemoConfig): HTMLElement {
    const icon = document.createElement('span');
    icon.className = `icon-${config.props?.name} text-${config.props?.color}-600`;
    icon.style.fontSize = `${config.props?.size || 24}px`;
    icon.innerHTML = Icons[config.props?.name] || '';
    return icon;
  }

  private createToggle(config: WidgetDemoConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-center space-x-2';

    const toggle = document.createElement('button');
    toggle.className = `
      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 
      border-transparent transition-colors duration-200 ease-in-out focus:outline-none 
      ${config.props?.checked ? 'bg-blue-600' : 'bg-gray-200'}
    `;
    
    const toggleInner = document.createElement('span');
    toggleInner.className = `
      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow 
      ring-0 transition duration-200 ease-in-out
      ${config.props?.checked ? 'translate-x-5' : 'translate-x-0'}
    `;

    toggle.appendChild(toggleInner);
    wrapper.appendChild(toggle);
    return wrapper;
  }

  private createPictureLabel(config: WidgetDemoConfig): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'space-y-2';

    const picture = document.createElement('img');
    picture.src = config.props?.src || '';
    picture.alt = config.props?.alt || '';
    picture.className = 'w-full h-32 object-cover rounded-lg';

    const caption = document.createElement('p');
    caption.className = 'text-sm text-gray-600 text-center';
    caption.textContent = config.props?.caption || '';

    wrapper.appendChild(picture);
    wrapper.appendChild(caption);
    return wrapper;
  }

  private init(): void {
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold mb-6';
    title.textContent = 'Widget Demo';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 gap-6';

    this.widgets.forEach(widget => {
      grid.appendChild(this.createWidget(widget));
    });

    this.container.appendChild(grid);
  }

  public getElement(): HTMLElement {
    return this.container;
  }
}
