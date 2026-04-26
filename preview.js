const { execSync } = require('child_process');

async function preview() {
    const idea = process.argv[2] || "World's fastest planes";
    const duration = process.argv[3] || 15;

    console.log("==========================================");
    console.log(" FAST PREVIEW GENERATOR (Real-Time)");
    console.log("==========================================");

    // AUTO-LAUNCH CHROME
    console.log("[0/3] Ensuring Chrome is running...");
    try {
        execSync('netstat -ano | findstr :9222', { stdio: 'ignore' });
    } catch (e) {
        console.log("Launching Chrome automatically...");
        const launchCmd = `Start-Process "chrome.exe" -ArgumentList "--remote-debugging-port=9222", "--user-data-dir=$env:TEMP\\chrome_automation"`;
        execSync(`powershell -Command "${launchCmd}"`);
        execSync('powershell -Command "Start-Sleep -s 5"');
    }

    try {
        // We still need data and images
        execSync(`node scripts/generate_data.js "${idea}" ${duration}`, { stdio: 'inherit' });
        execSync(`node scripts/scrape_images.js`, { stdio: 'inherit' });

        // But we record instead of rendering frames
        execSync(`node scripts/fast_preview.js`, { stdio: 'inherit' });

    } catch (e) {
        console.error("Preview failed.");
    }
}

preview();
