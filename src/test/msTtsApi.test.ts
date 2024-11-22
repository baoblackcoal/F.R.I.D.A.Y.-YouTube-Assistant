import { MsTtsApi } from '../common/msTtsApi';
import testUtils, { TestSetup, TestHelpers } from './testUtils';
import { jest } from '@jest/globals';

describe('MsTtsApi End-to-End', () => {
    let testSetup: TestSetup;
    let helpers: TestHelpers;

    beforeAll(async () => {
        testSetup = await testUtils.setupBrowserAndPage({
            usePopup: false,
            url: 'https://www.youtube.com/watch?v=oc6RV5c1yd0' // Use a relevant URL for your test
        });
        helpers = testUtils.createTestHelpers();
    }, 60000);

    afterAll(async () => {
        await testSetup.browser?.close();
    });

    test('should handle msTtsSpeak command', async () => {
        const text = "Hello, this is a test.";
        const command = `msTtsSpeak "${text}"`;
        await helpers.runCommandAndExpectOutput(testSetup.page, command, 'Speaking...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }, 30000);
});