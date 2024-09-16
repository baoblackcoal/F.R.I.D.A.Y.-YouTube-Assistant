export async function sayHello(name = 'world') {
    //wait for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('sayHello function called');
    return `Hello, ${name}!`;
}

export function commandHandle() {
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
                if (input.startsWith('sayHello')) {
                    const args = input.split(' ');
                    const name = args[1] || undefined;
                    output = await sayHello(name);
                } else {
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