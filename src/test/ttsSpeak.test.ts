import { TestSetup, TestHelpers, setupBrowserAndPage, createTestHelpers } from './commonTest';
import { Page } from 'puppeteer'; // Add this line

describe('TTS Tests', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;

  beforeAll(async () => {
    testSetup = await setupBrowserAndPage({ 
      usePopup: true, 
      url: 'https://www.youtube.com/watch?v=oc6RV5c1yd0' 
    });
    helpers = createTestHelpers();
  }, 60000);

  afterAll(async () => {
    await testSetup.browser?.close();
  });

  test('should speak text', async () => {
    const result = await helpers.runCommandAndGetOutput(
      testSetup.page, 
      'speak "test, Good day, world! May your moments be filled with peace."'
    );
    expect(result).toBe('Speaking...');

    const isSpeaking = await waitForSpeaking(testSetup.popupPage!);
    expect(isSpeaking).toBe(true);
  }, 20000);

  test('should stop speaking', async () => {
    await helpers.runCommandAndExpectOutput(
      testSetup.page, 
      'speak "This is a long sentence that should be interrupted"', 
      'Speaking...'
    );
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'stop');
    expect(result).toBe('TTS stopped');

    await new Promise(resolve => setTimeout(resolve, 500));
    const isSpeaking = await checkIsSpeaking(testSetup.popupPage!);
    expect(isSpeaking).toBe(false);
  }, 20000);
});

async function waitForSpeaking(popupPage: Page, timeout = 10000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const isSpeaking = await checkIsSpeaking(popupPage);
    if (isSpeaking) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

async function checkIsSpeaking(popupPage: Page): Promise<boolean> {
  return popupPage.evaluate(() => {
    return new Promise<boolean>(resolve => {
      chrome.tts.isSpeaking((speaking) => resolve(speaking));
    });
  });
}