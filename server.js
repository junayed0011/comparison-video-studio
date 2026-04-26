const express = require('express');
const cors = require('cors');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// --- AUTO-UPDATE SYSTEM ---
function checkForUpdates() {
    console.log('🔄 Checking for cloud updates...');
    exec('git pull origin main', (err, stdout, stderr) => {
        if (err) {
            console.log('⚠️ Auto-update skipped (not a git repo or offline)');
        } else if (stdout.includes('Already up to date')) {
            console.log('✅ System is already up to date.');
        } else {
            console.log('🚀 UPDATED: New changes downloaded from cloud!');
            console.log(stdout);
        }
    });
}
checkForUpdates();

app.use(cors());
app.use(express.json());

// Store connected clients for SSE
let clients = [];

// Helper to broadcast logs to the dashboard
function broadcastLog(message) {
    const logPrefix = `[${new Date().toLocaleTimeString()}]`;
    console.log(`${logPrefix} ${message}`);
    
    // Filter out clients that might have disconnected but didn't trigger 'close'
    clients = clients.filter(client => {
        try {
            client.res.write(`data: ${JSON.stringify({ message })}\n\n`);
            return true;
        } catch (e) {
            console.log(`Removing disconnected client: ${client.id}`);
            return false;
        }
    });
}

// SSE Endpoint for live logs
app.get('/api/logs', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    const clientId = Date.now();
    clients.push({ id: clientId, res });
    
    // Send immediate confirmation
    res.write(`data: ${JSON.stringify({ message: "🟢 Connected to Automation Server" })}\n\n`);

    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
        } catch (e) {
            // Heartbeat failed, let the close event handle cleanup or let filter catch it
        }
    }, 15000);
    
    req.on('close', () => {
        clearInterval(heartbeat);
        clients = clients.filter(c => c.id !== clientId);
        console.log(`Client disconnected: ${clientId}. Total clients: ${clients.length}`);
    });
});

// Endpoint to fetch current data.json with enhancements
app.get('/api/data', (req, res) => {
    const dataPath = path.join(__dirname, 'data.json');
    if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ error: 'No data found' });
    }

    try {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        
        const getCountryCode = (item) => {
            if (item.country_code && item.country_code.length === 2) return item.country_code.toLowerCase();
            const country = (item.country || item.origin || '').toLowerCase();
            if (country.includes('usa') || country.includes('america')) return 'us';
            if (country.includes('uk') || country.includes('england')) return 'gb';
            if (country.includes('africa')) return 'za';
            if (country.includes('germany')) return 'de';
            if (country.includes('france')) return 'fr';
            if (country.includes('japan')) return 'jp';
            if (country.includes('italy')) return 'it';
            if (country.includes('brazil')) return 'br';
            if (country.includes('india')) return 'in';
            return 'un';
        };

        const enhancedData = {
            ...data,
            items: data.items.map((item, index) => {
                const code = getCountryCode(item);
                return {
                    ...item,
                    id: String(index),
                    itemName: item.name,
                    imageUrl: item.imageUrl || `http://localhost:3001/assets/images/item_${index}.jpg?t=${Date.now()}`,
                    color: ['#e74c3c', '#27ae60', '#2980b9', '#8e44ad', '#f39c12'][index % 5],
                    flagUrl: `https://flagcdn.com/w320/${code}.png`
                };
            })
        };
        res.json(enhancedData);
    } catch (e) {
        res.status(500).json({ error: 'Failed to parse data' });
    }
});

app.post('/api/generate', (req, res) => {
    const { idea, duration, templateSelection, iconType } = req.body;
    
    if (!idea) {
        return res.status(400).json({ error: 'Idea is required' });
    }

    // Return immediately to prevent browser timeout
    res.json({ status: 'started', message: 'Automation pipeline initialized' });

    // Run the rest in the background
    (async () => {
        try {
            const durationSeconds = Number(duration || 1) * 60;
            broadcastLog(`--- STARTING AUTOMATION PIPELINE ---`);
            broadcastLog(`Topic: "${idea}"`);
            broadcastLog(`Duration: ${durationSeconds}s (${duration} min)`);
            broadcastLog(`Template: ${templateSelection || 'auto'}`);
            broadcastLog(`Icon Type: ${iconType || 'flags'}`);

            // 1. Preparation
            broadcastLog("   Initializing Automation Pipeline...");

            // 2. Run Scripts
            // Wait a moment for system to stabilize
            await new Promise(r => setTimeout(r, 2000));

            const runScript = (command, args) => {
                return new Promise((resolve, reject) => {
                    const child = spawn('node', [command, ...args], {
                        env: { ...process.env, PYTHONUNBUFFERED: '1', NODE_OPTIONS: '--no-warnings' }
                    });
                    
                    child.stdout.on('data', (data) => {
                        data.toString().split('\n').forEach(line => {
                            if (line.trim()) broadcastLog(line.trim());
                        });
                    });

                    child.stderr.on('data', (data) => {
                        data.toString().split('\n').forEach(line => {
                            if (line.trim()) broadcastLog(`⚠️ ${line.trim()}`);
                        });
                    });

                    child.on('close', (code) => {
                        if (code === 0) resolve();
                        else reject(new Error(`Script exited with code ${code}`));
                    });
                });
            };

            broadcastLog('   Step 1/3: Extracting data from ChatGPT...');
            const aiTemplateParam = typeof templateSelection === 'object' ? 'custom' : (templateSelection || 'auto');
            await runScript('scripts/generate_data.js', [idea, durationSeconds, aiTemplateParam, iconType || 'flags']);
            
            // Ensure assets/images directory exists
            const imagesDir = path.join(__dirname, 'assets/images');
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }

            broadcastLog('   Step 2/3: Fetching high-res press photos (Authority Search)...');
            // await runScript('scripts/generate_images_grok.js', []); // Backup: Original AI generation
            await runScript('scripts/generate_images_search.js', []);

            broadcastLog('   Step 3/3: Syncing to InsForge Cloud...');
            await runScript('scripts/sync_to_insforge.js', []);

            broadcastLog('✅ Pipeline Complete.');
            
            const dataPath = path.join(__dirname, 'data.json');
            if (fs.existsSync(dataPath)) {
                const rawData = fs.readFileSync(dataPath, 'utf8');
                const data = JSON.parse(rawData);
                
                const getCountryCode = (item) => {
                    if (item.country_code && item.country_code.length === 2) return item.country_code.toLowerCase();
                    const country = (item.country || item.origin || '').toLowerCase();
                    if (country.includes('usa') || country.includes('america')) return 'us';
                    if (country.includes('uk') || country.includes('england')) return 'gb';
                    if (country.includes('africa')) return 'za';
                    if (country.includes('germany')) return 'de';
                    if (country.includes('france')) return 'fr';
                    if (country.includes('japan')) return 'jp';
                    if (country.includes('italy')) return 'it';
                    if (country.includes('brazil')) return 'br';
                    if (country.includes('india')) return 'in';
                    if (country.includes('ocean')) return 'un';
                    return 'un';
                };
                const colors = ['#e74c3c', '#27ae60', '#2980b9', '#8e44ad', '#f39c12'];

                const enhancedData = {
                    ...data,
                    theme: typeof templateSelection === 'object' ? templateSelection : data.theme,
                    items: data.items.map((item, index) => {
                        const code = (item.country_code || 'us').toLowerCase();
                        const { name, country, country_code, image_query, ...rest } = item;
                        return {
                            id: `item_${index}`,
                            country: item.country,
                            itemName: item.name,
                            color: colors[index % colors.length],
                            imageUrl: item.imageUrl || `http://localhost:${port}/assets/images/item_${index}.jpg?t=${Date.now()}`,
                            flagUrl: iconType === 'logos' ? `https://logo.clearbit.com/${item.brand_domain || 'google.com'}` : `https://flagcdn.com/w320/${code}.png`,
                            value: item.role,
                            extraData: rest
                        };
                    })
                };
                broadcastLog(`JSON_RESULT:${JSON.stringify(enhancedData)}`);
            } else {
                broadcastLog(`   ❌ Error: data.json not found.`);
            }
        } catch (err) {
            broadcastLog(`   ❌ Pipeline Error: ${err.message}`);
        }
    })();
});

const { createClient } = require('@insforge/sdk/dist/index.cjs'); // Direct path for Node 24 stability

// Initialize InsForge Client
const insforge = createClient({
    baseUrl: process.env.VITE_INSFORGE_BASE_URL || 'https://r5tj4fxt.us-east.insforge.app',
    anonKey: process.env.VITE_INSFORGE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxOTk3NDh9.QazFG5lSUr2iVBQo3bHJUwldxo1IZaXlGInsuc2XZUM'
});

app.post('/api/setup', (req, res) => {
    broadcastLog('🚀 Launching Browser for Login Setup...');
    exec('npm run setup-login', (err) => {
        if (err) {
            broadcastLog(`❌ Setup failed: ${err.message}`);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
    });
});

app.post('/api/render', (req, res) => {
    const videoData = req.body;
    const dataPath = path.join(__dirname, 'data.json');
    
    // 1. Sync the current dashboard state to data.json
    fs.writeFileSync(dataPath, JSON.stringify(videoData, null, 2));

    // Ensure output directory exists
    const outDir = path.join(__dirname, 'out');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    
    // 2. Start rendering
    res.json({ success: true, message: 'Render process initiated' });

    (async () => {
        try {
            broadcastLog(`--- STARTING VIDEO RENDER ---`);
            broadcastLog(`Output: out/video.mp4`);

            const renderProcess = spawn('npx', ['remotion', 'render', 'ComparisonRace', 'out/video.mp4', '--props', './data.json', '--overwrite'], {
                shell: true,
                env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
            });

            renderProcess.stdout.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        broadcastLog(line.trim());
                    }
                });
            });

            renderProcess.stderr.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.trim()) {
                        broadcastLog(`[REMOTION] ${line.trim()}`);
                    }
                });
            });

            renderProcess.on('close', async (code) => {
                if (code === 0) {
                    broadcastLog(`✅ RENDER COMPLETE! File saved at out/video.mp4`);
                    
                    try {
                        broadcastLog(`☁️ Uploading to InsForge Cloud...`);
                        const videoFile = fs.readFileSync(path.join(__dirname, 'out/video.mp4'));
                        const { data: uploadData, error } = await insforge.storage
                            .from('videos')
                            .uploadAuto(new Blob([videoFile], { type: 'video/mp4' }), {
                                filename: `video_${Date.now()}.mp4`
                            });

                        if (error) throw error;
                        
                        broadcastLog(`✅ CLOUD UPLOAD SUCCESS!`);
                        broadcastLog(`VIDEO_URL:${uploadData.url}`);
                    } catch (uploadErr) {
                        broadcastLog(`⚠️ Cloud Upload Failed: ${uploadErr.message}`);
                        broadcastLog(`   Local file is still available at out/video.mp4`);
                    }
                } else {
                    broadcastLog(`❌ RENDER FAILED with code ${code}`);
                }
            });
        } catch (err) {
            broadcastLog(`❌ Render Error: ${err.message}`);
        }
    })();
});

app.use('/assets', cors(), express.static(path.join(__dirname, 'assets'), {
    setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
    }
}));

const server = app.listen(port, () => {
    console.log(`Automation server running at http://localhost:${port}`);
});

// Ensure process stays alive
setInterval(() => {}, 1000 * 60 * 60);

process.on('uncaughtException', (err) => {
    console.error('SERVER CRASH PREVENTED:', err);
});

server.timeout = 3600000;
