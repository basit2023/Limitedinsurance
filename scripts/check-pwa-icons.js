const fs = require('fs');
const path = require('path');

// Create simple placeholder icons for PWA
// In production, replace these with actual branded icons

const sizes = [192, 512];
const publicDir = path.join(__dirname, '..', 'public');

console.log('📦 Creating placeholder PWA icons...\n');

sizes.forEach(size => {
    const filename = `icon-${size}.png`;
    const filepath = path.join(publicDir, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
        console.log(`✅ ${filename} already exists`);
    } else {
        console.log(`⚠️  ${filename} not found`);
        console.log(`   Please create a ${size}x${size} PNG icon and save it as public/${filename}`);
    }
});

console.log('\n💡 Tip: Use a tool like https://realfavicongenerator.net/ to generate PWA icons');
console.log('   Or create simple colored squares as placeholders for testing\n');
