import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { getCurrentUser } from '../../../lib/session'

// POST /api/push-subscription - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subscription } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Store the push subscription for the user
    await prisma.user.update({
      where: { id: user.id },
      data: { pushSubscription: JSON.stringify(subscription) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    )
  }
}

// DELETE /api/push-subscription - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove the push subscription for the user
    await prisma.user.update({
      where: { id: user.id },
      data: { pushSubscription: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    )
  }
}