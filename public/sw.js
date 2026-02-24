// Service Worker for handling push notifications
// This file is served at the root domain level

const CACHE_NAME = 'templetour-v1'

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event')
  event.waitUntil(self.clients.claim())
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received')

  try {
    const data = event.data ? event.data.json() : {}
    console.log('Push notification data:', data)

    const options = {
      body: data.body || data.message || 'New notification',
      icon: data.icon || '/salt lake temple.svg',
      badge: data.badge || '/salt lake temple.svg',
      tag: data.tag || 'notification',
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || Date.now()
      },
      requireInteraction: false,
      silent: false
    }

    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Utah Temple Tour',
        options
      )
    )
  } catch (error) {
    console.error('Error processing push notification:', error)

    // Show fallback notification
    event.waitUntil(
      self.registration.showNotification('Utah Temple Tour', {
        body: 'You have a new notification',
        icon: '/salt lake temple.svg',
        badge: '/salt lake temple.svg'
      })
    )
  }
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click event')

  event.notification.close()

  const notificationData = event.notification.data || {}
  const urlToOpen = notificationData.url || '/'

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to find existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => {
              // Navigate to the notification URL if needed
              if (urlToOpen !== '/' && !client.url.includes(urlToOpen)) {
                return client.navigate(urlToOpen)
              }
            })
          }
        }

        // Open new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error)
      })
  )
})

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Service Worker: Push subscription changed')

  event.waitUntil(
    // Re-subscribe to push notifications
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(self.location.origin)
    })
    .then((newSubscription) => {
      console.log('New push subscription:', newSubscription)
      // Send new subscription to server
      return fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: newSubscription
        })
      })
    })
    .catch((error) => {
      console.error('Error handling subscription change:', error)
    })
  )
})

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/')

  const rawData = self.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}