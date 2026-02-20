'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TempleStatus } from '@prisma/client'

interface Temple {
  id: string
  name: string
  slug: string
  country: string
  state?: string
  city: string
  status: TempleStatus
  dedicationDate?: string
  announcementDate?: string
  updatedAt: string
}

const statusColors = {
  [TempleStatus.DEDICATED]: 'bg-green-100 text-green-800',
  [TempleStatus.UNDER_CONSTRUCTION]: 'bg-blue-100 text-blue-800',
  [TempleStatus.ANNOUNCED]: 'bg-yellow-100 text-yellow-800',
  [TempleStatus.RENOVATING]: 'bg-orange-100 text-orange-800',
  [TempleStatus.CLOSED]: 'bg-gray-100 text-gray-800',
}

const statusLabels = {
  [TempleStatus.DEDICATED]: 'Dedicated',
  [TempleStatus.UNDER_CONSTRUCTION]: 'Under Construction',
  [TempleStatus.ANNOUNCED]: 'Announced',
  [TempleStatus.RENOVATING]: 'Renovating',
  [TempleStatus.CLOSED]: 'Closed',
}

export default function AdminDashboard() {
  const [temples, setTemples] = useState<Temple[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TempleStatus | 'ALL'>('ALL')

  useEffect(() => {
    fetchTemples()
  }, [])

  const fetchTemples = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/temples')
      if (!response.ok) {
        throw new Error('Failed to fetch temples')
      }
      const data = await response.json()
      setTemples(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredTemples = temples.filter(temple => {
    const matchesSearch = temple.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         temple.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (temple.state && temple.state.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = statusFilter === 'ALL' || temple.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: temples.length,
    dedicated: temples.filter(t => t.status === TempleStatus.DEDICATED).length,
    underConstruction: temples.filter(t => t.status === TempleStatus.UNDER_CONSTRUCTION).length,
    announced: temples.filter(t => t.status === TempleStatus.ANNOUNCED).length,
    renovating: temples.filter(t => t.status === TempleStatus.RENOVATING).length,
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading temples...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={fetchTemples}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Temple Administration</h1>
        <p className="mt-2 text-gray-600">Manage temple information and data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Temples</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">{stats.dedicated}</div>
          <div className="text-sm text-gray-600">Dedicated</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{stats.underConstruction}</div>
          <div className="text-sm text-gray-600">Under Construction</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-yellow-600">{stats.announced}</div>
          <div className="text-sm text-gray-600">Announced</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Temples
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TempleStatus | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value={TempleStatus.DEDICATED}>Dedicated</option>
              <option value={TempleStatus.UNDER_CONSTRUCTION}>Under Construction</option>
              <option value={TempleStatus.ANNOUNCED}>Announced</option>
              <option value={TempleStatus.RENOVATING}>Renovating</option>
              <option value={TempleStatus.CLOSED}>Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Temples Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Temples ({filteredTemples.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temple
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dedication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemples.map((temple) => (
                <tr key={temple.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{temple.name}</div>
                    <div className="text-sm text-gray-500">{temple.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {temple.city}
                      {temple.state && `, ${temple.state}`}
                    </div>
                    <div className="text-sm text-gray-500">{temple.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[temple.status]}`}>
                      {statusLabels[temple.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {temple.dedicationDate
                      ? new Date(temple.dedicationDate).toLocaleDateString()
                      : 'Not dedicated'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(temple.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/temples/${temple.id}`}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTemples.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No temples found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}