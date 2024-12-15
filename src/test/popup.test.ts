import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { exec } from 'child_process';
import { defaultTtsSettings } from '../common/settings';
import { ITtsSettings, ApiType } from '../common/ISettings';

describe('Popup Test', () => {
  let browser: Browser;
  let popupPage: Page;
  let extensionId: string;
  let pageExample: Page;
  const testTabId = 0;

  beforeAll(async () => {
    const extensionPath = '../../dist';
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${path.resolve(__dirname, extensionPath)}`,
        `--load-extension=${path.resolve(__dirname, extensionPath)}`,
      ]
    });

    pageExample = await browser.newPage();
    await pageExample.goto('https://www.example.com');

    const targets = await browser.targets();
    const extensionTarget = targets.find((target) => target.type() === 'service_worker');

    if (extensionTarget) {
      const backgroundPage = await extensionTarget.worker();
      const extensionUrl = extensionTarget.url();
      extensionId = extensionUrl.split('/')[2];
    } else {
      throw new Error('Unable to find background page for the extension.');
    }

    popupPage = await browser.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html?tab=${testTabId}`);
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should log ok', async () => {
    console.log('ok');
  });

  it('should display the correct title', async () => {
    const title = await popupPage.title();
    expect(title).toBe('TTS Settings');
  });

  async function changeVolume(value: number) {
    await popupPage.evaluate((newValue) => {
      const pitchInput = document.querySelector<HTMLInputElement>('#volume');
      if (pitchInput) {
        pitchInput.value = newValue.toString();
        const changeEvent = new Event('change', { bubbles: true });
        pitchInput.dispatchEvent(changeEvent);
      } else {
        throw new Error("#volume element not found");
      }
    }, value);
  }

  it('should save settings when changed', async () => {
    const settings: ITtsSettings = {
      apiType: ApiType.Azure,
      volume: 0.8,
      pitch: 1.25,
      rate: 1.5,
      language: '',
      voiceName: '',
      voiceNameRobinson: ''
    };

    await popupPage.select('#language', settings.language);
    await popupPage.select('#voiceName', settings.voiceName);
    await popupPage.select('#voiceNameRobinson', settings.voiceNameRobinson);
    await popupPage.select('#speed', settings.rate.toString());
    await popupPage.select('#pitch', settings.pitch.toString());
    await changeVolume(settings.volume);

    await popupPage.click('#test');
    await new Promise(resolve => setTimeout(resolve, 500));
    const isSpeaking = await popupPage.evaluate(() => {
      return new Promise<boolean>(resolve => {
        chrome.tts.isSpeaking((data) => resolve(data));
      });
    });
    expect(isSpeaking).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 2000));
    await popupPage.click('#stop');

    const savedSettings = await popupPage.evaluate(() => {
      return new Promise<ITtsSettings>(resolve => {
        chrome.storage.sync.get('ttsSettings', (data: { [key: string]: any }) => resolve(data.ttsSettings));
      });
    });

    expect(savedSettings.language).toBe(settings.language);
    expect(savedSettings.voiceName).toBe(settings.voiceName);
    expect(savedSettings.rate).toBe(settings.rate);
    expect(savedSettings.pitch).toBe(settings.pitch);
    expect(savedSettings.volume).toBe(settings.volume);
  }, 30000);

  it('should reset settings to default', async () => {
    await popupPage.click('#reset');

    const defaultSettings = await popupPage.evaluate(() => {
      return new Promise<ITtsSettings>(resolve => {
        chrome.storage.sync.get('ttsSettings', (data: { [key: string]: any }) => resolve(data.ttsSettings));
      });
    });

    expect(defaultSettings.language).toBe('');
    expect(defaultSettings.voiceName).toBe('');
    expect(defaultSettings.rate).toBe(1.0);
    expect(defaultSettings.pitch).toBe(1.0);
    expect(defaultSettings.volume).toBe(1.0);
  });
});