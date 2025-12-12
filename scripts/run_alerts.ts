
import { evaluateAllCenters } from '../src/services/alertEngine';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envVars: any = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/"/g, '');
            envVars[key] = value;
            // Also set to process.env for functions that rely on it internally
            process.env[key] = value;
        }
    });
} catch (e) {
    console.warn('Could not read .env.local file, using process.env');
}

async function runAlerts() {
    console.log('🚀 Starting Alert Evaluation Manual Run...');

    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Checking alerts for date: ${today}`);

        await evaluateAllCenters(today);

        console.log('✅ Alert Evaluation Completed!');
    } catch (error) {
        console.error('❌ Error running alerts:', error);
    }
}

runAlerts();
