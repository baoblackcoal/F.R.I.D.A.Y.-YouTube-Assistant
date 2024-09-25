import { TTSInterface } from './ttsInterface';
import { APIInterface } from './apiInterface';

type CommandFunction = (args: string[]) => Promise<string> | string;

export class CommandHandler {
    private commands: Map<string, CommandFunction> = new Map();

    constructor(private tts: TTSInterface, private api: APIInterface) {}

    registerCommand(command: string, handler: CommandFunction) {
        this.commands.set(command, handler);
    }

    async executeCommand(input: string): Promise<string> {
        const [command, ...args] = input.split(' ');
        const handler = this.commands.get(command);

        if (handler) {
            return await handler(args);
        } else {
            return 'Unknown command';
        }
    }

    getCommands(): string[] {
        return Array.from(this.commands.keys());
    }
}