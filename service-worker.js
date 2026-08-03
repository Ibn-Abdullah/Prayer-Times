const CACHE_NAME = "prayer-times-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./widget.html",
  "./manifest.json",
  "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
  "./adhan.mp3"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("message", event => {
  const data = event.data || {};
  if (data.type === "SHOW_NEXT_PRAYER") {
    event.waitUntil(showNextPrayerNotification(data));
  }
  if (data.type === "SHOW_PRAYER_NOW") {
    event.waitUntil(showPrayerNowNotification(data));
  }
});

function showNextPrayerNotification(data) {
  return self.registration.showNotification(data.title || "الصلاة القادمة", {
    body: data.body || "اضغط لفتح مواقيت الصلاة",
    icon: "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
    badge: "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
    tag: "next-prayer-status",
    renotify: false,
    requireInteraction: true,
    silent: true,
    data: { url: "./" }
  });
}

function showPrayerNowNotification(data) {
  const prayerName = data.prayerName || "الصلاة";
  return self.registration.showNotification(data.title || `حان وقت ${prayerName}`, {
    body: data.body || "اضغط لفتح شاشة الأذان",
    icon: "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
    badge: "./ChatGPT_Image_Aug_1__2026__10_13_05_PM-removebg-preview.png",
    tag: `prayer-now-${prayerName}`,
    renotify: true,
    requireInteraction: true,
    data: { url: `./?alarm=${encodeURIComponent(prayerName)}` },
    actions: [{ action: "open", title: "فتح" }]
  });
}

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "./", self.location.href).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
