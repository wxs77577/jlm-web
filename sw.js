// Service Worker for notifications
const CACHE_NAME = 'jlm-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 监听定时通知
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(showNotification());
  }
});

async function showNotification() {
  const result = await self.registration.showNotification('每日打卡', {
    body: '今天戒了么?',
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  });
}
