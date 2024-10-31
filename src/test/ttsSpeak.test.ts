import { TestSetup, TestHelpers } from './testUtils';
import testUtils from './testUtils';
import { Page } from 'puppeteer';

describe('TTS Tests', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;

  beforeAll(async () => {
    testSetup = await testUtils.setupBrowserAndPage({ 
      usePopup: false, 
      url: 'https://www.youtube.com/watch?v=oc6RV5c1yd0' 
    });
    helpers = testUtils.createTestHelpers();
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

    const isSpeaking = await waitForSpeaking();
    expect(isSpeaking).toBe(true);
  }, 200000);

  it('should stop speaking', async () => {
    await helpers.runCommandAndExpectOutput(
      testSetup.page, 
      'speak "This is a long sentence that should be interrupted, This is a long sentence that should be interrupted, This is a long sentence that should be interrupted."', 
      'Speaking...'
    );
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'stop');
    expect(result).toBe('TTS stopped');

    await new Promise(resolve => setTimeout(resolve, 1000));
    const isSpeaking = await checkIsSpeaking();
    console.log('isSpeaking:', isSpeaking); // Add logging
    expect(isSpeaking).toBe(false);
  }, 20000);

  async function waitForSpeaking(timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const isSpeaking = await checkIsSpeaking();
      if (isSpeaking) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }
  
  async function checkIsSpeaking(): Promise<boolean> {
    return await helpers.runCommandAndGetOutput(testSetup.page, 'checkSpeaking') === 'true';        
  }
});

