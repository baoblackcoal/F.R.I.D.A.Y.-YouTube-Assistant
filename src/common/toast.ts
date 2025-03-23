export enum ToastType {
    Success = 'success',
    Error = 'error',
    Info = 'info'
}

interface ToastOptions {
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

export class Toast {
    private static container: HTMLElement;
    private static activeToast: HTMLElement | null = null;
    private static timeoutId: NodeJS.Timeout | null = null;

    private static createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'fri-toast-container';
            
            // 在移动版YouTube上设置toast的特定样式，确保它总是可见
            if (window.location.hostname === 'm.youtube.com') {
                this.container.style.zIndex = '9999';
                this.container.style.top = '60px';  // 避开移动版YouTube的头部
            }
            
            document.body.appendChild(this.container);
        }
    }

    private static clearExistingToast() {
        if (this.activeToast) {
            this.activeToast.classList.remove('show');
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
            this.container.removeChild(this.activeToast);
            this.activeToast = null;
        }
    }

    public static show(options: ToastOptions) {
        this.createContainer();
        this.clearExistingToast();

        const toast = document.createElement('div');
        toast.id = 'fri-toast';
        toast.className = `fri-toast fri-toast-${options.type}`;
        toast.textContent = options.message;

        this.container.appendChild(toast);
        this.activeToast = toast;

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove toast after duration
        this.timeoutId = setTimeout(() => {
            if (toast === this.activeToast) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (this.container.contains(toast)) {
                        this.container.removeChild(toast);
                    }
                    if (this.activeToast === toast) {
                        this.activeToast = null;
                    }
                }, 300);
            }
        }, options.duration || 3000);
    }
} 