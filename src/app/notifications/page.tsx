'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePushNotifications } from '../../hooks/usePushNotifications'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  } = usePushNotifications()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/notifications')
      return
    }
    fetchNotifications()
  }, [session, status, router, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = `/api/notifications?limit=100${filter === 'unread' ? '&unreadOnly=true' : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
          <p className="mt-4 text-medium-gray">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-charcoal">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-warm-coral hover:text-warm-coral-hover font-medium"
            >
              Mark all read ({unreadCount})
            </button>
          )}
        </div>

        {/* Push Notification Settings */}
        {pushSupported && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-charcoal text-sm">
                  Browser Notifications
                </h3>
                <p className="text-xs text-medium-gray mt-1">
                  Get notified instantly when someone comments on your appointments
                </p>
              </div>
              <button
                onClick={pushSubscribed ? unsubscribeFromPushNotifications : subscribeToPushNotifications}
                disabled={pushLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pushSubscribed
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-warm-coral text-white hover:bg-warm-coral-hover'
                } disabled:opacity-50`}
              >
                {pushLoading ? 'Loading...' : pushSubscribed ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-4 border-b border-light-gray">
          <button
            onClick={() => setFilter('all')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              filter === 'all'
                ? 'border-warm-coral text-warm-coral'
                : 'border-transparent text-medium-gray hover:text-charcoal'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              filter === 'unread'
                ? 'border-warm-coral text-warm-coral'
                : 'border-transparent text-medium-gray hover:text-charcoal'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-12 text-center">
          <p className="text-medium-gray">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-light-gray p-6 ${
                !notification.isRead ? 'border-l-4 border-l-warm-coral' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-charcoal text-sm">
                      {notification.title}
                    </h3>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-warm-coral rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-medium-gray mb-3">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-medium-gray">
                      {formatDate(notification.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl}
                          className="text-xs text-warm-coral hover:text-warm-coral-hover font-medium"
                          onClick={() => !notification.isRead && markAsRead(notification.id)}
                        >
                          View
                        </Link>
                      )}
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-medium-gray hover:text-charcoal font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}