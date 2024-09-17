import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';

describe('TTS Tests', () => {
  let browser: Browser;
  let page: Page;
  let extensionId: string;
  let popupPage: Page;
  const testTabId = 0;

  beforeAll(async () => {
    ({ browser, page, extensionId, popupPage } = await setupBrowserAndPage());
  }, 60000);

  afterAll(async () => {
    await browser?.close();
  });

  test('should speak text', async () => {
    const result = await runCommandAndGetOutput(page, 'speak "test, Good day, world! May your moments be filled with peace."');
    expect(result).toBe('Speaking...');

    let isSpeaking = false;
    let timeout = 0;
    while (true) {
      isSpeaking = await popupPage.evaluate(() => {
        return new Promise<boolean>(resolve => {
          chrome.tts.isSpeaking((data) => resolve(data));
        });
      });
      if (isSpeaking) {
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      timeout += 100;
      if (timeout >= 10000) {
        fail('TTS is not speaking');
      }
    }
    expect(isSpeaking).toBe(true);

  }, 20000);

  test('should stop speaking', async () => {
    await runCommandAndExpectOutput(page, 'speak "This is a long sentence that should be interrupted"', 'Speaking...');
    const result = await runCommandAndGetOutput(page, 'stop');
    expect(result).toBe('TTS stopped');

    await new Promise(resolve => setTimeout(resolve, 500));
    const isSpeaking = await popupPage.evaluate(() => {
      return new Promise<boolean>(resolve => {
        chrome.tts.isSpeaking((data) => resolve(data));
      });
    });

    expect(isSpeaking).toBe(false);
  }, 20000);
});

// Helper functions (similar to gemini_api.test.ts)
async function setupBrowserAndPage(): Promise<{ browser: Browser; page: Page; extensionId: string; popupPage: Page }> {
  const extensionPath = '../../dist';
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${path.resolve(__dirname, extensionPath)}`,
      `--load-extension=${path.resolve(__dirname, extensionPath)}`,
      '--window-size=1500,1000',
    ]
  });

  const pageExample = await browser.newPage();
  await pageExample.setViewport({ width: 1500, height: 1000 });
  await pageExample.goto('https://example.com');

  const targets = await browser.targets();
  const extensionTarget = targets.find((target) => target.type() === 'service_worker');

  let extensionId: string;
  let popupPage: Page;
  const testTabId = 0;
  if (extensionTarget) {
    const backgroundPage = await extensionTarget.worker();
    const extensionUrl = extensionTarget.url();
    extensionId = extensionUrl.split('/')[2];
  } else {
    throw new Error('Unable to find background page for the extension.');
  }

  popupPage = await browser.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html?tab=${testTabId}`);


  
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });
  await page.goto('https://www.youtube.com/watch?v=oc6RV5c1yd0');

  await page.waitForSelector('#ytbs_test_command');
  await page.waitForSelector('#ytbs_test_output');

  return { browser, page, extensionId, popupPage };

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