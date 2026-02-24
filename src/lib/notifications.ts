import { prisma } from './prisma'

export interface CreateNotificationData {
  userId: string
  type: 'COMMENT_ON_SCHEDULE' | 'REPLY_TO_MESSAGE' | 'SCHEDULE_UPDATE' | 'GENERAL'
  title: string
  message: string
  actionUrl?: string
  scheduleId?: string
  commentId?: string
  messageId?: string
  metadata?: Record<string, any>
}

interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  timestamp?: number
}

const isProductionEnvironment = process.env.NODE_ENV === 'production'
const vapidKeysConfigured = Boolean(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
)

export async function createNotification(data: CreateNotificationData) {
  try {
    // Validate required data
    if (!data.userId || !data.type || !data.title || !data.message) {
      throw new Error('Missing required notification data')
    }

    console.log('Creating notification for user:', data.userId, 'type:', data.type)

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        scheduleId: data.scheduleId,
        commentId: data.commentId,
        messageId: data.messageId,
        metadata: data.metadata
      }
    })

    console.log('Notification created successfully:', notification.id)

    // Only attempt push notifications if properly configured
    if (vapidKeysConfigured) {
      try {
        await sendPushNotificationToUser(data.userId, {
          title: data.title,
          body: data.message,
          url: data.actionUrl,
          icon: '/salt lake temple.svg',
          badge: '/salt lake temple.svg',
          timestamp: Date.now()
        })
      } catch (pushError) {
        // Log push notification errors but don't fail notification creation
        console.warn('Push notification failed but in-app notification created:', pushError)
      }
    } else {
      console.log('Push notifications not configured - skipping')
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    // In production, we might want to use a monitoring service
    if (isProductionEnvironment) {
      // Could send to error monitoring service here
    }
    throw error
  }
}

async function sendPushNotificationToUser(userId: string, payload: PushNotificationPayload) {
  try {
    // Get user's push subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushSubscription: true }
    })

    if (!user?.pushSubscription) {
      console.log('User has no push subscription:', userId)
      return
    }

    let subscription
    try {
      subscription = JSON.parse(user.pushSubscription)
    } catch (parseError) {
      console.error('Invalid push subscription format for user:', userId, parseError)
      return
    }

    // Dynamically import web-push to avoid issues in environments where it's not available
    const webPush = await import('web-push')

    webPush.setVapidDetails(
      'mailto:notifications@templetour.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const pushPayload = JSON.stringify(payload)

    await webPush.sendNotification(subscription, pushPayload)
    console.log('Push notification sent successfully to user:', userId)

  } catch (error) {
    console.error('Error sending push notification to user:', userId, error)

    // If push subscription is invalid, we might want to clean it up
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const statusCode = (error as any).statusCode
      if (statusCode === 410 || statusCode === 404) {
        // Subscription is no longer valid, clean it up
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { pushSubscription: null }
          })
          console.log('Cleaned up invalid push subscription for user:', userId)
        } catch (cleanupError) {
          console.error('Error cleaning up invalid subscription:', cleanupError)
        }
      }
    }

    // Re-throw to let caller handle
    throw error
  }
}

export async function createCommentNotification(
  commenterId: string,
  scheduleId: string,
  commentId: string,
  commenterName: string,
  scheduleName: string
) {
  try {
    console.log('Creating comment notifications for schedule:', scheduleId)

    // Get the schedule owner and attendees
    const schedule = await prisma.templeSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        createdBy: true,
        attendees: {
          include: { user: true }
        }
      }
    })

    if (!schedule) {
      console.warn('Schedule not found for comment notification:', scheduleId)
      return
    }

    // Create notifications for relevant users (excluding the commenter)
    const notifyUsers = new Set<string>()

    // Notify schedule creator
    if (schedule.createdBy.id !== commenterId) {
      notifyUsers.add(schedule.createdBy.id)
    }

    // Notify attendees
    schedule.attendees.forEach(attendee => {
      if (attendee.user.id !== commenterId) {
        notifyUsers.add(attendee.user.id)
      }
    })

    console.log('Notifying users:', Array.from(notifyUsers))

    // Create notifications concurrently but handle errors individually
    const notificationPromises = Array.from(notifyUsers).map(async (userId) => {
      try {
        return await createNotification({
          userId,
          type: 'COMMENT_ON_SCHEDULE',
          title: 'New comment on appointment',
          message: `${commenterName} commented on "${scheduleName}"`,
          actionUrl: `/schedules/${scheduleId}`,
          scheduleId,
          commentId,
          metadata: {
            commenterName,
            scheduleName
          }
        })
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error)
        return null
      }
    })

    const results = await Promise.allSettled(notificationPromises)
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length

    console.log(`Comment notifications: ${successful} successful, ${failed} failed`)

  } catch (error) {
    console.error('Error creating comment notifications:', error)
    // Don't throw - notification failure shouldn't break comment creation
  }
}

export async function createMessageReplyNotification(
  replierId: string,
  originalMessageId: string,
  replyMessageId: string,
  replierName: string
) {
  try {
    console.log('Creating message reply notification for message:', originalMessageId)

    // Get the original message author
    const originalMessage = await prisma.message.findUnique({
      where: { id: originalMessageId },
      include: { user: true }
    })

    if (!originalMessage) {
      console.warn('Original message not found for reply notification:', originalMessageId)
      return
    }

    if (originalMessage.userId === replierId) {
      console.log('Not notifying user of their own reply')
      return
    }

    await createNotification({
      userId: originalMessage.userId,
      type: 'REPLY_TO_MESSAGE',
      title: 'Reply to your message',
      message: `${replierName} replied to your message`,
      actionUrl: `/messages`,
      messageId: replyMessageId,
      metadata: {
        replierName,
        originalMessageId
      }
    })

    console.log('Message reply notification created successfully')

  } catch (error) {
    console.error('Error creating message reply notification:', error)
    // Don't throw - notification failure shouldn't break reply creation
  }
}

// Utility function to validate environment setup
export function validateNotificationEnvironment(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = []
  const warnings: string[] = []

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    warnings.push('NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured - push notifications disabled')
  }

  if (!process.env.VAPID_PRIVATE_KEY) {
    warnings.push('VAPID_PRIVATE_KEY not configured - push notifications disabled')
  }

  // Could add other validation here (database connection, etc.)

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}