export interface APIInterface {
    setKey(key: string): Promise<void>;
    sayHelloByGemini(): Promise<string>;
    generate(text: string): Promise<string>;
}