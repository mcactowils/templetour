'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import TempleIcon from './TempleIcon'

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

const tabs = [
  { label: 'Dashboard', href: '/schedules' },
  { label: 'Temples', href: '/temples' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Messages', href: '#' },
]

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getActiveTab = () => {
    if (pathname === '/schedules' || pathname === '/') return '/schedules'
    if (pathname.startsWith('/temples')) return '/temples'
    if (pathname.startsWith('/calendar')) return '/calendar'
    return '/schedules'
  }

  const activeTab = getActiveTab()

  return (
    <header className="bg-white border-b border-light-gray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex justify-between items-center h-14">
          <Link href="/schedules" className="flex items-center gap-2.5">
            <TempleIcon className="w-7 h-7 text-temple-tan" />
            <span className="text-sm font-medium text-charcoal tracking-[0.2em] uppercase">
              Utah Temple Tour
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {session?.user && (
              <Link
                href="/schedules/new"
                className="w-8 h-8 flex items-center justify-center text-medium-gray hover:text-charcoal transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
              </Link>
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
