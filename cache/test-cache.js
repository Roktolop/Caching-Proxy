import { FileCache } from './fileCache.js';

const cache = new FileCache('./test-cache.json');

console.log(await cache.get('a'));

console.log(await cache.set('a', {hello: 'world'}));

console.log(await cache.get('a'));

console.log(await cache.clear());

console.log(await cache.get('a'));