#!/usr/bin/env bun

/**
 * Fix Featured Images Script
 *
 * Updates existing blog posts in Convex with featured images from WordPress export.
 * Downloads images from WordPress and uploads to Cloudflare Images.
 *
 * Usage:
 *   bun run scripts/fix-featured-images.ts --dry-run  # Preview changes
 *   bun run scripts/fix-featured-images.ts             # Execute migration
 *   bun run scripts/fix-featured-images.ts --force     # Re-upload all images
 */

import { promises as fs } from 'node:fs'
import { parseStringPromise } from 'xml2js'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { uploadImageFromUrl, getImageUrl } from '../src/lib/cloudflare-images'

// Configuration
const WORDPRESS_XML_PATH = 'public/onepercentseo.WordPress.2025-11-18.xml'
const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000
const RATE_LIMIT_DELAY_MS = 500

// Parse command-line flags
const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL || '')

// Statistics
const stats = {
  total: 0,
  success: 0,
  skipped: 0,
  failed: 0,
  errors: [] as Array<{ slug: string; error: string }>,
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Upload image from URL to Cloudflare with retry logic
 */
async function uploadToCloudflare(
  imageUrl: string,
  filename: string,
  attemptNum = 1,
): Promise<string | null> {
  try {
    console.log(`    ☁️  Uploading to Cloudflare (attempt ${attemptNum}/${RETRY_ATTEMPTS})...`)

    const imageId = await uploadImageFromUrl(imageUrl, { alt: filename })
    const cloudflareUrl = getImageUrl(imageId, 'large')

    console.log(`    ✓ Uploaded successfully: ${cloudflareUrl}`)
    return cloudflareUrl
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    if (attemptNum < RETRY_ATTEMPTS) {
      console.log(`    ⚠️  Upload failed: ${errorMsg}`)
      console.log(`    ⏳ Retrying in ${RETRY_DELAY_MS}ms...`)
      await sleep(RETRY_DELAY_MS)
      return uploadToCloudflare(imageUrl, filename, attemptNum + 1)
    }

    console.log(`    ✗ Upload failed after ${RETRY_ATTEMPTS} attempts: ${errorMsg}`)
    return null
  }
}

/**
 * Parse WordPress XML and extract featured image mappings
 */
async function parseWordPressXML(): Promise<Map<string, string>> {
  console.log('📖 Reading WordPress XML export...')
  const xmlContent = await fs.readFile(WORDPRESS_XML_PATH, 'utf-8')

  console.log('🔍 Parsing XML...')
  const result = await parseStringPromise(xmlContent)

  const channel = result.rss.channel[0]
  const items = channel.item || []

  console.log(`📝 Found ${items.length} items in export`)

  // Build attachment map (ID -> URL)
  const attachments: Record<string, string> = {}
  for (const item of items) {
    const postType = item['wp:post_type']?.[0]
    if (postType === 'attachment') {
      const attachmentId = item['wp:post_id']?.[0]
      const attachmentUrl = item['wp:attachment_url']?.[0]
      if (attachmentId && attachmentUrl) {
        attachments[attachmentId] = attachmentUrl
      }
    }
  }

  console.log(`📎 Found ${Object.keys(attachments).length} attachments`)

  // Build featured image map (slug -> image URL)
  const featuredImages = new Map<string, string>()

  for (const item of items) {
    const postType = item['wp:post_type']?.[0]
    if (postType !== 'post') continue

    const slug = item['wp:post_name']?.[0]
    if (!slug) continue

    // Extract featured image from postmeta
    const postmeta = item['wp:postmeta'] || []
    for (const meta of postmeta) {
      const metaKey = meta['wp:meta_key']?.[0]
      const metaValue = meta['wp:meta_value']?.[0]

      if (metaKey === '_thumbnail_id' && metaValue) {
        const imageUrl = attachments[metaValue]
        if (imageUrl) {
          featuredImages.set(slug, imageUrl)
        }
        break
      }
    }
  }

  console.log(`🖼️  Found ${featuredImages.size} posts with featured images\n`)
  return featuredImages
}

/**
 * Get all posts from Convex
 */
async function getConvexPosts() {
  console.log('🔄 Fetching posts from Convex...')
  const posts = await convex.query(api.posts.list, {})
  console.log(`📚 Found ${posts.length} posts in database\n`)
  return posts
}

/**
 * Update post with featured image
 */
async function updatePostFeaturedImage(postId: string, imageUrl: string) {
  if (isDryRun) {
    console.log(`    [DRY RUN] Would update post with featured image`)
    return
  }

  await convex.mutation(api.posts.updateFeaturedImage, {
    id: postId as any,
    featuredImage: imageUrl,
  })
  console.log(`    💾 Updated post in database`)
}

/**
 * Process a single post
 */
async function processPost(
  post: any,
  featuredImages: Map<string, string>,
  index: number,
  total: number,
) {
  const { _id, slug, title, featuredImage } = post

  console.log(`\n[${index + 1}/${total}] Processing: ${title}`)
  console.log(`    Slug: ${slug}`)

  // Check if already has featured image
  if (featuredImage && !isForce) {
    console.log(`    ⊘ Already has featured image (use --force to re-upload)`)
    stats.skipped++
    return
  }

  // Get featured image URL from WordPress
  const wordpressImageUrl = featuredImages.get(slug)
  if (!wordpressImageUrl) {
    console.log(`    ⊘ No featured image in WordPress export`)
    stats.skipped++
    return
  }

  console.log(`    🔗 WordPress URL: ${wordpressImageUrl}`)

  if (isDryRun) {
    console.log(`    [DRY RUN] Would upload this image to Cloudflare`)
    stats.success++
    return
  }

  // Upload to Cloudflare (Cloudflare downloads the image directly from URL)
  const filename = wordpressImageUrl.split('/').pop() || `${slug}.jpg`
  const cloudflareUrl = await uploadToCloudflare(wordpressImageUrl, filename)
  if (!cloudflareUrl) {
    stats.failed++
    stats.errors.push({ slug, error: 'Failed to upload to Cloudflare' })
    return
  }

  // Update post in Convex
  try {
    await updatePostFeaturedImage(_id, cloudflareUrl)
    stats.success++
    console.log(`    ✓ Featured image migration complete!`)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    stats.failed++
    stats.errors.push({ slug, error: `Failed to update post: ${errorMsg}` })
    console.log(`    ✗ Failed to update post: ${errorMsg}`)
  }

  // Rate limiting delay
  await sleep(RATE_LIMIT_DELAY_MS)
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Featured Image Fix Script\n')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE MIGRATION'}`)
  console.log(`Force: ${isForce ? 'YES (re-upload all)' : 'NO (skip existing)'}\n`)

  try {
    // Parse WordPress XML
    const featuredImages = await parseWordPressXML()

    // Get Convex posts
    const posts = await getConvexPosts()
    stats.total = posts.length

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      await processPost(posts[i], featuredImages, i, posts.length)
    }

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total posts:      ${stats.total}`)
    console.log(`✓ Success:        ${stats.success}`)
    console.log(`⊘ Skipped:        ${stats.skipped}`)
    console.log(`✗ Failed:         ${stats.failed}`)

    if (stats.errors.length > 0) {
      console.log('\n❌ FAILED POSTS:')
      for (const { slug, error } of stats.errors) {
        console.log(`  • ${slug}: ${error}`)
      }
    }

    if (isDryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.')
    }

    console.log('\n✅ Script completed!')
  } catch (error) {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
main()
