// Client-side admin helper functions
// This file contains admin helper functions for client-side admin checks

// Legacy email list for fallback (in case database isn't available)
// Updated: Admin system now uses database-first approach
export const ADMIN_EMAILS = [
  'wilsonmatthew@yahoo.com',
  'wilsoncari@yahoo.com',
  // Add more admin email addresses here as fallback
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

// Client-side admin check using user object
export function isAdminUser(user: { email?: string | null; isAdmin?: boolean } | null | undefined): boolean {
  if (!user) return false

  // Use database isAdmin field if available
  if (typeof user.isAdmin === 'boolean') {
    return user.isAdmin
  }

  // Fallback to email check for legacy compatibility
  return isAdminEmail(user.email)
}