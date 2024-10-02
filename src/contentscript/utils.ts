"use strict";

export async function logTime(name: string): Promise<void> {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const performanceTime = performance.now();
    const milliseconds = Math.floor(performanceTime * 1000) % 1000; // milliseconds from page load

    console.log(`${name}: ${hours}:${minutes}:${seconds}.${milliseconds}`);
}


export function waitForElm(selector: string): Promise<Element> {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector)!);
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector)!);
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}