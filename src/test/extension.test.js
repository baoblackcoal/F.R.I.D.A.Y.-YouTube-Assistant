const path = require('path');
const puppeteer = require('puppeteer');

describe('Chrome Extension Demo Tests', () => {
    let browser;
    let page;
    let backgroundPage;
    let popupPage;
    let optionsPage;
    let extensionId;

    beforeAll(async () => {
        const pathToExtension = path.join(__dirname, '../../dist');
        browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${pathToExtension}`,
                `--load-extension=${pathToExtension}`,
                // '--headless=new', // Use new headless mode for extensions
                // '--no-sandbox', // Optional
                // '--disable-setuid-sandbox', // Optional
            ],
        });

        // Open a new page and navigate to the test URL
        page = await browser.newPage();
        await page.goto('https://www.example.com');

        // Find the extension's background page
        const targets = await browser.targets();
        const extensionTarget = targets.find((target) => target.type() === 'service_worker');

        if (extensionTarget) {
            backgroundPage = await extensionTarget.worker();
            // Extract the extension ID from the service worker's URL
            const extensionUrl = extensionTarget.url();
            extensionId = extensionUrl.split('/')[2]; // Get the extension ID part from the URL
        } else {
            throw new Error('Unable to find background page for the extension.');
        }
    });

    afterAll(async () => {
        await browser.close();
    });

    test('Content script should modify the page', async () => {
        // Check the border style applied by the content script
        const borderColor = await page.evaluate(() => document.body.style.border);
        expect(borderColor).toBe('5px solid red');
    });

    test('Popup button should fetch data and save value to storage', async () => {
        // Open a new page for testing content script
        page = await browser.newPage();
        await page.goto('https://www.example.com');

        // Open the extension's popup page with a test tab ID
        const testTabId = 1; // Example tab ID to be passed
        popupPage = await browser.newPage();
        await popupPage.goto(`chrome-extension://${extensionId}/popup.html?tab=${testTabId}`);


        // Ensure the popup page is loaded
        await popupPage.waitForSelector('#fetchBtn');

        // Simulate a click on the button in the popup
        await popupPage.click('#fetchBtn');

        // Check that the value 1 was saved to storage
        const savedValue = await popupPage.evaluate(() => {
            return new Promise((resolve) => {
                chrome.storage.sync.get('savedValue', (data) => {
                    resolve(data.savedValue);
                });
            });
        });

        expect(savedValue).toBe(1); // Verify the saved value is 1
    });

    test('Options page should save and load settings', async () => {
        // Open the extension's options page
        optionsPage = await browser.newPage();
        await optionsPage.goto(`chrome-extension://${extensionId}/options.html`); // Load the options page

        // Make sure we're on the options page
        await optionsPage.waitForSelector('#bgColor');

        // Set a new color in the options page
        const newColor = '#ff0000'; // Example color (red)
        await optionsPage.evaluate((color) => {
            document.getElementById('bgColor').value = color;
        }, newColor);

        // Simulate a click on the save button
        await optionsPage.click('#saveBtn');

        // Verify that the color is saved in storage
        const storedColor = await optionsPage.evaluate(() =>
            new Promise((resolve) => {
                chrome.storage.sync.get('bgColor', (data) => {
                    resolve(data.bgColor);
                });
            })
        );

        expect(storedColor).toBe(newColor);

        // Reload the options page to check if the saved color is loaded
        await optionsPage.reload();
        await optionsPage.waitForSelector('#bgColor');

        // Check if the input value matches the stored color
        const loadedColor = await optionsPage.evaluate(() => document.getElementById('bgColor').value);
        expect(loadedColor).toBe(newColor);
    });
});
