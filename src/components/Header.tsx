'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

function TempleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 44" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      {/* Central spire */}
      <rect x="18" y="0" width="4" height="8" rx="1" />
      {/* Spire cap */}
      <circle cx="20" cy="1" r="1.5" />
      {/* Upper structure */}
      <rect x="14" y="8" width="12" height="4" rx="1" />
      {/* Side spires */}
      <rect x="8" y="6" width="3" height="6" rx="0.5" />
      <rect x="29" y="6" width="3" height="6" rx="0.5" />
      {/* Main body top */}
      <rect x="6" y="12" width="28" height="3" rx="0.5" />
      {/* Columns */}
      <rect x="8" y="15" width="2" height="16" />
      <rect x="14" y="15" width="2" height="16" />
      <rect x="20" y="15" width="2" height="16" />
      <rect x="24" y="15" width="2" height="16" />
      <rect x="30" y="15" width="2" height="16" />
      {/* Windows between columns */}
      <rect x="10.5" y="18" width="3" height="5" rx="1.5" opacity="0.3" />
      <rect x="16.5" y="18" width="3" height="5" rx="1.5" opacity="0.3" />
      <rect x="26.5" y="18" width="3" height="5" rx="1.5" opacity="0.3" />
      {/* Base */}
      <rect x="4" y="31" width="32" height="3" rx="0.5" />
      {/* Foundation */}
      <rect x="2" y="34" width="36" height="3" rx="0.5" />
      {/* Steps */}
      <rect x="0" y="37" width="40" height="2" rx="0.5" />
      <rect x="1" y="39" width="38" height="2" rx="0.5" />
      <rect x="3" y="41" width="34" height="2" rx="0.5" />
    </svg>
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

const tabs = [
  { label: 'Dashboard', href: '/schedules' },
  { label: 'Temples', href: '/temples' },
  { label: 'Calendar', href: '#' },
  { label: 'Messages', href: '#' },
]

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getActiveTab = () => {
    if (pathname === '/schedules' || pathname === '/') return '/schedules'
    if (pathname.startsWith('/temples')) return '/temples'
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
