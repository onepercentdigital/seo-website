import { convexQuery, useConvexMutation } from '@convex-dev/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileEdit,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export const Route = createFileRoute('/admin/posts/')({
  component: AdminPostsListPage,
});

type PostStatus = 'draft' | 'published' | 'scheduled' | 'all';

function AdminPostsListPage() {
  const [statusFilter, setStatusFilter] = useState<PostStatus>('all');
  const queryClient = useQueryClient();

  // Fetch posts based on filter
  const { data: posts, isLoading } = useQuery(
    convexQuery(
      api.posts.list,
      statusFilter === 'all' ? {} : { status: statusFilter },
    ),
  );

  // Delete mutation
  const deletePostMutation = useConvexMutation(api.posts.deletePost);
  const { mutate: deletePost } = useMutation({
    mutationFn: deletePostMutation,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  // Publish mutation
  const publishPostMutation = useConvexMutation(api.posts.publish);
  const { mutate: publishPost } = useMutation({
    mutationFn: publishPostMutation,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const handleDelete = (id: Id<'posts'>, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deletePost({ id });
    }
  };

  const handlePublish = (id: Id<'posts'>) => {
    publishPost({ id });
  };

  // Count posts by status
  const allPosts = posts || [];
  const draftCount = allPosts.filter((p) => p.status === 'draft').length;
  const publishedCount = allPosts.filter(
    (p) => p.status === 'published',
  ).length;
  const scheduledCount = allPosts.filter(
    (p) => p.status === 'scheduled',
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-border border-b bg-card">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1 font-bold text-3xl">Blog Posts</h1>
              <p className="text-muted-foreground text-sm">
                Manage your blog content
              </p>
            </div>
            <Link to="/admin/posts/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Post
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="border-border border-b bg-card">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1">
            <FilterTab
              active={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              label="All Posts"
              count={allPosts.length}
            />
            <FilterTab
              active={statusFilter === 'published'}
              onClick={() => setStatusFilter('published')}
              label="Published"
              count={publishedCount}
            />
            <FilterTab
              active={statusFilter === 'draft'}
              onClick={() => setStatusFilter('draft')}
              label="Drafts"
              count={draftCount}
            />
            <FilterTab
              active={statusFilter === 'scheduled'}
              onClick={() => setStatusFilter('scheduled')}
              label="Scheduled"
              count={scheduledCount}
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          </div>
        ) : !posts || posts.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 inline-flex rounded-full bg-accent/10 p-4">
                <FileText className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mb-3 font-bold text-2xl">No Posts Yet</h2>
              <p className="mb-6 text-muted-foreground">
                Get started by creating your first blog post.
              </p>
              <Link to="/admin/posts/new">
                <Button size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Post
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostRow
                key={post._id}
                post={post}
                onDelete={handleDelete}
                onPublish={handlePublish}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Filter Tab Component
 */
interface FilterTabProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

function FilterTab({ active, onClick, label, count }: FilterTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-3 font-medium text-sm transition-colors ${
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label} ({count})
    </button>
  );
}

/**
 * Post Row Component
 */
interface PostRowProps {
  post: {
    _id: Id<'posts'>;
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'scheduled';
    authorName: string;
    modifiedAt: number;
    publishedAt?: number;
  };
  onDelete: (id: Id<'posts'>, title: string) => void;
  onPublish: (id: Id<'posts'>) => void;
}

function PostRow({ post, onDelete, onPublish }: PostRowProps) {
  const date = post.publishedAt || post.modifiedAt;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {post.status === 'published' && (
          <div className="rounded-full bg-green-500/10 p-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        )}
        {post.status === 'draft' && (
          <div className="rounded-full bg-yellow-500/10 p-2">
            <FileEdit className="h-5 w-5 text-yellow-500" />
          </div>
        )}
        {post.status === 'scheduled' && (
          <div className="rounded-full bg-blue-500/10 p-2">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 font-semibold text-foreground text-lg">
          {post.title}
        </h3>
        <div className="flex items-center gap-4 text-muted-foreground text-sm">
          <span>{post.authorName}</span>
          <span>•</span>
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="capitalize">{post.status}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {post.status === 'published' && (
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </a>
        )}
        {post.status === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onPublish(post._id)}
          >
            <CheckCircle className="h-4 w-4" />
            Publish
          </Button>
        )}
        <a href={`/admin/posts/${post._id}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </a>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
          onClick={() => onDelete(post._id, post.title)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
