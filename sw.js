const CACHE_NAME = 'workout-log-pwa-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== 'workout-share-cache') {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Web Share Target POST Handler
  if (event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const imageFile = formData.get('image');
          const title = formData.get('title') || '';
          const text = formData.get('text') || '';
          const sharedUrl = formData.get('url') || '';

          const cache = await caches.open('workout-share-cache');

          // 画像の処理
          if (imageFile && imageFile.size > 0) {
            const response = new Response(imageFile, {
              headers: { 'Content-Type': imageFile.type || 'image/png' }
            });
            await cache.put('shared-image', response);
          }

          // テキストの処理
          if (text || title || sharedUrl) {
            const textContent = [title, text, sharedUrl].filter(Boolean).join('\n');
            const response = new Response(textContent, {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
            await cache.put('shared-text', response);
          }
        } catch (err) {
          console.warn('Share target handling error:', err);
        }

        // 303 Redirect to index.html with 200 OK safety
        return Response.redirect('./index.html?shared=1', 303);
      })()
    );
    return;
  }

  // 静的ファイル処理（ネットワーク ➔ キャッシュフォールバック）
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
