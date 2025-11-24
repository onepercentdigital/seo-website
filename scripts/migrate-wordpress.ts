#!/usr/bin/env bun

/**
 * WordPress to Convex Migration Script
 *
 * Imports blog posts from WordPress XML export to Convex
 * Downloads images from live WordPress site and uploads to Cloudflare Images
 * Converts HTML content to Markdown
 *
 * Usage:
 *   bun run scripts/migrate-wordpress.ts /path/to/wordpress-export.xml
 *   bun run scripts/migrate-wordpress.ts /path/to/wordpress-export.xml --dry-run
 */

import { promises as fs } from 'node:fs'
import { parseStringPromise } from 'xml2js'
import TurndownService from 'turndown'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { uploadImageFromUrl, getImageUrl } from '../src/lib/cloudflare-images'

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL || '')

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

// Check for dry-run mode
const isDryRun = process.argv.includes('--dry-run')

interface WordPressPost {
  title: string
  slug: string
  content: string
  excerpt: string
  publishDate: Date
  author: string
  categories: string[]
  status: 'publish' | 'draft'
  featuredImageUrl?: string
}

/**
 * Parse WordPress XML export file
 */
async function parseWordPressXML(filePath: string): Promise<WordPressPost[]> {
  console.log('📖 Reading WordPress XML export...')
  const xmlContent = await fs.readFile(filePath, 'utf-8')

  console.log('🔍 Parsing XML...')
  const result = await parseStringPromise(xmlContent)

  const channel = result.rss.channel[0]
  const items = channel.item || []

  console.log(`📝 Found ${items.length} items in export`)

  // First pass: Build attachment map (post ID -> image URL)
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

  // Second pass: Extract blog posts
  const posts: WordPressPost[] = []

  for (const item of items) {
    // Skip if not a post
    const postType = item['wp:post_type']?.[0]
    if (postType !== 'post') continue

    // Skip if post status is not publish
    const status = item['wp:status']?.[0]
    if (status !== 'publish') {
      console.log(`  ⏭️  Skipping non-published post: ${item.title?.[0] || 'Untitled'}`)
      continue
    }

    // Extract post data
    const title = item.title?.[0] || 'Untitled'
    const slug = item['wp:post_name']?.[0] || ''
    const contentHtml = item['content:encoded']?.[0] || ''
    const excerptHtml = item['excerpt:encoded']?.[0] || ''
    const pubDate = new Date(item.pubDate?.[0] || new Date())
    const author = item['dc:creator']?.[0] || 'Admin'

    // Extract categories
    const categories =
      item.category
        ?.filter((cat: any) => cat.$.domain === 'category')
        .map((cat: any) => cat._) || []

    // Extract featured image URL from attachment map
    const thumbnailId = item['wp:postmeta']?.find(
      (meta: any) => meta['wp:meta_key']?.[0] === '_thumbnail_id'
    )?.['wp:meta_value']?.[0]

    const featuredImageUrl = thumbnailId ? attachments[thumbnailId] : undefined

    posts.push({
      title,
      slug,
      content: contentHtml,
      excerpt: excerptHtml,
      publishDate: pubDate,
      author,
      categories,
      status: 'publish',
      featuredImageUrl,
    })
  }

  console.log(`✅ Found ${posts.length} blog posts to migrate`)
  return posts
}

/**
 * Download image from URL and upload to Cloudflare
 */
async function migrateImage(
  imageUrl: string,
  alt: string
): Promise<string | null> {
  try {
    console.log(`  📸 Migrating image: ${imageUrl}`)

    // Validate URL
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`  ⚠️  Invalid image URL: ${imageUrl}`)
      return null
    }

    const imageId = await uploadImageFromUrl(imageUrl, { alt })
    const newUrl = getImageUrl(imageId, 'large')
    console.log(`  ✅ Image uploaded: ${newUrl}`)
    return newUrl
  } catch (error) {
    console.error(`  ❌ Failed to migrate image: ${error}`)
    return null
  }
}

/**
 * Convert HTML to Markdown and migrate images
 */
async function convertContentToMarkdown(
  html: string,
  title: string
): Promise<{ content: string; imagesFailed: number }> {
  let imagesFailed = 0

  // Extract image URLs from HTML
  const imgRegex = /<img[^>]+src="([^">]+)"/g
  const imageUrls: string[] = []
  let match: RegExpExecArray | null

  while ((match = imgRegex.exec(html)) !== null) {
    imageUrls.push(match[1])
  }

  // Migrate images to Cloudflare
  const imageMapping: Record<string, string> = {}
  for (const oldUrl of imageUrls) {
    const newUrl = await migrateImage(oldUrl, title)
    if (newUrl) {
      imageMapping[oldUrl] = newUrl
    } else {
      imagesFailed++
    }
  }

  // Replace image URLs in HTML
  let updatedHtml = html
  for (const [oldUrl, newUrl] of Object.entries(imageMapping)) {
    updatedHtml = updatedHtml.replace(new RegExp(oldUrl, 'g'), newUrl)
  }

  // Convert to Markdown
  const markdown = turndownService.turndown(updatedHtml)
  return { content: markdown, imagesFailed }
}

/**
 * Get or create category in Convex
 */
async function getOrCreateCategory(
  categoryName: string
): Promise<string | undefined> {
  if (!categoryName) return undefined

  const slug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Check if category exists
  const existingCategory = await convex.query(api.categories.getBySlug, {
    slug,
  })

  if (existingCategory) {
    return existingCategory._id
  }

  // Create new category
  if (isDryRun) {
    console.log(`  [DRY RUN] Would create category: ${categoryName}`)
    return undefined
  }

  console.log(`  📁 Creating category: ${categoryName}`)
  const categoryId = await convex.mutation(api.categories.create, {
    name: categoryName,
    slug,
  })

  return categoryId
}

/**
 * Import posts to Convex
 */
async function importPosts(posts: WordPressPost[]) {
  console.log(`\n${isDryRun ? '🔍 DRY RUN MODE - No changes will be made\n' : '📦 Importing posts to Convex...\n'}`)

  let successCount = 0
  let skipCount = 0
  let failCount = 0
  let imageFailCount = 0

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] Processing: ${post.title}`)

    try {
      // Check if post already exists
      const existingPost = await convex.query(api.posts.getBySlug, {
        slug: post.slug,
      })

      if (existingPost) {
        console.log(`  ⏭️  Already exists, skipping...`)
        skipCount++
        continue
      }

      if (isDryRun) {
        console.log(`  [DRY RUN] Would import post: ${post.title}`)
        console.log(`    - Slug: ${post.slug}`)
        console.log(`    - Categories: ${post.categories.join(', ') || 'None'}`)
        console.log(`    - Featured image: ${post.featuredImageUrl || 'None'}`)
        successCount++
        continue
      }

      // Convert content to Markdown and migrate images
      const { content, imagesFailed } = await convertContentToMarkdown(
        post.content,
        post.title
      )
      const excerpt = post.excerpt
        ? turndownService.turndown(post.excerpt)
        : undefined

      // Get or create category (use first category if multiple)
      const categoryId = post.categories[0]
        ? await getOrCreateCategory(post.categories[0])
        : undefined

      // Migrate featured image if exists
      let featuredImage: string | undefined
      let featuredImageFailed = false

      if (post.featuredImageUrl) {
        const migratedImage = await migrateImage(
          post.featuredImageUrl,
          post.title
        )
        if (migratedImage) {
          featuredImage = migratedImage
        } else {
          featuredImageFailed = true
        }
      }

      // Create post in Convex
      await convex.mutation(api.posts.create, {
        title: post.title,
        slug: post.slug,
        content,
        excerpt,
        featuredImage,
        categoryId: categoryId as any,
        authorName: post.author,
        status: 'published',
        seo: {
          metaTitle: post.title,
          metaDescription: excerpt?.substring(0, 160),
        },
      })

      console.log(`  ✅ Imported successfully`)

      if (featuredImageFailed || imagesFailed > 0) {
        console.log(`  ⚠️  Post created but ${featuredImageFailed ? 'featured image' : ''} ${imagesFailed > 0 ? `${imagesFailed} inline image(s)` : ''} failed - review manually`)
        imageFailCount++
      }

      successCount++
    } catch (error) {
      console.error(`  ❌ Failed to import: ${error}`)
      failCount++
    }
  }

  console.log(`\n📊 Migration ${isDryRun ? 'preview' : 'complete'}!`)
  console.log(`  ✅ Successful: ${successCount}`)
  console.log(`  ⏭️  Skipped: ${skipCount}`)
  console.log(`  ❌ Failed: ${failCount}`)
  if (imageFailCount > 0) {
    console.log(`  ⚠️  Posts with image failures: ${imageFailCount} (review manually)`)
  }
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2).filter(arg => arg !== '--dry-run')

  if (args.length === 0) {
    console.error('❌ Error: Please provide path to WordPress XML export file')
    console.log('Usage: bun run scripts/migrate-wordpress.ts /path/to/export.xml')
    console.log('       bun run scripts/migrate-wordpress.ts /path/to/export.xml --dry-run')
    process.exit(1)
  }

  const xmlFilePath = args[0]

  try {
    // Check if file exists
    await fs.access(xmlFilePath)
  } catch {
    console.error(`❌ Error: File not found: ${xmlFilePath}`)
    process.exit(1)
  }

  console.log('🚀 Starting WordPress to Convex migration...\n')

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No actual changes will be made\n')
  }

  // Parse WordPress XML
  const posts = await parseWordPressXML(xmlFilePath)

  if (posts.length === 0) {
    console.log('⚠️  No posts found to migrate')
    return
  }

  if (!isDryRun) {
    // Confirm before proceeding
    console.log(`\n⚠️  About to import ${posts.length} posts to Convex`)
    console.log('⚠️  Images will be downloaded and uploaded to Cloudflare')
    console.log('\nPress Ctrl+C to cancel, or Enter to continue...')

    // Wait for user confirmation
    await new Promise((resolve) => {
      process.stdin.once('data', resolve)
    })
  }

  // Import posts
  await importPosts(posts)

  if (isDryRun) {
    console.log('\n✨ Dry run complete! Run without --dry-run to execute migration.')
  } else {
    console.log('\n✨ Migration complete!')
  }
}

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
