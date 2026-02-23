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