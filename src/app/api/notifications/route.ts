import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/session'

// GET /api/notifications - List user's notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const where = {
      userId: user.id,
      ...(unreadOnly && { isRead: false })
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: offset
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false }
    })

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === Math.min(limit, 100)
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type, title, message, actionUrl, scheduleId, commentId, messageId } = body

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        scheduleId,
        commentId,
        messageId
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}