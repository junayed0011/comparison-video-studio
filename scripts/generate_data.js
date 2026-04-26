const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);
const path = require('path');
const fs = require('fs');

async function generateData(idea, duration, templateSelection, iconType) {
    console.log(`--- DATA GENERATION START ---`);
    console.log(`Topic: ${idea}`);
    console.log(`Template: ${templateSelection}`);
    console.log(`Icon Type: ${iconType}`);
    
    const browser = await chromium.launchPersistentContext(path.join(__dirname, '../user_data'), {
        channel: 'msedge',
        headless: false,
        viewport: null,
        args: [
            '--start-maximized', 
            '--remote-debugging-port=9222',
            '--no-first-run',
            '--no-default-browser-check'
        ]
    });

    const page = browser.pages().length > 0 ? browser.pages()[0] : await browser.newPage();
    
    console.log("Navigating to ChatGPT...");
    let navigated = false;
    for (let i = 0; i < 3; i++) {
        try {
            await page.goto('https://chatgpt.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
            navigated = true;
            break;
        } catch (e) {
            console.log(`   ⚠️ Navigation attempt ${i+1} failed. Retrying in 5s...`);
            await page.waitForTimeout(5000);
        }
    }
    if (!navigated) throw new Error("Failed to reach ChatGPT after 3 attempts.");

    const textareaSelector = 'textarea, div[contenteditable="true"]';
    await page.waitForSelector(textareaSelector, { timeout: 30000 });

    const templateInstruction = templateSelection === 'auto' 
        ? 'Analyze the topic and output a suitable "theme" (e.g. "cyberpunk", "glassmorphism", "minimalist") and a unique hex "color" for each item.'
        : templateSelection === 'custom'
        ? 'Use "custom" for the theme and "#ffffff" for colors as they will be overridden by the system.'
        : `Use the theme "${templateSelection}" and generate a suitable unique hex "color" for each item.`;

    const iconTypeInstruction = iconType === 'logos'
        ? 'IMPORTANT: For each item, provide a "brand_domain" (e.g. "bugatti.com", "ferrari.com") instead of focusing on the country. This will be used to fetch their official logo.'
        : 'For each item, provide a valid "country_code" (ISO 2-letter) for its origin flag.';

    const prompt = `
    Create a structured JSON for a comparison video about: "${idea}"
    JSON format MUST be:
    {
      "title": "Video Title",
      "theme": "theme_name_here",
      "items": [
        {
          "name": "Item Name",
          "country": "Country",
          "country_code": "ISO 2-letter code",
          "brand_domain": "official domain (e.g. brand.com)",
          "role": "Numerical data value ONLY (e.g. '304 MPH', '273 MPH', '2.1s')",
          "description": "Short 1-sentence description",
          "image_query": "specific visual search query",
          "color": "#hexcolor"
        }
      ]
    }
    ${templateInstruction}
    ${iconTypeInstruction}
    Include about ${Math.max(3, Math.floor(duration / 5))} items.
    ONLY return raw JSON. DO NOT include any conversational text, markdown formatting, or explanations. Start directly with { and end with }.
    `;

    console.log("Typing prompt...");
    await page.fill(textareaSelector, prompt);
    await page.waitForTimeout(1000);
    
    // Try clicking send button specifically
    const sendBtn = await page.$('button[data-testid="send-button"], button:has(svg[viewBox*="0 0 24 24"])');
    if (sendBtn) {
        await sendBtn.click();
    } else {
        await page.keyboard.press('Enter');
    }

    console.log("Waiting for AI response...");
    // Flexible wait: either the send button returns, or we find a valid JSON block
    let attemptsFinished = 0;
    while (attemptsFinished < 30) {
        attemptsFinished++;
        const isFinished = await page.evaluate(() => {
            const stopBtn = document.querySelector('button[aria-label="Stop generating"], [data-testid$="stop-button"]');
            const sendBtn = document.querySelector('button[data-testid$="send-button"], button[aria-label="Send prompt"]');
            return !stopBtn && !!sendBtn;
        });

        // Try a quick parse even while waiting
        const hasJson = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.includes('{') && text.includes('}') && text.includes('"items"');
        });

        if (isFinished || (hasJson && attemptsFinished > 5)) {
            console.log("   AI appears to be finished or JSON is ready.");
            break;
        }
        await page.waitForTimeout(2000);
    }
    
    await page.waitForTimeout(1000); // Small final buffer

    let data = null;
    let attempts = 0;
    while (!data && attempts < 25) {
        attempts++;
        console.log(`   Checking for JSON... (Attempt ${attempts}/25)`);
        
        data = await page.evaluate(() => {
            function findJSON(text) {
                if (!text) return null;
                
                // Remove common conversational garbage before and after JSON
                // This regex looks for the outermost { } pair
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');
                
                if (firstBrace === -1 || lastBrace === -1) return null;
                
                let jsonCandidate = text.substring(firstBrace, lastBrace + 1);
                
                // Clean up markdown markers if they leaked into the selection
                jsonCandidate = jsonCandidate.replace(/```json/g, '').replace(/```/g, '').trim();
                
                try {
                    const parsed = JSON.parse(jsonCandidate);
                    if (parsed.items && Array.isArray(parsed.items)) return parsed;
                } catch (e) {
                    // Try to fix common JSON errors (like trailing commas) if needed, 
                    // but for now we'll just log failure and try other blocks
                }
                
                // Fallback: look for multiple { } blocks using regex if the outermost one failed
                const regex = /\{[\s\S]*?\}/g;
                const matches = text.match(regex);
                if (matches) {
                    for (let m of matches) {
                        try {
                            const parsed = JSON.parse(m);
                            if (parsed.items && Array.isArray(parsed.items)) return parsed;
                        } catch (e) {}
                    }
                }
                
                return null;
            }
            
            // Priority 1: Check code blocks (often where JSON is)
            const codeBlocks = Array.from(document.querySelectorAll('pre, code'));
            for (let block of codeBlocks) {
                const found = findJSON(block.innerText);
                if (found) return found;
            }

            // Priority 2: Check the latest message from the assistant
            const messages = Array.from(document.querySelectorAll('div[data-message-author-role="assistant"]'));
            const lastMessage = messages[messages.length - 1];
            if (lastMessage) {
                const found = findJSON(lastMessage.innerText);
                if (found) return found;
            }
            
            // Priority 3: Global body search as a last resort
            return findJSON(document.body.innerText);
        });

        if (data) break;
        await page.waitForTimeout(3000);
    }

    if (data) {
        fs.writeFileSync(path.join(__dirname, '../data.json'), JSON.stringify(data, null, 2));
        console.log("✅ Data saved to data.json");
    } else {
        console.error("❌ Failed to extract JSON. Taking error screenshot...");
        await page.screenshot({ path: path.join(__dirname, '../error_screenshot.png') });
        console.log("📸 Screenshot saved to error_screenshot.png");
    }
    
    await browser.close();
    process.exit(data ? 0 : 1);
}

const idea = process.argv[2] || "Fastest Cars";
const duration = process.argv[3] || 15;
const templateSelection = process.argv[4] || 'auto';
const iconType = process.argv[5] || 'flags';
generateData(idea, duration, templateSelection, iconType).catch(e => {
    console.error(e);
    process.exit(1);
});
