import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

/**
 * List all categories
 * Used by: Blog editor category selector, blog index filtering
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()

    // Sort alphabetically by name
    categories.sort((a, b) => a.name.localeCompare(b.name))

    return categories
  },
})

/**
 * Get a single category by slug
 * Used by: Blog category archive pages (future feature)
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    return category || null
  },
})

/**
 * Create a new category
 * Used by: Admin category management
 */
export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existingCategory = await ctx.db
      .query('categories')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (existingCategory) {
      throw new Error(`Category with slug "${args.slug}" already exists`)
    }

    const categoryId = await ctx.db.insert('categories', {
      name: args.name,
      slug: args.slug,
      description: args.description,
    })

    return categoryId
  },
})

/**
 * Update an existing category
 * Used by: Admin category management
 */
export const update = mutation({
  args: {
    id: v.id('categories'),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if category exists
    const existingCategory = await ctx.db.get(id)
    if (!existingCategory) {
      throw new Error('Category not found')
    }

    // Check if slug is being changed to one that already exists
    if (updates.slug !== existingCategory.slug) {
      const categoryWithSlug = await ctx.db
        .query('categories')
        .withIndex('by_slug', (q) => q.eq('slug', updates.slug))
        .first()

      if (categoryWithSlug) {
        throw new Error(`Category with slug "${args.slug}" already exists`)
      }
    }

    await ctx.db.patch(id, updates)

    return id
  },
})

/**
 * Delete a category
 * Used by: Admin category management
 */
export const deleteCategory = mutation({
  args: { id: v.id('categories') },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id)
    if (!category) {
      throw new Error('Category not found')
    }

    // Check if any posts are using this category
    const postsWithCategory = await ctx.db
      .query('posts')
      .withIndex('by_category', (q) => q.eq('categoryId', args.id))
      .collect()

    if (postsWithCategory.length > 0) {
      throw new Error(
        `Cannot delete category "${category.name}" because ${postsWithCategory.length} post(s) are using it`
      )
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})
