'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [useCredentials, setUseCredentials] = useState(true)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already signed in
    getSession().then(session => {
      if (session) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (useCredentials) {
        const result = await signIn('credentials', {
          email,
          password,
          name: name || email.split('@')[0],
          isSignUp: isSignUp.toString(),
          redirect: false,
        })

        if (result?.ok) {
          router.push('/')
        } else if (result?.error === 'CredentialsSignin') {
          setMessage('Invalid email or password. Please try again.')
        } else {
          setMessage('Something went wrong. Please try again.')
        }
      } else {
        const result = await signIn('email', {
          email,
          redirect: false,
        })

        if (result?.ok) {
          setMessage('Check your email for a magic link to sign in!')
        } else {
          setMessage('Something went wrong. Please try again.')
        }
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-4">
            <img
              src="/salt lake temple.svg"
              alt="Salt Lake Temple"
              className="w-16 h-16 text-temple-tan"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-charcoal">
            {isSignUp ? 'Create Account' : 'Sign in to Temple Tours'}
          </h2>
          <p className="mt-2 text-center text-sm text-medium-gray">
            {isSignUp ? 'Enter your details to create a new account' : 'Enter your email and password to sign in'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-3 border border-light-gray placeholder-medium-gray text-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-3 border border-light-gray placeholder-medium-gray text-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                placeholder="Password"
              />
            </div>

            {isSignUp && (
              <div>
                <label htmlFor="name" className="sr-only">
                  Name (optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="relative block w-full px-3 py-3 border border-light-gray placeholder-medium-gray text-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                  placeholder="Name (optional)"
                />
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-[#B77D63] text-sm font-medium rounded-lg text-[#B77D63] bg-white hover:bg-[#B77D63] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B77D63] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </div>

          {message && (
            <div className={`text-center text-sm ${message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}
        </form>

        <div className="text-center space-y-4">
          <div>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
          <div>
            <Link href="/" className="text-warm-coral hover:text-warm-coral-hover text-sm">
              ← Back to Tours
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}