import { sayHelloByGemini } from './gemini_api'; // Import the function to test

const axios = require('axios');

// Function to set up axios proxy configuration
function setupProxy() {
  const proxyAddress = 'http://192.168.1.16:10811';
  axios.defaults.proxy = {
    host: '192.168.1.16',
    port: 10811
  };
}

test('sayHelloByGemini test real api call', (done) => {
  // Set up proxy before making the call
  //setupProxy();

  sayHelloByGemini().then(() => {
    // Your assertions here
    done();
  }).catch(error => {
    console.error('Error during test:', error);
    done(error); // Pass the error to done to mark the test as failed
  });
}, 20000);