import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/session'
import { createNotification, validateNotificationEnvironment } from '../../../lib/notifications'

// GET /api/notifications - List user notifications with pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    console.log(`Fetching notifications for user ${user.id}, limit: ${limit}, offset: ${offset}, unreadOnly: ${unreadOnly}`)

    const whereClause: any = { userId: user.id }
    if (unreadOnly) {
      whereClause.isRead = false
    }

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          createdAt: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          actionUrl: true,
          metadata: true
        }
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false }
      }),
      prisma.notification.count({
        where: { userId: user.id }
      })
    ])

    console.log(`Found ${notifications.length} notifications for user ${user.id}`)

    return NextResponse.json({
      notifications,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + notifications.length < total
      },
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification (admin/system use)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate notification environment
    const envValidation = validateNotificationEnvironment()
    if (!envValidation.isValid) {
      console.error('Notification environment validation failed:', envValidation.errors)
      return NextResponse.json(
        {
          error: 'Notification system not properly configured',
          details: envValidation.errors
        },
        { status: 500 }
      )
    }

    if (envValidation.warnings.length > 0) {
      console.warn('Notification environment warnings:', envValidation.warnings)
    }

    const body = await request.json()
    const { userId, type, title, message, actionUrl, scheduleId, commentId, messageId, metadata } = body

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      )
    }

    // Validate notification type
    const validTypes = ['COMMENT_ON_SCHEDULE', 'REPLY_TO_MESSAGE', 'SCHEDULE_UPDATE', 'GENERAL']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    console.log(`Creating notification for user ${userId} of type ${type}`)

    const notification = await createNotification({
      userId,
      type,
      title,
      message,
      actionUrl,
      scheduleId,
      commentId,
      messageId,
      metadata
    })

    console.log(`Notification created successfully: ${notification.id}`)

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      {
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}