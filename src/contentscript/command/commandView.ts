import { globalConfig } from "../../common/config";

export function insertCommandContainer(): void {
    if (!globalConfig.devTestCommandOpen)
        return;

    const styles = `
        <style>
            #ytbs_test_container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                background: rgba(33, 33, 33, 0.95);
                padding: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                cursor: move;
                min-width: 300px;                
            }
            #ytbs_test_container * {
                cursor: default;
            }
            #ytbs_test_command {
                width: 280px;
                padding: 8px;
                border: 1px solid #666;
                border-radius: 4px;
                background: #333;
                color: #fff;
                margin-bottom: 8px;
            }
            #ytbs_test_output {
                width: 280px;
                padding: 8px;
                min-height: 20px;
                color: #fff;
                border: 1px solid #666;
                border-radius: 4px;
                background: #333;
                font-size: 12px;
            }
            #ytbs_test_header {
                padding: 8px 10px;
                border-radius: 4px 4px 0 0;
                cursor: move;
                user-select: none;
                border-bottom: 1px solid #666;
                font-size: 14px;
                color: #fff;
            }
        </style>
    `;

    const commandContainerHTML = `
    ${styles}
    <div id="ytbs_test_container">
        <div id="ytbs_test_header">Command Debugger</div>
        <input type="text" id="ytbs_test_command" placeholder="Enter command...">
        <div id="ytbs_test_output">No command entered yet.</div>
    </div>
    `;

    if (document.querySelector("#ytbs_test_container")) { (document.querySelector("#ytbs_test_container") as HTMLElement).innerHTML = ""; }

    document.body.insertAdjacentHTML("afterbegin", commandContainerHTML);

    // Add drag functionality
    const container = document.getElementById('ytbs_test_container');

    if (container) {
        let isDragging = false;
        let currentX: number;
        let currentY: number;
        let initialX: number;
        let initialY: number;
        let xOffset = 0;
        let yOffset = 0;

        container.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e: MouseEvent) {
            if (e.target === container) {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                isDragging = true;
            }
        }

        function drag(e: MouseEvent) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;

                container!.style.transform = 
                    `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd() {
            isDragging = false;
        }
    }
}
