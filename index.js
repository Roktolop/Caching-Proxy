#!/usr/bin/env node
import { startServer } from './server.js';
import { Command } from 'commander';
import { clearCache } from './cache.js';

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
        startServer(port, origin);});

program
    .command('clear-cache')
    .action(() => {
        clearCache();
       console.log('Cache cleared successfully.'); 
    });

program.parse();