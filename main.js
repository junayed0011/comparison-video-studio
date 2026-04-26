const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

async function main() {
    const rawIdeas = process.argv[2] || "Top 3 fastest planes; Top 3 deadliest snakes; Top 3 richest people";
    const durationPerVideo = parseInt(process.argv[3]) || 15;
    const ffmpegPath = ffmpeg.path;

    const ideas = rawIdeas.split(';').map(i => i.trim()).filter(i => i.length > 0);

    console.log("==========================================");
    console.log(" INSTANT VIDEO BATCH GENERATOR");
    console.log("==========================================");
    console.log(`Total Videos: ${ideas.length}`);
    console.log(`Duration per video: ${durationPerVideo}s`);
    console.log("------------------------------------------");

    // AUTO-LAUNCH EDGE
    console.log("[0/3] Ensuring Edge is running in Debug Mode...");
    const userDataPath = path.join(__dirname, 'user_data');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    try {
        // Check if port 9222 is open
        execSync('netstat -ano | findstr :9222', { stdio: 'ignore' });
        console.log("Edge debug port is already active.");
    } catch (e) {
        console.log("CRITICAL: Closing ALL Edge/Chrome instances to unlock profile...");
        try { execSync('taskkill /F /IM msedge.exe /T', { stdio: 'ignore' }); } catch(err) {}
        try { execSync('taskkill /F /IM chrome.exe /T', { stdio: 'ignore' }); } catch(err) {}
        console.log("Waiting for process release (5s)...");
        execSync('powershell -Command "Start-Sleep -s 5"');
        
        console.log(`Launching Edge with isolated profile at: ${userDataPath}`);
        const launchCmd = `Start-Process 'msedge.exe' -ArgumentList '--remote-debugging-port=9222', '--user-data-dir="${userDataPath}"', '--profile-directory="Default"', '--no-first-run', '--disable-blink-features=AutomationControlled'`;
        
        console.log(`Executing: ${launchCmd}`);
        execSync(`powershell -Command "${launchCmd}"`);
        console.log("Waiting for Edge to initialize (10s)...");
        execSync('powershell -Command "Start-Sleep -s 10"');
    }

    for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        const duration = durationPerVideo;
        
        console.log(`\n>>> GENERATING VIDEO ${i+1}/${ideas.length}: "${idea}"`);
        
        try {
            // Step 1: Generate Data
            execSync(`node scripts/generate_data.js "${idea}" ${duration}`, { stdio: 'inherit' });
            execSync('powershell -Command "Start-Sleep -s 2"');

            // Step 2: Asset Collection (Using Grok for high-quality generation)
            console.log("\n[2/3] MOVING TO GROK ASSET GENERATOR...");
            execSync(`node scripts/generate_images_grok.js`, { stdio: 'inherit' });
            execSync('powershell -Command "Start-Sleep -s 2"');

            // Step 3: Record Video
            console.log("\n[3/3] MOVING TO RECORDING...");
            execSync(`node scripts/fast_preview.js ${duration}`, { stdio: 'inherit' });

            // Step 4: Finalize with Portable FFmpeg
            const previewPath = path.join(__dirname, 'preview.webm');
            const sanitizedName = idea.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const finalPath = path.join(__dirname, `output_${sanitizedName}.mp4`);
            
            console.log(`\n[4/4] CONVERTING TO MP4: ${finalPath}`);
            execSync(`"${ffmpegPath}" -y -i "${previewPath}" -c:v libx264 -pix_fmt yuv420p "${finalPath}"`, { stdio: 'ignore' });

            console.log(`✅ SUCCESS: Video ready at: ${finalPath}`);
        } catch (e) {
            console.error(`❌ Pipeline failed for: ${idea}`);
            console.error(e.message);
        }
    }
    
    console.log("\n==========================================");
    console.log(" BATCH PROCESS COMPLETE");
    console.log("==========================================");
}

main();
