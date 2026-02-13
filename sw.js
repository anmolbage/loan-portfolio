const CACHE_NAME = 'loan-portfolio-v1';
const urlsToCache = ['./','./index.html','./styles.css','./app.js','./manifest.json','https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)))});
self.addEventListener('fetch', event => {event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)))});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(cacheNames => Promise.all(cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))))});
