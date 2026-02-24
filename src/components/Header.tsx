'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

function TempleIcon({ className }: { className?: string }) {
  return (
    <img
      src="/salt lake temple.svg"
      alt="Salt Lake Temple"
      className={className}
    />
  )
}
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

const tabs = [
  { label: 'Dashboard', href: '/schedules' },
  { label: 'Temples', href: '/temples' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Messages', href: '/messages' },
]

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Fetch notifications on mount and when user is available
  useEffect(() => {
    if (session?.user) {
      // Temporarily disabled to debug page loading issues
      // fetchNotifications()
      // Poll for new notifications every 30 seconds
      // const interval = setInterval(fetchNotifications, 30000)
      // return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    if (!session?.user) return

    try {
      setLoadingNotifications(true)
      const response = await fetch('/api/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
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
        setUnreadCount(prev => Math.max(0, prev - 1))
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
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  const getActiveTab = () => {
    if (pathname === '/schedules' || pathname === '/') return '/schedules'
    if (pathname.startsWith('/temples')) return '/temples'
    if (pathname.startsWith('/calendar')) return '/calendar'
    if (pathname.startsWith('/messages')) return '/messages'
    return '/schedules'
  }

  const activeTab = getActiveTab()

  return (
    <header className="bg-white border-b border-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex justify-between items-center h-14">
          <Link href="/schedules" className="flex items-center gap-3">
            <TempleIcon className="w-10 h-10 text-temple-tan" />
            <span className="text-sm font-medium text-charcoal tracking-[0.2em] uppercase">
              Utah Temple Tour
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {session?.user && (
              <>
                <Link
                  href="/schedules/new"
                  className="w-8 h-8 flex items-center justify-center text-medium-gray hover:text-charcoal transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-8 h-8 flex items-center justify-center text-medium-gray hover:text-charcoal transition-colors relative"
                  >
                    <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-warm-coral text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-light-gray z-50 max-h-96 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-light-gray flex items-center justify-between">
                          <h3 className="font-semibold text-charcoal text-sm">
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-warm-coral hover:text-warm-coral-hover font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-80 overflow-y-auto">
                          {loadingNotifications ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-warm-coral mx-auto"></div>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-medium-gray text-sm">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b border-light-gray hover:bg-warm-gray-light cursor-pointer ${
                                  !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => {
                                  if (!notification.isRead) {
                                    markNotificationAsRead(notification.id)
                                  }
                                  if (notification.actionUrl) {
                                    window.location.href = notification.actionUrl
                                  }
                                  setIsNotificationsOpen(false)
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-charcoal text-sm truncate">
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-medium-gray mt-1 line-clamp-2">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-medium-gray mt-2">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-warm-coral rounded-full flex-shrink-0 mt-1 ml-2" />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="p-3 border-t border-light-gray text-center">
                            <Link
                              href="/notifications"
                              className="text-xs text-warm-coral hover:text-warm-coral-hover font-medium"
                              onClick={() => setIsNotificationsOpen(false)}
                            >
                              View all notifications
                            </Link>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {status === 'loading' ? (
              <div className="w-7 h-7 bg-light-gray rounded-full animate-pulse" />
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-8 h-8 flex items-center justify-center text-medium-gray hover:text-charcoal transition-colors"
                >
                  <UserIcon className="w-5 h-5" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-light-gray py-2 z-50">
                      <div className="px-4 py-2 border-b border-light-gray">
                        <p className="text-sm font-medium text-charcoal truncate">
                          {session.user.name || session.user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-charcoal hover:bg-warm-gray-light"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-charcoal hover:bg-warm-gray-light"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        className="block w-full text-left px-4 py-2 text-sm text-charcoal hover:bg-warm-gray-light"
                      >
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-warm-coral text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-warm-coral-hover transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        {session?.user && (
          <nav className="flex gap-1 pb-2 -mx-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center py-1.5 px-3 text-xs font-medium rounded-full transition-colors ${
                  activeTab === tab.href
                    ? 'bg-charcoal-dark text-white'
                    : 'text-medium-gray hover:text-charcoal'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
