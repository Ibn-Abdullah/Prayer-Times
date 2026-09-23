const CACHE_NAME = "prayer-times-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
  "./adhan.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    if ("getNotifications" in self.registration) {
      const notifications = await self.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      }
      return response;
    }))
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for(const client of clientList){
        if("focus" in client) return client.focus();
      }
      return clients.openWindow("./");
    })
  );
});
