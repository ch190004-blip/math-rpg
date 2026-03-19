const BUILD_ID = "v10.0.0-beta.0";
const CACHE_NAME = `math-rpg-runtime-${BUILD_ID}`;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith('math-rpg-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request, options = { noStore: false }) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, options.noStore ? { cache: 'no-store' } : undefined);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request) || await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isShell =
    request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/version.json') ||
    url.pathname.endsWith('/service-worker.js') ||
    url.pathname.endsWith('/manifest.webmanifest');

  if (isShell) {
    event.respondWith(networkFirst(request, { noStore: true }));
    return;
  }

  event.respondWith(networkFirst(request));
});
