import { useState, useEffect, useCallback } from 'react'

interface PushSubscriptionState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  subscription: PushSubscription | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
    subscription: null
  })

  // Check if push notifications are supported and get current state
  useEffect(() => {
    async function checkSupport() {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          setState(prev => ({
            ...prev,
            isSupported: false,
            isLoading: false,
            error: 'Push notifications are not supported in this browser'
          }))
          return
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('Service Worker registered successfully:', registration)

        // Check if already subscribed
        const subscription = await registration.pushManager.getSubscription()

        setState(prev => ({
          ...prev,
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
          subscription,
          error: null
        }))

      } catch (error) {
        console.error('Error checking push notification support:', error)
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize push notifications'
        }))
      }
    }

    checkSupport()
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }))
      return false
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check for permission
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Notification permission denied'
        }))
        return false
      }

      // Get VAPID public key from API
      const response = await fetch('/api/push-subscription')
      const data = await response.json()

      if (!data.vapidPublicKey) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Push notifications not configured on server'
        }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        throw new Error('Service worker not registered')
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.vapidPublicKey)
      })

      // Send subscription to server
      const subscribeResponse = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      })

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription on server')
      }

      console.log('Push notification subscription successful:', subscription)

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        subscription,
        error: null
      }))

      return true

    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to notifications'
      }))
      return false
    }
  }, [state.isSupported])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) {
      return true
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe()

      // Remove subscription from server
      const response = await fetch('/api/push-subscription', {
        method: 'DELETE'
      })

      if (!response.ok) {
        console.warn('Failed to remove subscription from server, but local unsubscribe succeeded')
      }

      console.log('Push notification unsubscribe successful')

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        subscription: null,
        error: null
      }))

      return true

    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from notifications'
      }))
      return false
    }
  }, [state.subscription])

  return {
    ...state,
    subscribe,
    unsubscribe
  }
}

// Utility function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray.buffer
}