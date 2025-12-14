const webpush = require('web-push');

console.log('🔑 Generating VAPID Keys for Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID Keys Generated Successfully!\n');
console.log('Copy these to your .env.local (for development) and .env.production (for production):\n');
console.log('─────────────────────────────────────────────────────────────');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
console.log('─────────────────────────────────────────────────────────────\n');

console.log('⚠️  IMPORTANT:');
console.log('1. Generate SEPARATE keys for development and production');
console.log('2. Keep the PRIVATE key secret - never commit to git');
console.log('3. The PUBLIC key can be shared with the client');
console.log('4. Update VAPID_SUBJECT with your actual email or website URL\n');
