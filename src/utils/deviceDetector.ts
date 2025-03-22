/**
 * Device detection utility to determine the device type and browser capabilities
 */

export interface DeviceInfo {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isWindows: boolean;
    isMacOS: boolean;
    isTouch: boolean;
    browserName: string;
    browserVersion: string;
}

export class DeviceDetector {
    private static _instance: DeviceDetector;
    private _deviceInfo: DeviceInfo;

    private constructor() {
        this._deviceInfo = this.detectDevice();
    }

    /**
     * Get the singleton instance of DeviceDetector
     */
    public static get instance(): DeviceDetector {
        if (!DeviceDetector._instance) {
            DeviceDetector._instance = new DeviceDetector();
        }
        return DeviceDetector._instance;
    }

    /**
     * Get the current device information
     */
    public get deviceInfo(): DeviceInfo {
        return this._deviceInfo;
    }

    /**
     * Update the device information (useful after resize or orientation change)
     */
    public update(): DeviceInfo {
        this._deviceInfo = this.detectDevice();
        return this._deviceInfo;
    }

    /**
     * Detect the current device type and capabilities
     */
    private detectDevice(): DeviceInfo {
        const ua = navigator.userAgent;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Enhanced mobile detection
        const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
        const isMobileUA = mobileRegex.test(ua);
        
        // Check if mobile based on width or user agent
        const isMobile = width < 640 || isMobileUA;
        const isTablet = (width >= 640 && width < 1024) && !isMobileUA;
        const isDesktop = width >= 1024 && !isMobileUA;
        
        // Detect OS
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isAndroid = /Android/.test(ua);
        const isWindows = /Windows/.test(ua);
        const isMacOS = /Mac OS X/.test(ua) && !isIOS;
        
        // Detect touch capabilities
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        
        // Detect browser
        let browserName = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (/Edge\/\d+/.test(ua) || /Edg\/\d+/.test(ua)) {
            browserName = 'Edge';
        } else if (/Chrome\/\d+/.test(ua)) {
            browserName = 'Chrome';
        } else if (/Firefox\/\d+/.test(ua)) {
            browserName = 'Firefox';
        } else if (/Safari\/\d+/.test(ua) && !/Chrome\/\d+/.test(ua)) {
            browserName = 'Safari';
        } else if (/MSIE\/\d+/.test(ua) || /Trident\/\d+/.test(ua)) {
            browserName = 'IE';
        }
        
        // Extract version (simple extraction, can be improved)
        const versionMatch = ua.match(new RegExp(`${browserName}\\/([\\d.]+)`));
        if (versionMatch && versionMatch[1]) {
            browserVersion = versionMatch[1];
        }
        
        return {
            isMobile,
            isTablet,
            isDesktop,
            isIOS,
            isAndroid,
            isWindows,
            isMacOS,
            isTouch,
            browserName,
            browserVersion
        };
    }

    /**
     * Add a listener for orientation changes and resize events
     * @param callback Function to call when device orientation or size changes
     */
    public addResizeListener(callback: (deviceInfo: DeviceInfo) => void): void {
        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                const newInfo = this.update();
                callback(newInfo);
            }, 100); // Small delay to ensure dimensions are updated
        });
        
        // Handle window resize
        let resizeTimeout: number | null = null;
        window.addEventListener('resize', () => {
            if (resizeTimeout) {
                window.clearTimeout(resizeTimeout);
            }
            
            resizeTimeout = window.setTimeout(() => {
                const newInfo = this.update();
                callback(newInfo);
                resizeTimeout = null;
            }, 250); // Debounce resize events
        });
    }

    /**
     * Apply data attributes to the document based on device type
     */
    public applyDeviceAttributes(): void {
        document.documentElement.setAttribute('data-device-type', 
            this._deviceInfo.isMobile ? 'mobile' : 
            this._deviceInfo.isTablet ? 'tablet' : 'desktop'
        );
        
        document.documentElement.setAttribute('data-os', 
            this._deviceInfo.isIOS ? 'ios' : 
            this._deviceInfo.isAndroid ? 'android' : 
            this._deviceInfo.isWindows ? 'windows' : 
            this._deviceInfo.isMacOS ? 'macos' : 'other'
        );
        
        document.documentElement.setAttribute('data-touch', 
            this._deviceInfo.isTouch ? 'true' : 'false'
        );
        
        document.documentElement.setAttribute('data-browser', 
            this._deviceInfo.browserName.toLowerCase()
        );
    }
} 