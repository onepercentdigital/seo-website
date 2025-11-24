import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Admin dashboard/landing page
 * For MVP: Simple redirect to posts listing
 * Future: Dashboard with stats, recent activity, quick actions
 */
export const Route = createFileRoute('/admin/')({
  component: AdminIndex,
  beforeLoad: async () => {
    // Redirect to posts listing
    throw redirect({ to: '/admin/posts' });
  },
});

function AdminIndex() {
  // This component won't render due to redirect
  // But we include it for completeness
  return null;
}
