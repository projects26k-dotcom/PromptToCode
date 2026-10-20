import { useEffect, useRef } from 'react';

/**
 * Custom hook to automatically sync Clerk user data to MongoDB upon sign-up or login.
 * Tracks the synced user ID to prevent redundant network calls during the session.
 */
export function useSyncUser(user, isSignedIn) {
  const syncedUserIdRef = useRef(null);

  useEffect(() => {
    if (!isSignedIn || !user || !user.id) {
      return;
    }

    // Skip if already synced for this user in this session
    if (syncedUserIdRef.current === user.id) {
      return;
    }

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      '';

    if (!email) {
      return;
    }

    syncedUserIdRef.current = user.id;

    async function syncToMongoDB() {
      try {
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerkId: user.id,
            email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            imageUrl: user.imageUrl || '',
            metadata: user.publicMetadata || {},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ User successfully synchronized with MongoDB:', data.user?.email);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('⚠️ User sync warning from backend:', errData.error || response.statusText);
          // Allow retry on error if needed
          syncedUserIdRef.current = null;
        }
      } catch (err) {
        console.warn('⚠️ Could not sync user to MongoDB backend:', err.message);
        syncedUserIdRef.current = null;
      }
    }

    syncToMongoDB();
  }, [user, isSignedIn]);
}
