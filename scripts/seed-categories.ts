#!/usr/bin/env bun

/**
 * Seed Categories Script
 *
 * Creates initial blog categories in Convex
 * Update the categories array below with your desired categories
 *
 * Usage: bun run scripts/seed-categories.ts
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL || '')

// Define your categories here
const categories = [
  {
    name: 'SEO',
    slug: 'seo',
    description: 'Search Engine Optimization articles and strategies',
  },
  {
    name: 'GEO',
    slug: 'geo',
    description: 'Generative Engine Optimization insights',
  },
  {
    name: 'Case Studies',
    slug: 'case-studies',
    description: 'Client success stories and results',
  },
  {
    name: 'Industry News',
    slug: 'industry-news',
    description: 'Latest updates in search and digital marketing',
  },
  // Add more categories as needed
]

/**
 * Seed categories to Convex
 */
async function seedCategories() {
  console.log('📁 Seeding categories to Convex...\n')

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const cat of categories) {
    try {
      // Check if category already exists
      const existing = await convex.query(api.categories.getBySlug, {
        slug: cat.slug,
      })

      if (existing) {
        console.log(`⏭️  Skipped: "${cat.name}" (already exists)`)
        skipCount++
        continue
      }

      // Create category
      await convex.mutation(api.categories.create, {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      })

      console.log(`✅ Created: "${cat.name}"`)
      successCount++
    } catch (error) {
      console.error(`❌ Failed: "${cat.name}" - ${error}`)
      errorCount++
    }
  }

  console.log(`\n📊 Seeding complete!`)
  console.log(`  ✅ Created: ${successCount}`)
  console.log(`  ⏭️  Skipped: ${skipCount}`)
  console.log(`  ❌ Failed: ${errorCount}`)
}

// Run seeding
seedCategories().catch((error) => {
  console.error('❌ Seeding failed:', error)
  process.exit(1)
})
