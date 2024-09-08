import { sayHelloByGemini, generate, setKey } from '../contentscript/gemini_api'; // Import the function to test
import dotenv from "dotenv";
// Load environment variables from .env file
const gemini_api_key = process.env.GEMINI_API_KEY;
dotenv.config();

const axios = require('axios');

setKey(gemini_api_key);

test('sayHelloByGemini test real api call', (done) => {
  sayHelloByGemini().then(() => {
    // Your assertions here
    done();
  }).catch(error => {
    console.error('Error during test:', error);
    done(error); // Pass the error to done to mark the test as failed
  });
}, 20000);


test('generate test real api call', (done) => {
  generate("Hello").then((response_text) => {
    expect(response_text).not.toBeNull();
    console.log(response_text);
    done();
  }).catch(error => {
    console.error('Error during test:', error);
    done(error); // Pass the error to done to mark the test as failed
  });
}, 20000);