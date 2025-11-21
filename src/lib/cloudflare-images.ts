/**
 * Cloudflare Images API Integration
 *
 * Provides utilities for uploading, managing, and generating URLs for images
 * stored in Cloudflare Images CDN.
 *
 * All upload/delete functions run server-side only and use process.env for secrets.
 * getImageUrl() is client-safe and uses hardcoded account hash.
 *
 * @see https://developers.cloudflare.com/images/
 */

// Cloudflare account hash for public image delivery URLs (safe to hardcode)
const ACCOUNT_HASH = 'uIVQ6NXJhv6uJPgWapIyVQ';

/**
 * Image variant configuration for different use cases
 */
export const IMAGE_VARIANTS = {
  thumbnail: 'thumbnail', // 400px wide - blog index cards
  medium: 'medium', // 800px wide - inline blog content
  large: 'large', // 1200px wide - featured images
  og: 'og', // 1200x630 - Open Graph social sharing
  public: 'public', // Original/full size
} as const;

export type ImageVariant = keyof typeof IMAGE_VARIANTS;

/**
 * Response from Cloudflare Images API
 */
interface CloudflareImageResponse {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
}

/**
 * Upload an image file to Cloudflare Images
 *
 * @param file - File object (from file input or drag-and-drop)
 * @param metadata - Optional metadata for the image
 * @returns Promise resolving to the Cloudflare Image ID
 *
 * @example
 * const file = event.target.files[0];
 * const imageId = await uploadImage(file, { alt: 'Blog post hero image' });
 */
export async function uploadImage(
  file: File,
  metadata?: Record<string, string>,
): Promise<string> {
  // Server-side only: use process.env for secrets (TanStack Start best practice)
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;

  const formData = new FormData();
  formData.append('file', file);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  });

  const data: CloudflareImageResponse = await response.json();

  if (!data.success || !data.result) {
    const errorMessage = data.errors?.[0]?.message || 'Failed to upload image';
    throw new Error(`Cloudflare Images upload failed: ${errorMessage}`);
  }

  return data.result.id;
}

/**
 * Upload an image from a URL (useful for WordPress migration)
 *
 * Downloads the image from the provided URL and uploads it to Cloudflare Images
 *
 * @param url - URL of the image to download and upload
 * @param metadata - Optional metadata for the image
 * @returns Promise resolving to the Cloudflare Image ID
 *
 * @example
 * const imageId = await uploadImageFromUrl(
 *   'https://oldsite.com/wp-content/uploads/2024/image.jpg',
 *   { source: 'wordpress-migration' }
 * );
 */
export async function uploadImageFromUrl(
  url: string,
  metadata?: Record<string, string>,
): Promise<string> {
  // Server-side only: use process.env for secrets (TanStack Start best practice)
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;

  const formData = new FormData();
  formData.append('url', url);

  if (metadata) {
    formData.append('metadata', JSON.stringify(metadata));
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
    body: formData,
  });

  const data: CloudflareImageResponse = await response.json();

  if (!data.success || !data.result) {
    const errorMessage =
      data.errors?.[0]?.message || 'Failed to upload image from URL';
    throw new Error(`Cloudflare Images upload failed: ${errorMessage}`);
  }

  return data.result.id;
}

/**
 * Generate a Cloudflare Images URL for a given image ID and variant
 *
 * @param imageId - The Cloudflare Image ID
 * @param variant - The variant to use (thumbnail, medium, large, og, public)
 * @returns The full URL to the image variant
 *
 * @example
 * const url = getImageUrl(imageId, 'large');
 * // Returns: https://imagedelivery.net/{account_hash}/{imageId}/large
 */
export function getImageUrl(
  imageId: string,
  variant: ImageVariant = 'public',
): string {
  // Client-safe: uses hardcoded account hash (public delivery URL, not a secret)
  // This is safe to hardcode - it's only used for public image URLs
  return `https://imagedelivery.net/${ACCOUNT_HASH}/${imageId}/${IMAGE_VARIANTS[variant]}`;
}

/**
 * Delete an image from Cloudflare Images
 *
 * @param imageId - The Cloudflare Image ID to delete
 * @returns Promise resolving when the image is deleted
 *
 * @example
 * await deleteImage('abc123');
 */
export async function deleteImage(imageId: string): Promise<void> {
  // Server-side only: use process.env for secrets (TanStack Start best practice)
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`;

  const response = await fetch(`${apiUrl}/${imageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
  });

  const data: CloudflareImageResponse = await response.json();

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || 'Failed to delete image';
    throw new Error(`Cloudflare Images delete failed: ${errorMessage}`);
  }
}

/**
 * Configuration for Cloudflare Images variants
 *
 * Note: Variants must be configured in the Cloudflare Dashboard before use.
 * This function documents the required variant configuration but does not
 * automatically create them (variants must be created via Dashboard or API).
 *
 * Required variants:
 * - thumbnail: 400px width, fit=scale-down
 * - medium: 800px width, fit=scale-down
 * - large: 1200px width, fit=scale-down
 * - og: 1200x630px, fit=cover (for Open Graph images)
 *
 * @see https://developers.cloudflare.com/images/transform-images/transform-via-url/
 */
export function getVariantConfiguration() {
  return {
    thumbnail: {
      id: 'thumbnail',
      options: {
        width: 400,
        fit: 'scale-down',
      },
      description: 'Blog index cards and thumbnails',
    },
    medium: {
      id: 'medium',
      options: {
        width: 800,
        fit: 'scale-down',
      },
      description: 'Inline blog content images',
    },
    large: {
      id: 'large',
      options: {
        width: 1200,
        fit: 'scale-down',
      },
      description: 'Featured images and hero images',
    },
    og: {
      id: 'og',
      options: {
        width: 1200,
        height: 630,
        fit: 'cover',
      },
      description: 'Open Graph social sharing images',
    },
  };
}

/**
 * Generate responsive image srcset for different screen sizes
 *
 * @param imageId - The Cloudflare Image ID
 * @returns Object with src and srcSet for responsive images
 *
 * @example
 * const { src, srcSet } = getResponsiveImageUrls(imageId);
 * <img src={src} srcSet={srcSet} alt="..." />
 */
export function getResponsiveImageUrls(imageId: string) {
  return {
    src: getImageUrl(imageId, 'large'),
    srcSet: `
      ${getImageUrl(imageId, 'thumbnail')} 400w,
      ${getImageUrl(imageId, 'medium')} 800w,
      ${getImageUrl(imageId, 'large')} 1200w
    `.trim(),
  };
}
