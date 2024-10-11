import { MessageObserver, IMessageObserver, TtsMessageHandler, MessageHandler } from '../../utils/messageObserver';
import testUtils, { TestSetup, TestHelpers } from '../testUtils';

describe('MessageObserver Singleton Tests', () => {
  let observer: IMessageObserver;

//   beforeEach(() => {
//     // Get the singleton instance for each test
//     observer = MessageObserver.getInstance('process_on');
//   });

//   test('should add and notify observers for specific message types', () => {
//     let taskHandlerCalled = false;
//     let notificationHandlerCalled = false;
//     const taskHandler = (message: MessageHandler) => {
//         console.log('Observer 1 received task message:', message);
//         taskHandlerCalled = true;
//     };
//     const notificationHandler = (message: MessageHandler) => {
//         console.log('Observer 2 received notification message:', message);
//         notificationHandlerCalled = true;
//     };

//     observer.addObserver('task', taskHandler);
//     observer.addObserver('notification', notificationHandler);

//     observer.notifyObservers('task', { type: 'task', task: 'fetchData', id: 42 } );
//     observer.notifyObservers('notification', { type: 'notification', message: 'New notification' });

//     // Verify that the correct handlers were called
//     expect(taskHandlerCalled).toBe(true);
//     expect(notificationHandlerCalled).toBe(true);
//   });

  let testSetup: TestSetup;
  let helpers: TestHelpers;

  beforeAll(async () => {
    testSetup = await testUtils.setupBrowserAndPage({
      usePopup: false,
      url: 'https://www.youtube.com/watch?v=oc6RV5c1yd0'
    });
    helpers = testUtils.createTestHelpers();
    observer = MessageObserver.getInstance();
  }, 60000);

  afterAll(async () => {
    await testSetup.browser?.close();
  });

  test('should add and notify TTS message observers', async () => {
    const action = 'speak';
    const addObserverCommand = `addTtsObserver "${action}"`;
    const notifyObserversCommand = `notifyTtsObserver "${action}"`;

    await helpers.runCommandAndExpectOutput(testSetup.page, `msTtsSpeak hello`, 'Speaking...', 10000);

    // Add a TTS observer for the 'speak' action
    const addObserverOutput = await helpers.runCommandAndGetOutput(testSetup.page, addObserverCommand);
    console.log('addObserverOutput:', addObserverOutput);
    expect(addObserverOutput).toContain(`Observer added for action: "${action}"`);

    // Notify observers for the 'speak' action
    const notifyObserversOutput = await helpers.runCommandAndGetOutput(testSetup.page, notifyObserversCommand);
    console.log('notifyObserversOutput:', notifyObserversOutput);
    expect(notifyObserversOutput).toContain(`Notified observers for action: "${action}"`);

    // Verify that the TTS observer received the message (you can check the console output)
  }, 300000);
});
