import { globalConfig } from '../../config';
import { geminiAPI } from '../geminiApi';
import { TTSSpeak } from '../ttsSpeak';
import { CommandHandler } from './commandHandler';

export async function sayHello(name = 'world') {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('sayHello function called');
    return `Hello, ${name}!`;
}

export async function commandHandle() {
    if (!globalConfig.devTestCommandOpen) 
        return;

    const tts = TTSSpeak.getInstance();
    const api = geminiAPI;
    const commandHandler = new CommandHandler(tts, api);

    // gemini commands
    commandHandler.registerCommand('sayHello', async (args) => await sayHello(args[0]));
    commandHandler.registerCommand('setKey', async (args) => {
        await api.setKey(args[0]);
        return 'API key set successfully';
    });
    commandHandler.registerCommand('sayHelloByGemini', async () => await api.sayHelloByGemini());
    commandHandler.registerCommand('generate', async (args) => await api.generate(args.join(' ')));
    commandHandler.registerCommand('streamGenerate', async (args) => {
        await api.streamGenerate(args.join(' '), (text) => {
            console.log(text);
        });
        return 'Stream command executed successfully';
    });
    
    // tts commands
    commandHandler.registerCommand('speak', (args) => {
        tts.speak(args.join(' '));
        return 'Speaking...';
    });
    commandHandler.registerCommand('stop', () => {
        tts.stop();
        return 'TTS stopped';
    });

    //help command to list all commands
    commandHandler.registerCommand('help', () => {
        return commandHandler.getCommands().join('\n');
    });

    const inputElement = document.getElementById('ytbs_test_command');
    const outputElement = document.getElementById('ytbs_test_output');

    if (inputElement && outputElement) {
        inputElement.addEventListener('keypress', async function (event) {
            if (event.key === 'Enter') {
                const input = (event.target as HTMLInputElement).value;
                console.log(`Terminal input received: ${input}`);
                const output = await commandHandler.executeCommand(input);
                outputElement.textContent = output;
                (event.target as HTMLInputElement).value = ''; // Clear input after processing
            }
        });
    } else {
        console.error('Input or output element not found');
    }
}