import express from 'express';
import axios from 'axios';
import {readCache, writeCache} from './cache.js';

export function startServer(port, origin) {
    const app = express();

    app.use(async (req, res) => {
        const cacheKey = `${req.method}:${req.originalUrl}`;
        const cache = readCache();

        if (cache[cacheKey]) {
            console.log('Serving from cahe...');
            const cached = cache[cacheKey];

            for (const [key, value] of Object.entries(cached.headers)) {
                res.set(key, value);
            }
            res.set('X-Cache', 'HIT');
            res.status(cached.status).send(cached.data);

            return;
        }

        const targetUrl = `${origin}${req.originalUrl}`;
        const headers = { ...req.headers };
        delete headers.host; // Remove the host header to avoid conflicts
       
        try {
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: headers,
                validateStatus: () => true,

            });


            const responseData = {
                status: response.status,
                headers: response.headers,
                data: response.data
            };
            writeCache(cacheKey, responseData);
            
            for (const [key, value] of Object.entries(response.headers)) {
                res.set(key, value);
            }
            res.set('X-Cache', 'MISS');
            res.status(response.status).send(response.data);

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Proxy error');
        }
    });

    app.listen(port, () => {
        console.log(`Caching server is running on port ${port} with origin ${origin}`)
    })
}