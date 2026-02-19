import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET /api/temples/[slug] - Get a specific temple by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const temple = await prisma.temple.findUnique({
      where: { slug },
      include: {
        tours: {
          orderBy: { visitDate: 'desc' },
          take: 10 // Latest 10 tours
        },
        _count: {
          select: { tours: true }
        }
      }
    })

    if (!temple) {
      return NextResponse.json(
        { error: 'Temple not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(temple)
  } catch (error) {
    console.error('Error fetching temple:', error)
    return NextResponse.json(
      { error: 'Failed to fetch temple' },
      { status: 500 }
    )
  }
}

// PUT /api/temples/[slug] - Update a temple
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const data = await request.json()

    // Convert date strings to Date objects if provided
    if (data.announcementDate) {
      data.announcementDate = new Date(data.announcementDate)
    }
    if (data.groundbreakingDate) {
      data.groundbreakingDate = new Date(data.groundbreakingDate)
    }
    if (data.dedicationDate) {
      data.dedicationDate = new Date(data.dedicationDate)
    }

    const temple = await prisma.temple.update({
      where: { slug },
      data
    })

    return NextResponse.json(temple)
  } catch (error) {
    console.error('Error updating temple:', error)
    return NextResponse.json(
      { error: 'Failed to update temple' },
      { status: 500 }
    )
  }
}

// DELETE /api/temples/[slug] - Delete a temple
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    await prisma.temple.delete({
      where: { slug }
    })

    return NextResponse.json({ message: 'Temple deleted successfully' })
  } catch (error) {
    console.error('Error deleting temple:', error)
    return NextResponse.json(
      { error: 'Failed to delete temple' },
      { status: 500 }
    )
  }
}