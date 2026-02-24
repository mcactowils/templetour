import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

import { ADMIN_EMAILS } from './admin'

export async function getCurrentUserWithAdminCheck() {
  const user = await getCurrentUser()

  if (!user) {
    return { user: null, isAdmin: false }
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email)

  return { user, isAdmin }
}

export async function requireAdmin() {
  const { user, isAdmin } = await getCurrentUserWithAdminCheck()

  if (!user) {
    throw new Error('Unauthorized - Please login')
  }

  if (!isAdmin) {
    throw new Error('Forbidden - Admin access required')
  }

  return user
}