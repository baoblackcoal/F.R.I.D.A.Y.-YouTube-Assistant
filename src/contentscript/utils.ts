"use strict";

export function logTime(name: string): void {
    const now = new Date();

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const performanceTime = performance.now();
    const milliseconds = Math.floor(performanceTime * 1000) % 1000; // milliseconds from page load

    console.log(`${name}: ${hours}:${minutes}:${seconds}.${milliseconds}`);
}
