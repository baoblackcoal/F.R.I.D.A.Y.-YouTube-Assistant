export function copyTextToClipboard(text: string): void {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    } else {
        navigator.clipboard.writeText(text).then(
            () => {
                // Success callback
            },
            (err: any) => {
                console.log('Could not copy text: ', err);
            }
        );
    }

    function fallbackCopyTextToClipboard(text: string): void {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
            console.log('Fallback: Oops, unable to copy', err);
        }

        document.body.removeChild(textArea);
    }
}