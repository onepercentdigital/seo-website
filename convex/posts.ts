import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * List all posts with optional filters
 * Used by: Blog index, admin post listing
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal('draft'), v.literal('published'), v.literal('scheduled'))
    ),
    categoryId: v.optional(v.id('categories')),
    authorId: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let posts = await ctx.db.query('posts').collect()

    // Filter by status
    if (args.status) {
      posts = posts.filter((post) => post.status === args.status)
    }

    // Filter by category
    if (args.categoryId) {
      posts = posts.filter((post) => post.categoryId === args.categoryId)
    }

    // Filter by author
    if (args.authorId) {
      posts = posts.filter((post) => post.authorId === args.authorId)
    }

    // Search by title or excerpt
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      posts = posts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower)
      )
    }

    // Sort by most recently modified
    posts.sort((a, b) => b.modifiedAt - a.modifiedAt)

    return posts
  },
})

/**
 * Get a single post by slug for public viewing
 * Used by: Public blog post page
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (!post) {
      return null
    }

    // Get category if exists
    let category = null
    if (post.categoryId) {
      category = await ctx.db.get(post.categoryId)
    }

    return {
      ...post,
      category,
    }
  },
})

/**
 * Get a single post by ID for editing
 * Used by: Admin edit post page
 */
export const getById = query({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)

    if (!post) {
      return null
    }

    // Get category if exists
    let category = null
    if (post.categoryId) {
      category = await ctx.db.get(post.categoryId)
    }

    return {
      ...post,
      category,
    }
  },
})

/**
 * Create a new post
 * Used by: Admin create post page
 */
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    authorId: v.optional(v.string()),
    authorName: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('scheduled')
    ),
    scheduledFor: v.optional(v.number()),
    seo: v.object({
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noindex: v.optional(v.boolean()),
    }),
    relatedPostIds: v.optional(v.array(v.id('posts'))),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existingPost = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (existingPost) {
      throw new Error(`Post with slug "${args.slug}" already exists`)
    }

    const now = Date.now()

    const postId = await ctx.db.insert('posts', {
      title: args.title,
      slug: args.slug,
      content: args.content,
      excerpt: args.excerpt,
      featuredImage: args.featuredImage,
      categoryId: args.categoryId,
      authorId: args.authorId,
      authorName: args.authorName,
      status: args.status,
      publishedAt: args.status === 'published' ? now : undefined,
      scheduledFor: args.scheduledFor,
      modifiedAt: now,
      seo: args.seo,
      relatedPostIds: args.relatedPostIds,
    })

    return postId
  },
})

/**
 * Update an existing post
 * Used by: Admin edit post page
 */
export const update = mutation({
  args: {
    id: v.id('posts'),
    title: v.string(),
    slug: v.string(),
    content: v.string(),
    excerpt: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    categoryId: v.optional(v.id('categories')),
    authorId: v.optional(v.string()),
    authorName: v.string(),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('scheduled')
    ),
    scheduledFor: v.optional(v.number()),
    seo: v.object({
      metaTitle: v.optional(v.string()),
      metaDescription: v.optional(v.string()),
      ogImage: v.optional(v.string()),
      noindex: v.optional(v.boolean()),
    }),
    relatedPostIds: v.optional(v.array(v.id('posts'))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if post exists
    const existingPost = await ctx.db.get(id)
    if (!existingPost) {
      throw new Error('Post not found')
    }

    // Check if slug is being changed to one that already exists
    if (updates.slug !== existingPost.slug) {
      const postWithSlug = await ctx.db
        .query('posts')
        .withIndex('by_slug', (q) => q.eq('slug', updates.slug))
        .first()

      if (postWithSlug) {
        throw new Error(`Post with slug "${updates.slug}" already exists`)
      }
    }

    // If status changed to published, set publishedAt if not already set
    let publishedAt = existingPost.publishedAt
    if (updates.status === 'published' && !publishedAt) {
      publishedAt = Date.now()
    }

    await ctx.db.patch(id, {
      ...updates,
      publishedAt,
      modifiedAt: Date.now(),
    })

    return id
  },
})

/**
 * Delete a post
 * Used by: Admin post listing
 */
export const deletePost = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) {
      throw new Error('Post not found')
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

/**
 * Publish a draft post
 * Used by: Admin post listing quick action
 */
export const publish = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) {
      throw new Error('Post not found')
    }

    const now = Date.now()

    await ctx.db.patch(args.id, {
      status: 'published',
      publishedAt: post.publishedAt || now,
      modifiedAt: now,
    })

    return args.id
  },
})

/**
 * Update featured image for a post
 * Used by: WordPress migration scripts
 */
export const updateFeaturedImage = mutation({
  args: {
    id: v.id('posts'),
    featuredImage: v.string(),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.id)
    if (!post) {
      throw new Error('Post not found')
    }

    await ctx.db.patch(args.id, {
      featuredImage: args.featuredImage,
      modifiedAt: Date.now(),
    })

    return args.id
  },
})

/**
 * Get all published posts for sitemap generation
 * Used by: Sitemap generation script
 */
export const getPublishedForSitemap = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .collect()

    return posts.map((post) => ({
      slug: post.slug,
      modifiedAt: post.modifiedAt,
    }))
  },
})
