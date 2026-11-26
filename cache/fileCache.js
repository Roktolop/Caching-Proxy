import fs from 'fs/promises';

export class FileCache {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async get(key) {
        const cacheData = await this._readAllCache();

        if (cacheData.hasOwnProperty(key)) {
            return cacheData[key];
        } else {
            return null;
        }
    }

    async set(key, value) {
        const cacheData = await this._readAllCache();
        cacheData[key] = value;

        await fs.writeFile(this.filePath, JSON.stringify(cacheData, null, 2));
    }

    async _readAllCache() {
        try{
            const cacheData = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(cacheData);

        } catch (error) {
            if (error.code === 'ENOENT') {
                return {};
            } else {
                throw error;
            }
        }
    }

    async clear() {
        await fs.rm(this.filePath, { force: true });

        console.log(`Cache has been cleared.`);

    }

}
