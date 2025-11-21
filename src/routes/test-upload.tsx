import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getImageUrl,
  IMAGE_VARIANTS,
  type ImageVariant,
  uploadImage,
} from '@/lib/cloudflare-images';

// Server function to handle image upload (runs on server, not client)
const uploadImageServer = createServerFn({ method: 'POST' })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData');
    }

    const file = data.get('file');
    if (!file || !(file instanceof File)) {
      throw new Error('No file provided or invalid file type');
    }

    const alt = data.get('alt')?.toString() || 'Test upload';
    return { file, alt };
  })
  .handler(async ({ data }) => {
    const { file, alt } = data;
    const imageId = await uploadImage(file, { alt, source: 'test-route' });
    return { imageId };
  });

export const Route = createFileRoute('/test-upload')({
  component: TestUpload,
});

function TestUpload() {
  const [uploading, setUploading] = useState(false);
  const [imageId, setImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ImageVariant>('large');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setImageId(null);

    try {
      // Create FormData to send to server function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', 'Test upload');

      // Call server function
      const result = await uploadImageServer({ data: formData });
      setImageId(result.imageId);
      console.log('✅ Upload successful! Image ID:', result.imageId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Upload failed:', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-bold mb-8">Cloudflare Images Test Upload</h1>

      <div className="space-y-8">
        {/* Upload Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-semibold mb-4">Upload Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-accent file:text-accent-foreground
              hover:file:bg-accent/90
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && (
            <p className="mt-4 text-sm text-muted-foreground">
              Uploading to Cloudflare...
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Upload Error
            </h3>
            <pre className="text-sm text-destructive/90 whitespace-pre-wrap">
              {error}
            </pre>
          </div>
        )}

        {/* Success Display */}
        {imageId && (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-500 bg-green-500/10 p-6">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                Upload Successful! ✅
              </h3>
              <p className="text-sm font-mono text-foreground break-all">
                Image ID: {imageId}
              </p>
            </div>

            {/* Variant Selector */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold mb-4">
                Select Variant to Preview
              </h3>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(IMAGE_VARIANTS) as ImageVariant[]).map(
                  (variant) => (
                    <Button
                      key={variant}
                      onClick={() => setSelectedVariant(variant)}
                      variant={
                        selectedVariant === variant ? 'default' : 'outline'
                      }
                      size="sm"
                    >
                      {variant}
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Image Preview */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold mb-4">
                Preview: {selectedVariant} variant
              </h3>
              <div className="space-y-4">
                <img
                  src={getImageUrl(imageId, selectedVariant)}
                  alt="Uploaded to Cloudflare Images"
                  className="max-w-full h-auto rounded-lg border border-border"
                  onError={(e) => {
                    console.error(
                      'Image failed to load:',
                      getImageUrl(imageId, selectedVariant),
                    );
                    e.currentTarget.style.border = '2px solid red';
                  }}
                  onLoad={() => {
                    console.log(
                      '✅ Image loaded successfully:',
                      getImageUrl(imageId, selectedVariant),
                    );
                  }}
                />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Image URL:</p>
                  <code className="block p-2 bg-muted rounded text-xs break-all">
                    {getImageUrl(imageId, selectedVariant)}
                  </code>
                </div>
              </div>
            </div>

            {/* All Variants Preview */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold mb-4">All Variants</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.keys(IMAGE_VARIANTS) as ImageVariant[]).map(
                  (variant) => (
                    <div key={variant} className="space-y-2">
                      <h4 className="font-semibold text-sm uppercase tracking-wide">
                        {variant}
                      </h4>
                      <img
                        src={getImageUrl(imageId, variant)}
                        alt={`${variant} variant`}
                        className="w-full h-auto rounded border border-border"
                      />
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {getImageUrl(imageId, variant)}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
