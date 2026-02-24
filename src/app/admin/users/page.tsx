'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string | null
  email: string
  isAdmin: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleUserAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (updatingUsers.has(userId)) return

    setUpdatingUsers(prev => new Set(prev).add(userId))

    try {
      const response = await fetch(`/api/admin/users/${userId}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      // Update the user in state
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, isAdmin: !currentIsAdmin } : user
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={() => { setError(null); fetchUsers(); }}
          className="mt-4 bg-warm-coral text-white px-6 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium"
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
        <h1 className="text-3xl font-bold text-charcoal">User Management</h1>
        <p className="mt-2 text-medium-gray">Manage user permissions and admin access</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
          <div className="text-2xl font-bold text-charcoal">{users.length}</div>
          <div className="text-sm text-medium-gray">Total Users</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
          <div className="text-2xl font-bold text-warm-coral">{users.filter(u => u.isAdmin).length}</div>
          <div className="text-sm text-medium-gray">Admins</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => !u.isAdmin).length}</div>
          <div className="text-sm text-medium-gray">Regular Users</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden">
        <div className="px-6 py-4 border-b border-light-gray">
          <h2 className="text-xl font-semibold text-charcoal">
            All Users ({users.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-light-gray">
            <thead className="bg-warm-gray-light">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-medium-gray uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-medium-gray uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-medium-gray uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-medium-gray uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-medium-gray uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-light-gray">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-warm-gray-light">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-warm-coral rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-charcoal">
                        {user.name || 'No Name'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-charcoal">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isAdmin
                        ? 'bg-warm-coral/20 text-warm-coral'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-gray">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleUserAdmin(user.id, user.isAdmin)}
                      disabled={updatingUsers.has(user.id)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                        user.isAdmin
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          : 'text-warm-coral hover:text-warm-coral-hover hover:bg-warm-coral/5'
                      }`}
                    >
                      {updatingUsers.has(user.id)
                        ? '...'
                        : user.isAdmin
                          ? 'Remove Admin'
                          : 'Make Admin'
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-8 text-medium-gray">
              No users found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}