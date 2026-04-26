const fs = require('fs');
const path = require('path');

async function syncAssets() {
    // Dynamic import to avoid ERR_PACKAGE_PATH_NOT_EXPORTED
    const { createClient } = await import('@insforge/sdk');
    
    const insforge = createClient({
      baseUrl: 'https://r5tj4fxt.us-east.insforge.app',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNzAwMTV9.DhYCeJYTYv1w73Zy3E1lr4HCpTx1W4moQBqk32EuICA'
    });

    console.log("--- SYNCING TO INSFORGE CLOUD ---");
    const dataPath = path.join(__dirname, '../data.json');
    if (!fs.existsSync(dataPath)) return;

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const imagesDir = path.join(__dirname, '../assets/images');
    
    for (let i = 0; i < data.items.length; i++) {
        const fileName = `item_${i}.jpg`;
        const filePath = path.join(imagesDir, fileName);
        
        if (fs.existsSync(filePath)) {
            console.log(`   Uploading ${fileName}...`);
            const buffer = fs.readFileSync(filePath);
            const blob = new Blob([buffer], { type: 'image/jpeg' });
            
            const { data: uploadData, error } = await insforge.storage
                .from('video-assets')
                .upload(`previews/${fileName}`, blob);
            
            if (uploadData) {
                console.log(`   ✅ Cloud URL: ${uploadData.url}`);
                data.items[i].imageUrl = uploadData.url;
            } else {
                console.error(`   ❌ Failed: ${error.message}`);
            }
        }
    }

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log("--- CLOUD SYNC COMPLETE ---");
}

syncAssets().catch(console.error);
