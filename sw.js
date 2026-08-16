const CACHE_NAME = 'workout-log-pwa-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // PWA Web Share Target POST Handling
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

        // Must use absolute URL for Response.redirect to prevent 405 Method Not Allowed
        const redirectUrl = new URL('./index.html?shared=1', event.request.url).toString();
        return Response.redirect(redirectUrl, 303);
      })()
    );
    return;
  }

  // Regular static asset fetching
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
