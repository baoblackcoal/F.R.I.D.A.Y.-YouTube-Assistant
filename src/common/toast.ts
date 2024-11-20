interface ToastOptions {
    message: string;
    type: 'success' | 'error';
    duration?: number;
}

export class Toast {
    private static container: HTMLElement;

    private static createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    public static show(options: ToastOptions) {
        this.createContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${options.type}`;
        toast.textContent = options.message;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Remove toast after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                this.container.removeChild(toast);
            }, 300);
        }, options.duration || 3000);
    }
} 