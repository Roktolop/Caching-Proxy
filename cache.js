import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, 'cache.json');

export function readCache() {
    const exists = fs.existsSync(CACHE_FILE);

    if(exists) {
        console.log('Cache file exists. Reading cache...');

        const cacheData = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(cacheData);
    }
    else {
        console.log('Cache file does not exist. Creating cache file...');
        fs.writeFileSync(CACHE_FILE, JSON.stringify({}));
        
        return {};
    }
}

export function writeCache(key, value) { 
    const cache = readCache();

    cache[key] = value;

   fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

export function clearCache() {
    if(fs.existsSync(CACHE_FILE)) {
        console.log('Clearing cache...');
        fs.unlinkSync(CACHE_FILE);
    }
    else {
        console.log('Cache file does not exist.');
    }
}