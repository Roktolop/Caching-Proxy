import express from 'express';
import axios from 'axios';
import { readCache, writeCache } from './cache.js';

export function startServer(port, origin) {
    // Create the Express app (our proxy server)
    const app = express();

    // app.use(...) without a path runs for EVERY incoming request,
    // whatever the URL or method is. This is the whole proxy.
    app.use(async (req, res) => {

        // Unique name for this request in the cache, e.g. "GET:/products/1?limit=5".
        // It includes method + path + query, so different URLs never share an entry.
        const cacheKey = `${req.method}:${req.originalUrl}`;

        // Only GET requests are cached. POST/PUT/DELETE change data,
        // so their responses must never be reused.
        const isCacheable = req.method === 'GET';

        // ---------- STEP 1: look in the cache ----------
        if (isCacheable) {
            // Read the whole cache file into an object { key: response, ... }
            const cache = readCache();

            // If this key exists, we already have an answer saved
            if (cache[cacheKey]) {
                console.log('Serving from cahe...');
                const cached = cache[cacheKey];

                // Copy the saved headers (content-type etc.) onto our response
                for (const [key, value] of Object.entries(cached.headers)) {
                    res.set(key, value);
                }

                // Custom header so we can see the answer came from the cache
                res.set('X-Cache', 'HIT');

                // Send the saved status code and body to the client
                res.status(cached.status).send(cached.data);

                // Stop here: no request to the origin is needed
                return;
            }
        }

        // ---------- STEP 2: cache MISS, ask the real server ----------

        // Build the real URL: origin + the same path/query the client asked for
        // e.g. "https://dummyjson.com" + "/products/1"
        const targetUrl = `${origin}${req.originalUrl}`;

        // Copy the client's headers so the origin gets them too
        const headers = { ...req.headers };
        // Remove "host": it contains "localhost:3000", which would confuse the origin
        delete headers.host;

        try {
            // Send the request to the origin server using axios
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: headers,
                // Never throw on 404/500 etc.: treat every status as a normal
                // response, so we can pass it to the client unchanged
                validateStatus: () => true,
            });

            // Keep only the parts we need to replay this response later
            const responseData = {
                status: response.status,
                headers: response.headers,
                data: response.data
            };

            // ---------- STEP 3: save it for next time ----------
            if (isCacheable) {
                writeCache(cacheKey, responseData);
            }

            // ---------- STEP 4: send the answer to the client ----------

            // Copy the origin's headers to our response
            for (const [key, value] of Object.entries(response.headers)) {
                res.set(key, value);
            }

            // Mark it as a MISS: this one came from the origin
            res.set('X-Cache', 'MISS');
            res.status(response.status).send(response.data);

        } catch (error) {
            // Only reached if the origin couldn't be contacted at all
            // (wrong URL, no internet, server down)
            console.error(error.message);
            res.status(500).send('Proxy error');
        }
    });

    // Start listening for requests on the chosen port
    app.listen(port, () => {
        console.log(`Caching server is running on port ${port} with origin ${origin}`)
    })
}