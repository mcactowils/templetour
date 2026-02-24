import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { getCurrentUser } from '../../../../lib/session'

// POST /api/notifications/mark-all-read - Mark all user notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    )
  }
}