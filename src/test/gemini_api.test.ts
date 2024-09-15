import { sayHelloByGemini, generate, setKey } from '../contentscript/gemini_api';
import dotenv from "dotenv";

dotenv.config();

const gemini_api_key = process.env.GEMINI_API_KEY;

if (!gemini_api_key) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables");
}

process.env.http_proxy = 'http://192.168.1.16:10811';
process.env.https_proxy = 'http://192.168.1.16:10811';

setKey(gemini_api_key);


test('sayHelloByGemini test real api call', (done) => {
  sayHelloByGemini().then((response) => {
    expect(response).toBeDefined(); // Add assertion to check response
    // Your additional assertions here
    done();
  }).catch(error => {
    console.error('Error during test:', error);
    done(error); // Ensure the test fails if there's an error
  });
}, 20000);

test('generate test real api call', (done) => {
  generate("Hello").then((response_text) => {
    expect(response_text).not.toBeNull();
    console.log('Response text:', response_text);
    // Add more detailed assertions based on the expected structure of response_text
    expect(response_text).toHaveProperty('someExpectedProperty'); // Example assertion
    done();
  }).catch(error => {
    console.error('Error during test:', error);
    done(error); // Ensure the test fails if there's an error
  });
}, 20000);