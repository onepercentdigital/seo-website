import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { BlogEditor } from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/admin/posts/$id/edit')({
  component: AdminEditPostPage,
});

function AdminEditPostPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const updatePostMutation = useConvexMutation(api.posts.update);
  const { mutate: updatePost, isPending } = useMutation({
    mutationFn: updatePostMutation,
    onSuccess: () => {
      navigate({ to: '/admin/posts' });
    },
    onError: (error: Error) => {
      alert(`Error updating post: ${error.message}`);
    },
  });

  // Fetch post data
  const { data: postData, isLoading } = useQuery(
    convexQuery(api.posts.getById, { id: id as Id<'posts'> }),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-3 font-bold text-2xl">Post Not Found</h2>
          <p className="mb-6 text-muted-foreground">
            The post you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate({ to: '/admin/posts' })}>
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  const { category, ...post } = postData;

  const handleSubmit = (data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    categoryId?: Id<'categories'>;
    status: 'draft' | 'published' | 'scheduled';
    scheduledFor?: number;
    seo: {
      metaTitle?: string;
      metaDescription?: string;
      ogImage?: string;
      noindex?: boolean;
    };
  }) => {
    updatePost({
      id: id as Id<'posts'>,
      ...data,
      authorId: post.authorId,
      authorName: post.authorName,
      relatedPostIds: post.relatedPostIds,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-border border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate({ to: '/admin/posts' })}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-bold text-2xl">Edit Post</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <BlogEditor
          initialData={{
            title: post.title,
            slug: post.slug,
            content: post.content,
            excerpt: post.excerpt,
            featuredImage: post.featuredImage,
            categoryId: post.categoryId,
            status: post.status,
            scheduledFor: post.scheduledFor,
            seo: post.seo,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isPending}
        />
      </div>
    </div>
  );
}
