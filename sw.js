const CACHE_NAME = 'workout-log-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// サービスワーカーインストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// サービスワーカーアクティベート処理
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== 'shared-data') {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエストハンドリング（PWA Web Share Target POST対応）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 筋トレMEMO共有からのPOSTリクエストを静的サーバーエラー（405）にさせずキャッチ
  if (event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const file = formData.get('image') || formData.get('file');
          if (file) {
            const cache = await caches.open('shared-data');
            await cache.put('shared-image', new Response(file));
          }
        } catch (err) {
          console.error('Error handling PWA share POST:', err);
        }
        // index.htmlへリダイレクトして、フロントエンドのReactで解析をキックさせる
        return Response.redirect('./index.html?shared=1', 303);
      })()
    );
    return;
  }

  // 通常のGETリクエスト（キャッシュファースト）
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
