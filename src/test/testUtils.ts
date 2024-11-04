import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { assert } from 'console';
import { globalConfig } from '../common/config';

export interface TestSetup {
  browser: Browser;
  page: Page;
  extensionId?: string;
  popupPage?: Page;
}

export interface TestHelpers {
  clearOutput: (page: Page) => Promise<void>;
  runCommandAndExpectOutput: (page: Page, command: string, expectedOutput: string, timeout?: number) => Promise<void>;
  runCommandAndGetOutput: (page: Page, command: string) => Promise<string>;
}

export interface TestUtils {
  setupBrowserAndPage: (options: {
    usePopup?: boolean;
    url?: string;
  }) => Promise<TestSetup>;
  createTestHelpers: () => TestHelpers;
}

const testUtils: TestUtils = {
  setupBrowserAndPage: async function(options: {
    usePopup?: boolean;
    url?: string;
  }): Promise<TestSetup> {
    //assert devTestCommandOpen is true, throw error if not
    if (!globalConfig.devTestCommandOpen) {
      throw new Error('devTestCommandOpen must be true');
    }

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
    await pageExample.goto('https://www.example.com');


    let extensionId: string | undefined;
    let popupPage: Page | undefined;

    if (options.usePopup) {
      const targets = await browser.targets();
      const extensionTarget = targets.find((target) => target.type() === 'service_worker');

      if (extensionTarget) {
        const extensionUrl = extensionTarget.url();
        extensionId = extensionUrl.split('/')[2];

        popupPage = await browser.newPage();
        await popupPage.goto(`chrome-extension://${extensionId}/popup.html?tab=0`);
      } else {
        throw new Error('Unable to find background page for the extension.');
      }
    }
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1500, height: 1000 });
    await page.goto(options.url || 'https://www.youtube.com/watch?v=oc6RV5c1yd0');

    await page.waitForSelector('#ytbs_test_command');
    await page.waitForSelector('#ytbs_test_output');

    return { browser, page, extensionId, popupPage };
  },

  createTestHelpers: function(): TestHelpers {
    return {
      clearOutput: async function (page: Page): Promise<void> {
        await page.evaluate(() => {
          document.querySelector('#ytbs_test_output')!.textContent = '';
        });
      },

      runCommandAndExpectOutput: async function (page: Page, command: string, expectedOutput: string, timeout = 30000): Promise<void> {
        await this.clearOutput(page);

        await page.type('#ytbs_test_command', command);
        await page.keyboard.press('Enter');

        await page.waitForFunction(
          (expected) => document.querySelector('#ytbs_test_output')!.textContent === expected,
          { timeout },
          expectedOutput
        );
      },

      runCommandAndGetOutput: async function (page: Page, command: string): Promise<string> {
        await this.clearOutput(page);

        await page.type('#ytbs_test_command', command);
        await page.keyboard.press('Enter');

        await page.waitForFunction(
          () => document.querySelector('#ytbs_test_output')!.textContent !== '',
          { timeout: 30000 }
        );

        return page.$eval('#ytbs_test_output', el => el.textContent || '');
      }
    };
  }
};

export default testUtils;
