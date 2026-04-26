const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadImage(url, filepath) {
    if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        fs.writeFileSync(filepath, base64Data, { encoding: 'base64' });
        return filepath;
    }
    
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.google.com/'
            }
        });
        
        // Basic check: is it actually an image?
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image')) {
            console.log(`   ⚠️ Response was not an image: ${contentType}`);
            return null;
        }

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filepath);
            response.data.pipe(writer);
            writer.on('error', (err) => {
                writer.close();
                reject(err);
            });
            writer.on('close', () => resolve(filepath));
        });
    } catch (e) {
        console.log(`   ⚠️ Download error for ${url.substring(0, 30)}: ${e.message}`);
        return null;
    }
}

async function scrapeImages() {
    console.log(`[2/3] SCRAPING IMAGES (High-Res Mode)...`);
    
    const dataPath = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("data.json not found!");
        return;
    }
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    let browser;
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Connecting to Chrome (Attempts left: ${retries})...`);
            browser = await chromium.connectOverCDP('http://localhost:9222');
            break;
        } catch (e) {
            retries--;
            if (retries === 0) {
                console.error("FAILED to connect after 3 attempts.");
                return;
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    const context = browser.contexts()[0];
    const page = await context.newPage();
    
    // Set a realistic viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        console.log(`\n[${i+1}/${data.items.length}] Searching for: ${item.image_query}`);
        
        try {
            const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.image_query)}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle' });
            
            // Wait for any image thumbnail to appear - using multiple possible selectors
            const thumbnailSelectors = ['img[alt]', 'div[data-ri] img', 'a[role="link"] img', 'img'];
            let found = false;
            for (const selector of thumbnailSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 3000 });
                    found = true;
                    break;
                } catch (e) {}
            }

            if (!found) {
                const screenshotPath = path.join(__dirname, `../temp/error_scrape_${i}.png`);
                await page.screenshot({ path: screenshotPath });
                throw new Error(`Could not find any images. Screenshot saved to ${screenshotPath}`);
            }

            // Click the first relevant-looking thumbnail
            // Google Images layout often uses <div> wrappers with data-id
            const thumbnails = await page.$$('div[data-ri="0"], div[data-ri="1"], a[role="link"] img');
            if (thumbnails.length > 0) {
                await thumbnails[0].click();
                await page.waitForTimeout(1500); // Wait for the side panel/overlay to open

                // Find the large image in the preview panel
                // Selectors for Google's large preview (changes often, but these are common)
                const largeImage = await page.evaluate(() => {
                    const selectors = [
                        'img[src^="http"]:not([src*="google.com"]).n3VNCb',
                        'img[src^="http"]:not([src*="google.com"]).i0U6pe',
                        'div[role="dialog"] img[src^="http"]:not([src*="google.com"])',
                        'div[data-attribute-id] img[src^="http"]:not([src*="google.com"])',
                        'img.rg_i', // Last resort: generic class
                        'img[is-selected="true"]'
                    ];
                    
                    for (let s of selectors) {
                        const els = Array.from(document.querySelectorAll(s));
                        for (let el of els) {
                            if (el && el.src && el.src.length > 50 && !el.src.includes('gstatic.com')) {
                                // Prefer larger images
                                if (el.naturalWidth > 200 || el.width > 200) return el.src;
                            }
                        }
                    }

                    // Final fallback: search for anything with a large src string in the side panel
                    const sidePanel = document.querySelector('div[role="dialog"], #islsp');
                    if (sidePanel) {
                        const imgs = Array.from(sidePanel.querySelectorAll('img[src^="http"]'));
                        for (let img of imgs) {
                            if (img.src.length > 100) return img.src;
                        }
                    }
                    return null;
                });

                if (largeImage) {
                    console.log(`   Found large image: ${largeImage.substring(0, 50)}...`);
                    const filepath = path.join(__dirname, `../assets/images/item_${i}.jpg`);
                    const success = await downloadImage(largeImage, filepath);
                    if (success) {
                        console.log(`   ✅ Saved successfully.`);
                    } else {
                        console.log(`   ❌ Download failed.`);
                    }
                } else {
                    console.log(`   ⚠️ Could not find high-res preview. Falling back to thumbnail...`);
                    const thumbUrl = await page.evaluate(() => {
                        const img = document.querySelector('img[alt]');
                        return img ? img.src : null;
                    });
                    if (thumbUrl) {
                        const filepath = path.join(__dirname, `../assets/images/item_${i}.jpg`);
                        await downloadImage(thumbUrl, filepath);
                        console.log(`   ✅ Saved thumbnail.`);
                    }
                }
            }
        } catch (err) {
            console.error(`   ❌ Error scraping ${item.name}: ${err.message}`);
        }
        await page.waitForTimeout(1000);
    }

    await page.close();
    console.log("\nImage scraping complete.");
}

scrapeImages();
