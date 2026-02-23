import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const utahTemples = await prisma.temple.findMany({
      where: {
        state: 'Utah'
      },
      orderBy: {
        name: 'asc'
      },
      include: {
        schedules: {
          where: {
            scheduledDate: { gte: new Date() }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 1,
          select: {
            id: true,
            scheduledDate: true,
            title: true,
          }
        }
      }
    })

    return NextResponse.json(utahTemples)
  } catch (error) {
    console.error('Error fetching Utah temples:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Utah temples' },
      { status: 500 }
    )
  }
}