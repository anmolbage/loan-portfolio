const CACHE_NAME = 'loan-portfolio-v2';
const urlsToCache = ['./','./index.html','./styles.css','./app.js','./manifest.json'];
const cdnUrls = ['https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(async cache => {await cache.addAll(urlsToCache);await Promise.allSettled(cdnUrls.map(url => cache.add(url)))}))});
self.addEventListener('fetch', event => {event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))))});
