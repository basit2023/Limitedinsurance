import fs from 'fs';
import path from 'path';

// Load env before importing services if possible, or set it before execution
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest) {
        process.env[key.trim()] = rest.join('=').trim();
    }
});

import { checkSingleCenter } from '../src/services/alertEngine';

async function run() {
    console.log('Forcing checkSingleCenter...');
    // Atlanta ID
    const centerId = 'd4a57da4-ec1c-421c-a329-9cf462e55b6f';
    try {
        await checkSingleCenter(centerId);
        console.log('Done.');
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
