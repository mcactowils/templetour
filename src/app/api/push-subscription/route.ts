import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/session'

// POST /api/push-subscription - Save or update user's push notification subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription data is required' },
        { status: 400 }
      )
    }

    // Validate subscription format
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription format. Missing endpoint or keys.' },
        { status: 400 }
      )
    }

    console.log(`Saving push subscription for user ${user.id}`)

    // Store subscription as JSON string
    const subscriptionString = JSON.stringify(subscription)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { pushSubscription: subscriptionString },
      select: { id: true, pushSubscription: true }
    })

    console.log(`Push subscription saved successfully for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Push subscription saved successfully'
    })

  } catch (error) {
    console.error('Error saving push subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to save push subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/push-subscription - Remove user's push notification subscription
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`Removing push subscription for user ${user.id}`)

    await prisma.user.update({
      where: { id: user.id },
      data: { pushSubscription: null }
    })

    console.log(`Push subscription removed successfully for user ${user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully'
    })

  } catch (error) {
    console.error('Error removing push subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to remove push subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/push-subscription - Check if user has push subscription enabled
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { pushSubscription: true }
    })

    return NextResponse.json({
      hasSubscription: !!userData?.pushSubscription,
      vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
    })

  } catch (error) {
    console.error('Error checking push subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to check push subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}