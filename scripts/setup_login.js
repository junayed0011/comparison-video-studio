const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

async function setup() {
    const userDataDir = path.join(__dirname, '../user_data');
    if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    console.log("--------------------------------------------------");
    console.log("BYPASSING SECURITY: Launching Edge natively...");
    console.log(`Profile Path: ${userDataDir}`);
    console.log("--------------------------------------------------");
    console.log("ACTION REQUIRED:");
    console.log("1. Log in to ChatGPT, Grok.com, and Google in the window that opens.");
    console.log("2. CLOSE the browser window completely when done to save your session.");
    console.log("--------------------------------------------------");

    // Launch Edge natively via shell to avoid ALL automation detection
    const edgePath = 'msedge.exe';
    const args = [
        `--user-data-dir="${userDataDir}"`,
        '--profile-directory="Default"',
        '--no-first-run'
    ].join(' ');

    const cmd = `start msedge ${args}`;
    
    exec(cmd, (err) => {
        if (err) {
            console.error("Failed to launch Edge:", err);
        } else {
            console.log("Edge launched. Waiting for you to finish login...");
        }
    });
}

setup();
