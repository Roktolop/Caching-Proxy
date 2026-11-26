#!/usr/bin/env node
import { startServer } from './server.js';
import { Command } from 'commander';
import { FileCache } from './cache/fileCache.js';

const program = new Command();

program
    .name('caching-proxy')
    .description('A caching proxy server for HTTP requests.');

program
    .command('start')
    .requiredOption('-p, --port <number>', 'Server port number')
    .requiredOption('--origin <url>', 'Origin server URL')
    .action((options) => {
        const { port, origin } = options;
        const cache = new FileCache('./cache.json'); // Create an instance of FileCache
        startServer(port, origin, cache);});

program
    .command('clear-cache')
    .action(async () => {
        const cache = new FileCache('./cache.json');
        await cache.clear();
        console.log('Cache cleared successfully.');
    });

await program.parseAsync();