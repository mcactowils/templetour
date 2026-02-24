// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const options = event.data.json();

    const notificationOptions = {
      body: options.body || options.message,
      icon: options.icon || '/salt lake temple.svg',
      badge: options.badge || '/salt lake temple.svg',
      tag: 'utah-temple-tour',
      timestamp: options.timestamp,
      requireInteraction: false,
      actions: options.url ? [
        {
          action: 'view',
          title: 'View'
        }
      ] : [],
      data: {
        url: options.url
      }
    };

    event.waitUntil(
      self.registration.showNotification(
        options.title || 'Utah Temple Tour',
        notificationOptions
      )
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';

    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(function(clientList) {
        // Try to find an existing tab with the app
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(url);
            return;
          }
        }

        // If no existing tab, open a new one
        clients.openWindow(url);
      })
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  // Optional: Track notification close events
  console.log('Notification closed:', event.notification.tag);
});