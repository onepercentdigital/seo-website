import { useConvexMutation } from '@convex-dev/react-query';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { BlogEditor } from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/auth-guard';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/admin/posts/new')({
  component: AdminNewPostPage,
});

function AdminNewPostPage() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const createPostMutation = useConvexMutation(api.posts.create);
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: createPostMutation,
    onSuccess: () => {
      navigate({ to: '/admin/posts' });
    },
    onError: (error: Error) => {
      alert(`Error creating post: ${error.message}`);
    },
  });

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
    createPost({
      ...data,
      authorId: user.userId,
      authorName: user.name,
      relatedPostIds: undefined,
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
              <h1 className="font-bold text-2xl">Create New Post</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <BlogEditor onSubmit={handleSubmit} isSubmitting={isPending} />
      </div>
    </div>
  );
}
