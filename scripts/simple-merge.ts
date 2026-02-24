import 'dotenv/config'
import { prisma } from '../src/lib/prisma'
import { TempleStatus } from '@prisma/client'

// Simple script to update production temples with staging data
// Note: Run this with production DATABASE_URL environment variable

const templesData = [
  {
    slug: "brigham-city-utah-temple",
    telephone: "4356952170",
    address: "250 S Main Street",
    groundbreakingDate: new Date("2010-07-31"),
    dedicationDate: new Date("2012-09-23"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "deseret-peak-utah-temple",
    telephone: "4357280130",
    address: "2401 N 400 W Tooele, UT 84074",
    groundbreakingDate: new Date("2021-05-15"),
    dedicationDate: new Date("2024-11-10"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "ephraim-utah-temple",
    groundbreakingDate: new Date("2022-08-27"),
    status: TempleStatus.UNDER_CONSTRUCTION
  },
  {
    slug: "heber-valley-utah-temple",
    groundbreakingDate: new Date("2022-10-08"),
    status: TempleStatus.UNDER_CONSTRUCTION
  },
  {
    slug: "lindon-utah-temple",
    address: "850 E Center Street, Lindon, UT 84042",
    telephone: "8017013680",
    groundbreakingDate: new Date("2022-04-23"),
    dedicationDate: new Date("2026-05-03"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "orem-utah-temple",
    dedicationDate: new Date("2024-01-21"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "red-cliffs-utah-temple",
    dedicationDate: new Date("2024-03-24"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "salt-lake-temple",
    spires: 5
  },
  {
    slug: "syracuse-utah-temple",
    dedicationDate: new Date("2025-06-08"),
    status: TempleStatus.DEDICATED
  },
  {
    slug: "taylorsville-utah-temple",
    dedicationDate: new Date("2024-06-02"),
    status: TempleStatus.DEDICATED
  }
]

async function updateProductionTemples() {
  console.log('🌟 Starting production temple updates...')

  try {
    let updatedCount = 0

    for (const templeUpdate of templesData) {
      try {
        const { slug, ...updateData } = templeUpdate

        await prisma.temple.update({
          where: { slug },
          data: updateData
        })

        console.log(`✅ Updated temple: ${slug}`)
        updatedCount++
      } catch (error) {
        console.error(`❌ Error updating ${templeUpdate.slug}:`, error)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   📝 Temples updated: ${updatedCount}`)
    console.log('🎉 Temple updates completed!')

  } catch (error) {
    console.error('❌ Error during temple updates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateProductionTemples().catch(console.error)