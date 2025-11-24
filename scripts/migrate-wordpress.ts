#!/usr/bin/env bun

/**
 * WordPress to Convex Migration Script
 *
 * Imports blog posts from WordPress XML export to Convex
 * Downloads images from live WordPress site and uploads to Cloudflare Images
 * Converts HTML content to Markdown
 *
 * Usage: bun run scripts/migrate-wordpress.ts /path/to/wordpress-export.xml
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

  const posts: WordPressPost[] = []

  for (const item of items) {
    // Skip if not a post (could be page, attachment, etc.)
    const postType = item['wp:post_type']?.[0]
    if (postType !== 'post') continue

    // Skip if post status is trash
    const status = item['wp:status']?.[0]
    if (status === 'trash') continue

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

    // Extract featured image
    const featuredImageUrl = item['wp:postmeta']?.find(
      (meta: any) => meta['wp:meta_key']?.[0] === '_thumbnail_id'
    )

    posts.push({
      title,
      slug,
      content: contentHtml,
      excerpt: excerptHtml,
      publishDate: pubDate,
      author,
      categories,
      status: status === 'publish' ? 'publish' : 'draft',
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
): Promise<string> {
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
    }
  }

  // Replace image URLs in HTML
  let updatedHtml = html
  for (const [oldUrl, newUrl] of Object.entries(imageMapping)) {
    updatedHtml = updatedHtml.replace(new RegExp(oldUrl, 'g'), newUrl)
  }

  // Convert to Markdown
  const markdown = turndownService.turndown(updatedHtml)
  return markdown
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
  console.log('\n📦 Importing posts to Convex...')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    console.log(`\n[${i + 1}/${posts.length}] Processing: ${post.title}`)

    try {
      // Convert content to Markdown and migrate images
      const content = await convertContentToMarkdown(post.content, post.title)
      const excerpt = post.excerpt
        ? turndownService.turndown(post.excerpt)
        : undefined

      // Get or create category (use first category if multiple)
      const categoryId = post.categories[0]
        ? await getOrCreateCategory(post.categories[0])
        : undefined

      // Migrate featured image if exists
      let featuredImage: string | undefined
      if (post.featuredImageUrl) {
        const migratedImage = await migrateImage(
          post.featuredImageUrl,
          post.title
        )
        if (migratedImage) {
          featuredImage = migratedImage
        }
      }

      // Create post in Convex
      await convex.mutation(api.posts.create, {
        title: post.title,
        slug: post.slug,
        content,
        excerpt,
        featuredImage,
        categoryId,
        authorName: post.author,
        status: post.status === 'publish' ? 'published' : 'draft',
        seo: {
          metaTitle: post.title,
          metaDescription: excerpt?.substring(0, 160),
        },
      })

      console.log(`  ✅ Imported successfully`)
      successCount++
    } catch (error) {
      console.error(`  ❌ Failed to import: ${error}`)
      failCount++
    }
  }

  console.log(`\n📊 Migration complete!`)
  console.log(`  ✅ Successful: ${successCount}`)
  console.log(`  ❌ Failed: ${failCount}`)
}

/**
 * Main migration function
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('❌ Error: Please provide path to WordPress XML export file')
    console.log('Usage: bun run scripts/migrate-wordpress.ts /path/to/export.xml')
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

  // Parse WordPress XML
  const posts = await parseWordPressXML(xmlFilePath)

  if (posts.length === 0) {
    console.log('⚠️  No posts found to migrate')
    return
  }

  // Confirm before proceeding
  console.log(`\n⚠️  About to import ${posts.length} posts to Convex`)
  console.log('⚠️  Images will be downloaded and uploaded to Cloudflare')
  console.log('\nPress Ctrl+C to cancel, or Enter to continue...')

  // Wait for user confirmation
  await new Promise((resolve) => {
    process.stdin.once('data', resolve)
  })

  // Import posts
  await importPosts(posts)

  console.log('\n✨ Migration complete!')
}

// Run migration
main().catch((error) => {
  console.error('❌ Migration failed:', error)
  process.exit(1)
})
