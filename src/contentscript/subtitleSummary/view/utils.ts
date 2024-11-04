import { settingsManager } from '../../../common/settingsManager';
import { IAbstractSettings } from '../../../common/ISettings';

// Utility functions
export const createToast = (message: string): void => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

export const getSettings = async (): Promise<IAbstractSettings> => {
    return await settingsManager.getSettings();
};