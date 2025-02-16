import { globalConfig } from '../../common/config';
import { geminiAPI } from '../../common/geminiApi';
import { TTSSpeak } from '../../common/ttsSpeak';
import { CommandHandler } from './commandHandler';
import { MsTtsApi } from '../../common/msTtsApi';
import { MessageObserver } from '../../utils/messageObserver';
import { ITtsMessage } from '../../utils/messageQueue';

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
    const msTtsApi = MsTtsApi.getInstance(); 
    const commandHandler = new CommandHandler(tts, api);
    const messageObserver = MessageObserver.getInstance();

    // gemini commands
    commandHandler.registerCommand('sayHello', async (args) => await sayHello(args[0]));
    commandHandler.registerCommand('setKey', async (args) => {
        await api.setKey(args[0]);
        return 'API key set successfully';
    });
    commandHandler.registerCommand('sayHelloByGemini', async () => await api.sayHelloByGemini());
    commandHandler.registerCommand('generate', async (args) => await api.generate(args.join(' ')));
    commandHandler.registerCommand('streamGenerate', async (args) => {
        await api.streamGenerate(args.join(' '), async (text) => {
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
    commandHandler.registerCommand('checkSpeaking', async () => {
        return tts.isSpeaking().toString();
    });

    // Register msTtsSpeak command
    commandHandler.registerCommand('msTtsSpeak', async (args) => {
        await msTtsApi.synthesizeSpeech(args.join(' '));
        return 'Speaking...';
    });

    //help command to list all commands
    commandHandler.registerCommand('help', () => {
        return commandHandler.getCommands().join('\n');
    });

    // Register TTS message observer command
    commandHandler.registerCommand('addTtsObserver', (args) => {
        const action = args[0];
        const message: ITtsMessage = {
            action: action,
            text: 'test',
            index: 0,
        };
        messageObserver.addObserverTtsMessage(message, (message) => {
            console.log(`TTS Observer received message:`, message);
        });
        return `Observer added for action: ${action}`;
    });

    // Notify TTS message observers command
    commandHandler.registerCommand('notifyTtsObserver', (args) => {
        const action = args[0];
        const message: ITtsMessage = {
            action: action,
            text: 'test',
            index: 0,
        };
        messageObserver.notifyObserversTtsMessage(message);
        return `Notified observers for action: ${action}`;
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
        console.log('Input or output element not found');
    }
}