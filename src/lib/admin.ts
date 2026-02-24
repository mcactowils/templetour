// Client-side admin helper functions
// This file contains admin email lists and helper functions for client-side admin checks

// List of admin user emails - update this with your actual admin emails
export const ADMIN_EMAILS = [
  // Add your admin email addresses here
  // Example: 'admin@example.com',
  // You can find your user emails in the database or by logging in and checking the session
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(wilsonmatthew@yahoo.com, wilsoncari@yahoo.com)
}

export function isAdminUser(user: { email?: string | null } | null | undefined): boolean {
  if (!user?.email) return false
  return isAdminEmail(user.email)
}