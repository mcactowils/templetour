import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET /api/temples/by-id/[id] - Get a specific temple by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const temple = await prisma.temple.findUnique({
      where: { id },
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

// PUT /api/temples/by-id/[id] - Update a temple by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Clean up undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === '') {
        delete data[key]
      }
    })

    const temple = await prisma.temple.update({
      where: { id },
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

// DELETE /api/temples/by-id/[id] - Delete a temple by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.temple.delete({
      where: { id }
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