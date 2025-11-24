/**
 * Authentication guard for admin routes
 * Checks if user is authenticated with Clerk
 * Simple approach: any authenticated user can manage posts
 *
 * Future enhancement: Add role-based permissions (Admin/Editor/Viewer)
 */
export async function requireAuth() {
  // In TanStack Start, Clerk auth is available via context
  // The actual implementation depends on how Clerk is integrated

  // For now, this is a placeholder that will be properly implemented
  // when we have access to the Clerk context in the router

  // TODO: Implement actual Clerk authentication check
  // Example:
  // if (!context.auth?.userId) {
  //   throw redirect({ to: '/sign-in', search: { redirect: context.location.href } })
  // }

  return true;
}

/**
 * Hook to get current user info
 * Can be used in components to display user name, avatar, etc.
 */
export function useCurrentUser() {
  // TODO: Implement Clerk useUser hook integration
  // For now, return a placeholder
  return {
    userId: 'user_123',
    name: 'Admin User',
    email: 'admin@onepercentseo.com',
  };
}
