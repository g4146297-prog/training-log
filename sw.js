const CACHE_NAME = 'workout-log-pwa-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const imageFile = formData.get('image');

          if (imageFile) {
            const cache = await caches.open('workout-share-cache');
            const response = new Response(imageFile, {
              headers: { 'Content-Type': imageFile.type || 'image/png' }
            });
            await cache.put('shared-image', response);
          }
        } catch (err) {
          console.warn('Share target handling error:', err);
        }

        return Response.redirect('./index.html?shared=1', 303);
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
