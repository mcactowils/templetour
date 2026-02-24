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
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        scheduleId: data.scheduleId,
        commentId: data.commentId,
        messageId: data.messageId
      }
    })

    // If user has push subscription, send push notification
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { pushSubscription: true }
    })

    if (user?.pushSubscription) {
      await sendPushNotification(user.pushSubscription, {
        title: data.title,
        message: data.message,
        url: data.actionUrl
      })
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

interface PushNotificationData {
  title: string
  message: string
  url?: string
}

async function sendPushNotification(subscription: string, data: PushNotificationData) {
  try {
    const webpush = await import('web-push')

    // Configure web-push with your VAPID keys
    webpush.setVapidDetails(
      'mailto:notifications@templetour.app',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    )

    const payload = JSON.stringify({
      title: data.title,
      body: data.message,
      icon: '/salt lake temple.svg',
      badge: '/salt lake temple.svg',
      url: data.url,
      timestamp: Date.now()
    })

    await webpush.sendNotification(JSON.parse(subscription), payload)
    console.log('Push notification sent successfully')
  } catch (error) {
    console.error('Error sending push notification:', error)
    // Don't throw error - push notification failure shouldn't break the flow
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

    if (!schedule) return

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

    // Create notifications
    const notifications = Array.from(notifyUsers).map(userId =>
      createNotification({
        userId,
        type: 'COMMENT_ON_SCHEDULE',
        title: 'New comment on appointment',
        message: `${commenterName} commented on "${scheduleName}"`,
        actionUrl: `/schedules/${scheduleId}`,
        scheduleId,
        commentId
      })
    )

    await Promise.all(notifications)
  } catch (error) {
    console.error('Error creating comment notifications:', error)
  }
}

export async function createMessageReplyNotification(
  replierId: string,
  originalMessageId: string,
  replyMessageId: string,
  replierName: string
) {
  try {
    // Get the original message author
    const originalMessage = await prisma.message.findUnique({
      where: { id: originalMessageId },
      include: { user: true }
    })

    if (!originalMessage || originalMessage.userId === replierId) return

    await createNotification({
      userId: originalMessage.userId,
      type: 'REPLY_TO_MESSAGE',
      title: 'Reply to your message',
      message: `${replierName} replied to your message`,
      actionUrl: `/messages`,
      messageId: replyMessageId
    })
  } catch (error) {
    console.error('Error creating message reply notification:', error)
  }
}