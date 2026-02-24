import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// This would typically be stored in environment variables
// For demo purposes, you'll need to generate VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'demo-key'

export function usePushNotifications() {
  const { data: session } = useSession()
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscriptionStatus()
    }
  }, [session])

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        const sub = await registration.pushManager.getSubscription()
        setSubscription(sub)
        setIsSubscribed(!!sub)
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
  }

  const subscribeToPushNotifications = async () => {
    if (!isSupported || !session?.user) return

    setIsLoading(true)
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      // Send subscription to server
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setSubscription(sub)
      setIsSubscribed(true)
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      alert('Failed to enable push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription) return

    setIsLoading(true)
    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe()

      // Remove subscription from server
      await fetch('/api/push-subscription', { method: 'DELETE' })

      setSubscription(null)
      setIsSubscribed(false)
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      alert('Failed to disable push notifications. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}