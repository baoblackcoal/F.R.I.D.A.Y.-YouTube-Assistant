import { sayHelloByGemini, generate, setKey } from '../contentscript/gemini_api';
import dotenv from "dotenv";
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { exec } from 'child_process';
import fs from 'fs';

dotenv.config();

const gemini_api_key = process.env.GEMINI_API_KEY;

if (!gemini_api_key) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables");
}

describe('Gemini API Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    const extensionPath = '../../dist';
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${path.resolve(__dirname, extensionPath)}`,
        `--load-extension=${path.resolve(__dirname, extensionPath)}`,
        '--window-size=1280,720', // Adjusted to a common 16:9 aspect ratio
      ]
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 }); // Set viewport size
    await page.goto('https://www.youtube.com/watch?v=oc6RV5c1yd0');

    console.log('page.goto done');

    // Wait for the input and output elements to be injected
    await page.waitForSelector('#ytbs_test_command');
    await page.waitForSelector('#ytbs_test_output');
    console.log('Input and output elements are injected');

  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should return "Hello, world!" from sayHello function without arguments', async () => {
    await page.type('#ytbs_test_command', 'sayHello');
    await page.keyboard.press('Enter');

    // Wait for the result to appear (considering the 3-second delay)
    await page.waitForFunction(
      () => document.querySelector('#ytbs_test_output')!.textContent !== '',
      { timeout: 10000 }
    );

    const result = await page.$eval('#ytbs_test_output', el => el.textContent);
    expect(result).toBe("Hello, world!");
  }, 20000); // Increase timeout to 10 seconds


});

