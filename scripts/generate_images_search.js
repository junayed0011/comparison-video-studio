const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');
const https = require('https');
const axios = require('axios'); // We'll use axios for simple API calls

async function downloadFile(url, dest) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(dest, response.data);
}

// 1. Try Wikimedia API (Bot-friendly, High-res)
async function tryWikimedia(query) {
    try {
        console.log(`   🔎 Checking Wikimedia Commons...`);
        const headers = { 'User-Agent': 'ComparisonVideoMaker/1.0 (contact@example.com)' };
        const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' filetype:bitmap')}&format=json&origin=*`;
        const response = await axios.get(searchUrl, { headers });
        const searchResults = response.data.query.search;
        
        if (searchResults.length > 0) {
            const fileName = searchResults[0].title;
            const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url|size&format=json&origin=*`;
            const infoResponse = await axios.get(infoUrl, { headers });
            const pages = infoResponse.data.query.pages;
            const pageId = Object.keys(pages)[0];
            const info = pages[pageId].imageinfo[0];
            
            if (info && info.url) {
                console.log(`   ✅ Found on Wikimedia: ${fileName}`);
                return info.url;
            }
        }
    } catch (e) {
        console.log(`   ⚠️ Wikimedia check failed: ${e.message}`);
    }
    return null;
}

// 2. Try Bing Images (Less aggressive than DDG/Google)
async function tryBing(page, query) {
    try {
        console.log(`   🔎 Checking Bing Images...`);
        const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' official high res')}&qft=+filterui:imagesize-large&form=IRFLTR&first=1`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        const imageUrls = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('a.iusc'));
            return images.map(a => {
                try {
                    const m = JSON.parse(a.getAttribute('m'));
                    return m.murl;
                } catch (e) { return null; }
            }).filter(u => u && (u.includes('jpg') || u.includes('jpeg') || u.includes('png')));
        });

        if (imageUrls.length > 0) {
            return imageUrls[0];
        }
    } catch (e) {
        console.log(`   ⚠️ Bing check failed: ${e.message}`);
    }
    return null;
}

async function fetchSearchImages() {
    const dataPath = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ data.json not found!");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`--- SMART IMAGE FETCH START ---`);
    console.log(`Searching for ${data.items.length} items...`);

    const userDataDir = path.join(__dirname, '../user_data');
    let browser;
    try {
        browser = await chromium.launchPersistentContext(userDataDir, {
            channel: 'msedge',
            headless: true,
            viewport: { width: 1280, height: 720 },
            args: ['--disable-blink-features=AutomationControlled']
        });

        const imagesDir = path.join(__dirname, '../assets/images');
        console.log(`   📂 Target Directory: ${path.resolve(imagesDir)}`);
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        } else {
            // WIPE ALL OLD IMAGES TO PREVENT MIXING TOPICS
            console.log(`   🧹 Wiping old images...`);
            const files = fs.readdirSync(imagesDir);
            for (const file of files) {
                if (file.startsWith('item_')) fs.unlinkSync(path.join(imagesDir, file));
            }
        }

		for (let i = 0; i < data.items.length; i++) {
			const item = data.items[i];
			const targetPath = path.join(imagesDir, `item_${i}.jpg`);
			
			// USE THE HIGH-DETAIL QUERY IF AVAILABLE
			const searchQuery = item.image_query || `${item.name} ${data.title} official high res`;

			console.log(`[${i + 1}/${data.items.length}] Processing: ${item.name}`);
			console.log(`   🔍 Query: ${searchQuery}`);

			let imageUrl = null;
            
            try {
                imageUrl = await tryWikimedia(searchQuery);
            } catch (e) {
                console.log(`   ⚠️ Wikimedia failed for ${item.name}: ${e.message}`);
            }
			
			if (!imageUrl) {
				try {
					const page = await browser.newPage();
					imageUrl = await tryBing(page, searchQuery);
					
					if (imageUrl) {
						await downloadFile(imageUrl, targetPath);
						
						const stats = fs.statSync(targetPath);
						if (stats.size < 5000) {
							console.log(`   ⚠️ Image too small (${stats.size} bytes), trying deep search...`);
							imageUrl = await tryBing(page, searchQuery + " action photo 4k");
							if (imageUrl) await downloadFile(imageUrl, targetPath);
						}
					} else {
                        console.log(`   ❌ No images found for ${item.name} on Bing.`);
                    }
					await page.close();
				} catch (err) {
					console.error(`   ⚠️ Browser error for ${item.name}, skipping web search:`, err.message);
				}
			} else {
				try {
                    await downloadFile(imageUrl, targetPath);
                } catch (e) {
                    console.log(`   ⚠️ Download failed for ${item.name}: ${e.message}. Trying Bing fallback...`);
                    const page = await browser.newPage();
					imageUrl = await tryBing(page, searchQuery);
					if (imageUrl) await downloadFile(imageUrl, targetPath);
                    await page.close();
                }
			}

            if (fs.existsSync(targetPath)) {
                console.log(`   💾 Saved item_${i}.jpg`);
            } else {
                console.log(`   ❌ FAILED to save item_${i}.jpg`);
            }
        }
    } finally {
        if (browser) await browser.close();
    }
    console.log("--- IMAGE FETCH COMPLETE ---");
    process.exit(0);
}

fetchSearchImages().catch(e => {
    console.error(e);
    process.exit(1);
});
