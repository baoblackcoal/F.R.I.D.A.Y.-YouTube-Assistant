import { sayHelloByGemini, generate, setKey } from '../contentscript/gemini_api';
import dotenv from "dotenv";
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY_TEST;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY_TEST is not set in the environment variables");
}

describe('Gemini API Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // Setup browser and page
    ({ browser, page } = await setupBrowserAndPage());
  }, 60000);

  afterAll(async () => {
    await browser?.close();
  });

  test('sayHello for test terminal', async () => {
    await runCommandAndExpectOutput(page, 'sayHello', "Hello, world!");
  }, 20000);

  test('should set API key and generate content', async () => {
    await runCommandAndExpectOutput(page, `setKey ${GEMINI_API_KEY}`, 'API key set successfully');
    const result = await runCommandAndGetOutput(page, 'generate "Tell me a joke"');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 60000);

  test('should call sayHelloByGemini', async () => {
    await runCommandAndExpectOutput(page, `setKey ${GEMINI_API_KEY}`, 'API key set successfully');
    const result = await runCommandAndGetOutput(page, 'sayHelloByGemini');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 60000);

  test('should return error for invalid API key', async () => {
    const invalidKey = 'invalid_api_key_12345';
    await runCommandAndExpectOutput(page, `setKey ${invalidKey}`, 'API key set successfully');
    const result = await runCommandAndGetOutput(page, 'generate "Hello"');
    expect(result).toContain('Error');
  }, 60000);

  test('should handle multiple consecutive requests', async () => {
    await runCommandAndExpectOutput(page, `setKey ${GEMINI_API_KEY}`, 'API key set successfully');
    const prompts = ['Tell me a joke', 'What is the capital of France?', 'Hello'];
    for (const prompt of prompts) {
      const result = await runCommandAndGetOutput(page, `generate "${prompt}"`);
      console.log(prompt);
      console.log(result);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    }
  }, 60000);
});

// Helper functions
async function setupBrowserAndPage(): Promise<{ browser: Browser; page: Page }> {
  const extensionPath = '../../dist';
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${path.resolve(__dirname, extensionPath)}`,
      `--load-extension=${path.resolve(__dirname, extensionPath)}`,
      '--window-size=1280,720',
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('https://www.youtube.com/watch?v=oc6RV5c1yd0');

  await page.waitForSelector('#ytbs_test_command');
  await page.waitForSelector('#ytbs_test_output');

  return { browser, page };
}

async function clearOutput(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelector('#ytbs_test_output')!.textContent = '';
  });
}

async function runCommandAndExpectOutput(page: Page, command: string, expectedOutput: string): Promise<void> {
  await clearOutput(page);

  await page.type('#ytbs_test_command', command);
  await page.keyboard.press('Enter');

  await page.waitForFunction(
    (expected) => document.querySelector('#ytbs_test_output')!.textContent === expected,
    { timeout: 30000 },
    expectedOutput
  );
}

async function runCommandAndGetOutput(page: Page, command: string): Promise<string> {
  await clearOutput(page);

  await page.type('#ytbs_test_command', command);
  await page.keyboard.press('Enter');

  await page.waitForFunction(
    () => document.querySelector('#ytbs_test_output')!.textContent !== '',
    { timeout: 30000 }
  );

  return page.$eval('#ytbs_test_output', el => el.textContent || '');
}

