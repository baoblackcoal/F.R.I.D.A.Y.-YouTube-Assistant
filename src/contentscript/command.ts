import { globalConfig } from '../config';
import { geminiAPI } from './geminiApi';
import { TTSInterface, TTSSpeak } from './ttsSpeak';

export async function sayHello(name = 'world') {
    //wait for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('sayHello function called');
    return `Hello, ${name}!`;
}

export function commandHandle() {
    if (!globalConfig.testCommandOpen) 
        return;

    const tts: TTSInterface = TTSSpeak.getInstance();
    // Get references to the inserted elements
    const inputElement = document.getElementById('ytbs_test_command');
    const outputElement = document.getElementById('ytbs_test_output');

    if (inputElement && outputElement) {
        // Add event listener to input element
        inputElement.addEventListener('keypress', async function (event) {
            if (event.key === 'Enter') {
                const input = (event.target as HTMLInputElement).value;
                console.log(`Terminal input received: ${input}`);
                let output;
                const [command, ...args] = input.split(' ');

                switch (command) {
                    case 'sayHello':
                        output = await sayHello(args[0]);
                        break;
                    case 'setKey':
                        await geminiAPI.setKey(args[0]);
                        output = 'API key set successfully';
                        break;
                    case 'sayHelloByGemini':
                        output = await geminiAPI.sayHelloByGemini();
                        break;
                    case 'generate':
                        output = await geminiAPI.generate(args.join(' '));
                        break;
                    case 'speak':
                        tts.speak(args.join(' '));
                        output = 'Speaking...';
                        break;
                    case 'stop':
                        tts.stop();
                        output = 'TTS stopped';
                        break;
                    default:
                        output = 'Unknown command';
                }

                outputElement.textContent = output;
                (event.target as HTMLInputElement).value = ''; // Clear input after processing
            }
        });
    } else {
        console.error('Input or output element not found');
    }
}