import express from 'express';
import axios from 'axios';

// port   = where our proxy listens (for example 3000)
// origin = the real server we forward requests to
// cache  = the storage object (it has get, set, clear)
export function startServer(port, origin, cache) {
    const app = express();

    // This function runs for every request that arrives at our proxy
    app.use(async (req, res) => {

        // A name for this request, used to find it in the cache.
        // Example: "GET:/products/1"
        const cacheKey = `${req.method}:${req.originalUrl}`;

        // We only cache GET requests (they just read data)
        const isCacheable = req.method === 'GET';

        // ----- STEP 1: do we already have this answer saved? -----
        if (isCacheable) {
            // Returns the saved response, or null if there is none
            const cached = await cache.get(cacheKey);

            if (cached) {
                console.log('Serving from cache...');

                // Put the saved headers on our response
                for (const [key, value] of Object.entries(cached.headers)) {
                    res.set(key, value);
                }

                // Tell the client this answer came from the cache
                res.set('X-Cache', 'HIT');

                // Send the saved status and body
                res.status(cached.status).send(cached.data);

                // Done. We don't need to ask the real server.
                return;
            }
        }

        // ----- STEP 2: nothing saved, so ask the real server -----

        // Real address = origin + the path the client asked for
        const targetUrl = `${origin}${req.originalUrl}`;

        // Copy the client's headers, but remove "host".
        // It says "localhost:3000", which would confuse the real server.
        const headers = { ...req.headers };
        delete headers.host;

        try {
            const response = await axios({
                method: req.method,
                url: targetUrl,
                headers: headers,
                // Don't throw an error for 404 or 500.
                // Treat them as normal answers and pass them on.
                validateStatus: () => true,
            });

            // Keep what we need to reuse this answer later
            const responseData = {
                status: response.status,
                headers: response.headers,
                data: response.data
            };

            // ----- STEP 3: save the answer for next time -----
            if (isCacheable) {
                await cache.set(cacheKey, responseData);
            }

            // ----- STEP 4: send the answer to the client -----

            // Pass on the real server's headers
            for (const [key, value] of Object.entries(response.headers)) {
                res.set(key, value);
            }

            // Tell the client this answer came from the real server
            res.set('X-Cache', 'MISS');
            res.status(response.status).send(response.data);

        } catch (error) {
            // We get here only if we couldn't reach the real server
            // (wrong address, no internet, server down)
            console.error(error.message);
            res.status(500).send('Proxy error');
        }
    });

    // Start listening for requests
    app.listen(port, () => {
        console.log(`Caching server is running on port ${port} with origin ${origin}`)
    })
}