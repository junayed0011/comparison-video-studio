const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');

async function dismissPopups(page) {
    const popups = [
        'button:has-text("Skip")',
        'button:has-text("Dismiss")',
        'button:has-text("Got it")',
        '[aria-label="Close"]',
        'button:has-text("Accept all")',
        'div[role="dialog"] button'
    ];
    for (const selector of popups) {
        try {
            const btn = await page.$(selector);
            if (btn && await btn.isVisible()) {
                console.log(`   (Dismissing popup: ${selector})`);
                await btn.click();
                await page.waitForTimeout(1000);
            }
        } catch (e) {}
    }
}

async function generateImages() {
    const dataPath = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ data.json not found!");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`--- GROK IMAGE GENERATION START ---`);
    console.log(`Loaded data.json with ${data.items.length} items.`);

    const userDataDir = path.join(__dirname, '../user_data');
    const browser = await chromium.launchPersistentContext(userDataDir, {
        channel: 'msedge',
        headless: false,
        viewport: null,
        args: [
            '--start-maximized', 
            '--remote-debugging-port=9222',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    const imagesDir = path.join(__dirname, '../assets/images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const targetPath = path.join(imagesDir, `item_${i}.jpg`);
        
        if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);

        const prompt = `Generate a cinematic, high-resolution, ultra-realistic 16:9 3D image of a ${item.name} from ${item.country}. ${item.image_query}. Cinematic lighting, professional photography, no text, no watermarks. Ensure the person/object is ${item.name}.`;
        
        console.log(`[${i + 1}/${data.items.length}] Processing: ${item.name}`);

        const itemPage = await browser.newPage();
        try {
            console.log(`   Navigating to fresh Grok Imagine tab...`);
            await itemPage.goto('https://grok.com/imagine', { waitUntil: 'domcontentloaded', timeout: 60000 });
            await itemPage.waitForTimeout(3000);
            await dismissPopups(itemPage);

            const selectors = ['div[contenteditable="true"]', 'textarea', '.ProseMirror'];
            let input = null;
            for (let s of selectors) {
                try {
                    input = await itemPage.waitForSelector(s, { timeout: 15000 });
                    if (input) break;
                } catch (e) {}
            }

            if (!input) throw new Error("Could not find input field");
            
            await input.click();
            await itemPage.keyboard.type(prompt, { delay: 10 });
            await itemPage.keyboard.press('Enter');

            console.log(`   Waiting for generation...`);
            
            let saved = false;
            let attempts = 0;
            while (!saved && attempts < 60) {
                attempts++;
                await itemPage.waitForTimeout(2000);
                
                const prefSelectors = ['button:text-is("1")', 'button:text-is("Option 1")'];
                let prefClicked = false;
                for (let ps of prefSelectors) {
                    try {
                        const pref = await itemPage.$(`${ps}:visible`);
                        if (pref) {
                            await pref.click();
                            await itemPage.waitForTimeout(35000); 
                            prefClicked = true;
                            break;
                        }
                    } catch (e) {}
                }

                if (!prefClicked) {
                    const firstImg = await itemPage.$('img[src*="resource"], img[src*="blob:"]');
                    if (firstImg) {
                        await firstImg.click();
                        await itemPage.waitForTimeout(5000);
                        prefClicked = true;
                    }
                }

                const element = await itemPage.evaluateHandle(() => {
                    const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
                        const src = img.src || '';
                        return (src.includes('resource') || src.includes('blob:')) && img.naturalWidth > 400;
                    });
                    return imgs.sort((a, b) => b.naturalWidth - a.naturalWidth)[0];
                }).then(h => h.asElement());

                if (element && prefClicked) {
                    const downloadBtn = await itemPage.$('[aria-label*="Download"], .fa-download, button:has-text("Download")');
                    if (downloadBtn && await downloadBtn.isVisible()) {
                        try {
                            const [download] = await Promise.all([
                                itemPage.waitForEvent('download', { timeout: 10000 }),
                                downloadBtn.click()
                            ]);
                            const downloadPath = await download.path();
                            fs.copyFileSync(downloadPath, targetPath);
                            saved = true;
                            console.log(`   💾 Downloaded item_${i}.jpg`);
                            break;
                        } catch (e) {}
                    }

                    await element.scrollIntoViewIfNeeded();
                    await itemPage.waitForTimeout(2000);
                    await element.screenshot({ path: targetPath, type: 'jpeg', quality: 95 });
                    saved = true;
                    console.log(`   💾 Saved item_${i}.jpg via Screenshot`);
                    break;
                }
            }
        } finally {
            await itemPage.close();
        }
    }

    await browser.close();
    console.log("--- GROK GENERATION COMPLETE ---");
    process.exit(0);
}

generateImages().catch(e => {
    console.error(e);
    process.exit(1);
});
