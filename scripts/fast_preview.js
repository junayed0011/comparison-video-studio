const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function fastPreview() {
    const duration = parseInt(process.argv[2]) || 30;
    console.log(`[3/3] RECORDING ${duration}s video in real-time...`);
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        recordVideo: {
            dir: path.join(__dirname, '../temp/preview/'),
            size: { width: 1920, height: 1080 }
        },
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    const fileUrl = `file://${path.join(__dirname, '../template/index.html')}`;
    
    // Read data.json and inject it
    const dataPath = path.join(__dirname, '../data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    await page.goto(fileUrl);

    // Inject data and signal engine to start
    await page.evaluate((d) => {
        window.manualData = d;
    }, data);

    // Give it a second to initialize
    await page.waitForTimeout(2000);

    // Start playback in the browser
    await page.evaluate((d) => {
        if (window.playRealTime) window.playRealTime(d);
    }, duration);

    // Progress Console
    for (let i = 0; i <= duration; i++) {
        const percent = Math.round((i / duration) * 100);
        process.stdout.write(`\r[RECORDING] Progress: ${percent}% [${'#'.repeat(Math.floor(percent/5))}${' '.repeat(20-Math.floor(percent/5))}]`);
        await page.waitForTimeout(1000);
    }
    console.log("\n[RECORDING] Finalizing...");

    const videoPath = await page.video().path();
    await context.close();
    await browser.close();

    const finalPath = path.join(__dirname, '../preview.webm');
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.copyFileSync(videoPath, finalPath);

    console.log(`SUCCESS: Video captured to preview.webm`);
}

fastPreview();
