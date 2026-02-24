import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

async function exportAndMergeTemples() {
  console.log('🌟 Starting temple data export and merge...')

  // Get staging database (current local)
  const stagingDB = new PrismaClient()

  // Save current DATABASE_URL
  const originalDbUrl = process.env.DATABASE_URL

  // Temporarily switch to production database
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_79ElHMhyGsnk@ep-steep-cell-aikw07tl-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

  // Get production database
  const productionDB = new PrismaClient()

  // Restore original DATABASE_URL
  process.env.DATABASE_URL = originalDbUrl

  try {
    // Export all temples from staging
    console.log('📦 Exporting temples from staging database...')
    const stagingTemples = await stagingDB.temple.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`✅ Found ${stagingTemples.length} temples in staging`)

    // Get production temples for comparison
    const productionTemples = await productionDB.temple.findMany({
      orderBy: { name: 'asc' }
    })

    console.log(`📊 Found ${productionTemples.length} temples in production`)

    let updatedCount = 0
    let newCount = 0

    // Merge each temple
    for (const temple of stagingTemples) {
      try {
        // Check if temple exists in production
        const existingTemple = productionTemples.find(p => p.slug === temple.slug)

        const templeData = {
          name: temple.name,
          slug: temple.slug,
          country: temple.country,
          state: temple.state,
          city: temple.city,
          address: temple.address,
          telephone: temple.telephone,
          announcementDate: temple.announcementDate,
          groundbreakingDate: temple.groundbreakingDate,
          dedicationDate: temple.dedicationDate,
          siteSize: temple.siteSize,
          exteriorFinish: temple.exteriorFinish,
          totalFloorArea: temple.totalFloorArea,
          elevation: temple.elevation,
          instructionRooms: temple.instructionRooms,
          sealingRooms: temple.sealingRooms,
          baptistry: temple.baptistry,
          spires: temple.spires,
          angelMoroni: temple.angelMoroni,
          visitorsCenter: temple.visitorsCenter,
          arrivalCenter: temple.arrivalCenter,
          patronHousing: temple.patronHousing,
          distributionCenter: temple.distributionCenter,
          latitude: temple.latitude,
          longitude: temple.longitude,
          status: temple.status
        }

        if (existingTemple) {
          // Update existing temple with staging data
          await productionDB.temple.update({
            where: { slug: temple.slug },
            data: templeData
          })
          console.log(`✅ Updated temple: ${temple.name}`)
          updatedCount++
        } else {
          // Create new temple
          await productionDB.temple.create({
            data: templeData
          })
          console.log(`🆕 Created new temple: ${temple.name}`)
          newCount++
        }
      } catch (error) {
        console.error(`❌ Error processing ${temple.name}:`, error)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   🆕 New temples created: ${newCount}`)
    console.log(`   📝 Existing temples updated: ${updatedCount}`)
    console.log(`   🏛️  Total temples processed: ${stagingTemples.length}`)
    console.log('🎉 Temple data export and merge completed!')

  } catch (error) {
    console.error('❌ Error during temple export and merge:', error)
  } finally {
    await stagingDB.$disconnect()
    await productionDB.$disconnect()
  }
}

exportAndMergeTemples().catch(console.error)