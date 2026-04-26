const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function exportVideo() {
    console.log(`[4/4] Stitching video with FFmpeg...`);
    
    const framesDir = path.join(__dirname, '../temp/frames');
    const outputPath = path.join(__dirname, '../output.mp4');

    if (!fs.existsSync(framesDir)) {
        console.error("Frames directory not found!");
        return;
    }

    try {
        // -y to overwrite
        // -framerate 30
        // -i frames/frame_%04d.png
        // -c:v libx264 -pix_fmt yuv420p
        const ffmpegCmd = `ffmpeg -y -framerate 30 -i "${path.join(framesDir, 'frame_%04d.png')}" -c:v libx264 -pix_fmt yuv420p "${outputPath}"`;
        
        console.log(`Executing: ${ffmpegCmd}`);
        execSync(ffmpegCmd, { stdio: 'inherit' });
        
        console.log(`Video successfully exported to: ${outputPath}`);
    } catch (e) {
        console.error("FFmpeg execution failed. Is FFmpeg installed and in your PATH?");
        console.error(e.message);
    }
}

exportVideo();
