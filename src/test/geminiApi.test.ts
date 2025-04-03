import { sayHelloByGemini, generate, setKey } from '../common/geminiApi';
import dotenv from "dotenv";
import { TestSetup, TestHelpers } from './testUtils';
import testUtils from './testUtils';

dotenv.config();

const GEMINI_API_KEY_DEV = process.env.GEMINI_API_KEY_TEST;
if (!GEMINI_API_KEY_DEV) {
  throw new Error("GEMINI_API_KEY_TEST is not set in the environment variables");
}

describe('Gemini API Tests', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;

  beforeAll(async () => {
    testSetup = await testUtils.setupBrowserAndPage({ url: 'https://www.youtube.com/watch?v=oc6RV5c1yd0' });
    helpers = testUtils.createTestHelpers();
  }, 60000);

  afterAll(async () => {
    await testSetup.browser?.close();
  });

  // do not delete this test, as it is used to test fast install extension
  // test('test log', async () => {
  //   console.log('test log');
  //   await new Promise(resolve => setTimeout(resolve, 2000000));
  // }, 2000000);

  test('sayHello for test terminal', async () => {
    await helpers.runCommandAndExpectOutput(testSetup.page, 'sayHello', "Hello, world!");
  }, 20000);

  test('should set API key and generate content', async () => {
    await helpers.runCommandAndExpectOutput(testSetup.page, `setKey ${GEMINI_API_KEY_DEV}`, 'API key set successfully');
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'generate "Tell me a joke"');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 60000);

  test('should call sayHelloByGemini', async () => {
    await helpers.runCommandAndExpectOutput(testSetup.page, `setKey ${GEMINI_API_KEY_DEV}`, 'API key set successfully');
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'sayHelloByGemini');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 60000);

  test('should return error for invalid API key', async () => {
    const invalidKey = 'invalid_api_key_12345';
    await helpers.runCommandAndExpectOutput(testSetup.page, `setKey ${invalidKey}`, 'API key set successfully');
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'generate "Hello"');
    expect(result).toContain('Error');
  }, 60000);

  test('should handle multiple consecutive requests', async () => {
    await helpers.runCommandAndExpectOutput(testSetup.page, `setKey ${GEMINI_API_KEY_DEV}`, 'API key set successfully');
    const prompts = ['Tell me a joke', 'What is the capital of France?', 'Hello'];
    for (const prompt of prompts) {
      const result = await helpers.runCommandAndGetOutput(testSetup.page, `generate "${prompt}"`);
      console.log(prompt);
      console.log(result);
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    }
  }, 60000);

  test('should handle streamGenerate', async () => {
    await helpers.runCommandAndExpectOutput(testSetup.page, `setKey ${GEMINI_API_KEY_DEV}`, 'API key set successfully');
    const result = await helpers.runCommandAndGetOutput(testSetup.page, 'streamGenerate "Tell me about the future of AI"');
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  }, 60000);
});

