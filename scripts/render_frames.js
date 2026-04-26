const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function renderChunk(startFrame, endFrame, workerId, totalFrames) {
    console.log(`Worker ${workerId} starting: Frames ${startFrame} to ${endFrame}`);
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
        viewport: { width: 1920, height: 1080 }
    });

    const fileUrl = `file://${path.join(__dirname, '../template/index.html')}`;
    await page.goto(fileUrl);
    
    await page.evaluate((tf) => { window.totalFrames = tf; }, totalFrames);

    const framesDir = path.join(__dirname, '../temp/frames');

    for (let i = startFrame; i < endFrame; i++) {
        await page.evaluate((frame) => {
            if (window.setFrame) window.setFrame(frame);
        }, i);

        const framePath = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
        await page.screenshot({ path: framePath });

        if (i % 30 === 0) {
            const progress = Math.round(((i - startFrame) / (endFrame - startFrame)) * 100);
            console.log(`Worker ${workerId}: ${progress}%`);
        }
    }

    await browser.close();
    console.log(`Worker ${workerId} finished.`);
}

async function main() {
    const dataPath = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("data.json not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const duration = 30; // 30 seconds
    const fps = 30;
    const totalFrames = duration * fps;
    const workerCount = 8; // Increased to 8 for double speed

    console.log(`[3/4] Parallel Rendering: ${totalFrames} frames across ${workerCount} workers...`);
    
    const framesDir = path.join(__dirname, '../temp/frames');
    if (!fs.existsSync(framesDir)) {
        fs.mkdirSync(framesDir, { recursive: true });
    }

    const framesPerWorker = Math.ceil(totalFrames / workerCount);
    const workers = [];

    for (let i = 0; i < workerCount; i++) {
        const start = i * framesPerWorker;
        const end = Math.min(start + framesPerWorker, totalFrames);
        if (start < totalFrames) {
            workers.push(renderChunk(start, end, i, totalFrames));
        }
    }

    await Promise.all(workers);
    console.log("All workers finished. Frame rendering complete.");
}

main();
