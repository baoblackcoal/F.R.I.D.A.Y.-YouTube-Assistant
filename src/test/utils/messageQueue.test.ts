import { error } from 'console';
import { ITtsMessage, IMessageQueue, messageQueue } from '../../utils/messageQueue';
import { TestSetup, TestHelpers } from '../testUtils';
import testUtils from '../testUtils';

describe('MessageQueue Tests', () => {
  let testSetup: TestSetup;
  let helpers: TestHelpers;
  let queue: IMessageQueue;

  beforeAll(async () => {
    // testSetup = await testUtils.setupBrowserAndPage({ 
    //   usePopup: true, 
    //   url: 'https://www.example.com' 
    // });
    helpers = testUtils.createTestHelpers();
    queue = messageQueue;
  }, 60000);

  afterAll(async () => {
    // await testSetup.browser?.close();
  });

  test('should enqueue and process message', async () => {
    // define text arrys and queue multiple messages
    const textArray = [
        'Hello, world!\nNext line',    
        'This is a test message.',
        'Testing the message queue functionality.'
    ];
    const expectedMessage = [
        'Hello, world!', 
        'Next line',   
        'This is a test message.',
        'Testing the message queue functionality.'
    ];
    let expectedMessageIndex = 0;
    let errorThrown = false;
    textArray.forEach(text => {
        const message: ITtsMessage = {
            action: 'speakAndPlayVideo',
            text: text,
            index: 0,
        };
        queue.enqueue(message, (message) => {         
            // expect.assertions(1);
            console.log('message text: ', message.text, 'expectedMessage: ', expectedMessage[expectedMessageIndex]);
            errorThrown = message.text != expectedMessage[expectedMessageIndex];           
            expectedMessageIndex++;
        });
    });
    expect(errorThrown).toBe(false);
  }, 20000);
});