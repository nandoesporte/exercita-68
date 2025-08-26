import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface CachedUserData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  cached_at: number;
}

export function useInstantProfile() {
  const { user } = useAuth();
  const [instantProfile, setInstantProfile] = useState<CachedUserData | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setInstantProfile(null);
      return;
    }

    // Try to get cached data from localStorage
    try {
      const cachedUserStr = localStorage.getItem('user_cache');
      if (cachedUserStr) {
        const cachedUser = JSON.parse(cachedUserStr);
        
        // Verify cache is for current user and not too old (24 hours)
        if (cachedUser.id === user.id && (Date.now() - cachedUser.cached_at) < 24 * 60 * 60 * 1000) {
          setInstantProfile(cachedUser);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading cached profile:', error);
      localStorage.removeItem('user_cache');
    }

    // If no valid cache, use basic user metadata as fallback
    const userMetadata = user.user_metadata;
    if (userMetadata?.first_name || userMetadata?.last_name) {
      setInstantProfile({
        id: user.id,
        first_name: userMetadata.first_name || null,
        last_name: userMetadata.last_name || null,
        avatar_url: null,
        cached_at: Date.now()
      });
    }
  }, [user]);

  return instantProfile;
}