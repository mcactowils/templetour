import 'dotenv/config'
import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs/promises'
import { TempleStatus } from '@prisma/client'

interface TempleData {
  name: string
  slug: string
  country: string
  state?: string
  city: string
  address?: string
  telephone?: string
  announcementDate?: Date
  groundbreakingDate?: Date
  dedicationDate?: Date
  siteSize?: string
  exteriorFinish?: string
  totalFloorArea?: string
  elevation?: string
  instructionRooms?: number
  sealingRooms?: number
  baptistry: boolean
  spires?: number
  angelMoroni: boolean
  visitorsCenter: boolean
  arrivalCenter: boolean
  patronHousing: boolean
  distributionCenter: boolean
  status: TempleStatus
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseStatus(statusText: string): TempleStatus {
  const status = statusText.toLowerCase()
  if (status.includes('dedicated')) return TempleStatus.DEDICATED
  if (status.includes('construction') || status.includes('building')) return TempleStatus.UNDER_CONSTRUCTION
  if (status.includes('announced')) return TempleStatus.ANNOUNCED
  if (status.includes('renovat') || status.includes('closed')) return TempleStatus.RENOVATING
  return TempleStatus.ANNOUNCED
}

function parseDate(dateText: string): Date | undefined {
  if (!dateText) return undefined
  try {
    // Handle various date formats
    const cleaned = dateText.replace(/\s+/g, ' ').trim()
    return new Date(cleaned)
  } catch {
    return undefined
  }
}

async function scrapeTempleList(): Promise<TempleData[]> {
  console.log('🔍 Scraping temple list from churchofjesuschristtemples.org...')

  try {
    const response = await axios.get('https://churchofjesuschristtemples.org/temples/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TempleTour/1.0; Educational/Research)'
      }
    })

    const $ = cheerio.load(response.data)
    const temples: TempleData[] = []

    // Look for temple links - adjust selector based on actual site structure
    $('a[href*="/temples/"]').each((index, element) => {
      const $element = $(element)
      const href = $element.attr('href')
      const name = $element.text().trim()

      if (name && href && !href.includes('statistics') && !href.includes('chronology')) {
        const temple: TempleData = {
          name: name,
          slug: createSlug(name),
          country: 'Unknown', // Will need to be extracted from individual pages
          city: 'Unknown',
          baptistry: true, // Default assumption
          angelMoroni: true, // Default assumption
          visitorsCenter: false,
          arrivalCenter: false,
          patronHousing: false,
          distributionCenter: false,
          status: TempleStatus.DEDICATED
        }

        temples.push(temple)
      }
    })

    return temples.slice(0, 50) // Limit for initial testing

  } catch (error) {
    console.error('❌ Error scraping temple list:', error)
    return []
  }
}

async function scrapeWikipediaTemples(): Promise<TempleData[]> {
  console.log('🔍 Scraping temple data from Wikipedia...')

  try {
    const response = await axios.get('https://en.wikipedia.org/wiki/List_of_temples_(LDS_Church)', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TempleTour/1.0; Educational/Research)'
      }
    })

    const $ = cheerio.load(response.data)
    const temples: TempleData[] = []

    // Look for temple data in tables
    $('table.wikitable tr').each((index, row) => {
      const $row = $(row)
      const cells = $row.find('td')

      if (cells.length >= 4) {
        const name = $(cells[0]).text().trim()
        const location = $(cells[1]).text().trim()
        const announcementDate = $(cells[2]).text().trim()
        const dedicationDate = $(cells[3]).text().trim()

        if (name && location && !name.includes('Temple')) {
          const templeName = name.includes('Temple') ? name : `${name} Temple`
          const [city, state, country] = location.split(',').map(s => s.trim())

          const temple: TempleData = {
            name: templeName,
            slug: createSlug(templeName),
            country: country || state || city || 'Unknown',
            state: country ? state : undefined,
            city: city || 'Unknown',
            announcementDate: parseDate(announcementDate),
            dedicationDate: parseDate(dedicationDate),
            baptistry: true,
            angelMoroni: true,
            visitorsCenter: false,
            arrivalCenter: false,
            patronHousing: false,
            distributionCenter: false,
            status: parseDate(dedicationDate) ? TempleStatus.DEDICATED : TempleStatus.ANNOUNCED
          }

          temples.push(temple)
        }
      }
    })

    return temples.slice(0, 100) // Return up to 100 temples

  } catch (error) {
    console.error('❌ Error scraping Wikipedia:', error)
    return []
  }
}

async function main() {
  try {
    console.log('🌟 Starting temple data scraping...')

    // Try Wikipedia first as it has structured data
    let temples = await scrapeWikipediaTemples()

    if (temples.length === 0) {
      // Fallback to other sources
      temples = await scrapeTempleList()
    }

    if (temples.length === 0) {
      console.log('❌ No temple data found')
      return
    }

    console.log(`✅ Found ${temples.length} temples`)

    // Save to JSON file
    await fs.writeFile(
      'scripts/scraped-temples.json',
      JSON.stringify(temples, null, 2)
    )

    console.log('💾 Saved temple data to scripts/scraped-temples.json')
    console.log('🎉 Temple scraping completed!')

  } catch (error) {
    console.error('💥 Error during scraping:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { scrapeWikipediaTemples, scrapeTempleList, type TempleData }