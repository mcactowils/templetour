'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Tour {
  id: string
  name: string
  description: string | null
  createdAt: string
  createdBy: {
    id: string
    name: string
  }
  _count: {
    members: number
    trips: number
    comments: number
  }
  nextTripDate: string | null
}

export default function ToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tours')
      if (!response.ok) throw new Error('Failed to fetch tours')
      const data = await response.json()
      setTours(data.tours)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading tours...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={fetchTours}
          className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Temple Tours</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Create a tour, invite others, and schedule temple trips together
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
        >
          Create a Tour
        </Link>
      </div>

      {tours.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-5xl mb-4">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tours yet</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Create your first temple tour to start planning trips with friends and family.
          </p>
          <Link
            href="/schedules/new"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Your First Tour
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              href={`/schedules/${tour.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold text-gray-900">{tour.name}</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 shrink-0 ml-2">
                  {tour._count.trips} {tour._count.trips === 1 ? 'trip' : 'trips'}
                </span>
              </div>

              {tour.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {tour.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {tour._count.members} {tour._count.members === 1 ? 'member' : 'members'}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {tour._count.comments}
                </div>
                {tour.nextTripDate && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Next: {formatDate(tour.nextTripDate)}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Created by {tour.createdBy.name} on {formatDate(tour.createdAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
