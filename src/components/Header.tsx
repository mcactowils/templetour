'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🏛️</div>
              <span className="text-xl font-bold text-gray-900">Temple Tours</span>
            </Link>
          </div>

          {session?.user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Tours
              </Link>
              <Link
                href="/temples"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Temples
              </Link>
              <Link
                href="/admin"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Admin
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                    {session.user.name?.[0] || session.user.email?.[0] || '?'}
                  </div>
                  <span className="hidden sm:block">{session.user.name || session.user.email}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {session.user.email}
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && session?.user && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Tours
            </Link>
            <Link
              href="/temples"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Temples
            </Link>
            <Link
              href="/admin"
              className="block px-3 py-2 text-gray-700 hover:bg-gray-50 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Admin
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}