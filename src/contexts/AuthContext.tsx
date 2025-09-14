import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastEventRef = useRef<{ event: string; userId: string | null; timestamp: number } | null>(null);

  const clearAllStorageData = () => {
    // Get all localStorage keys
    const localStorageKeys = Object.keys(localStorage);

    // Remove all Supabase-related keys
    localStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });

    // Get all sessionStorage keys
    const sessionStorageKeys = Object.keys(sessionStorage);

    // Remove all Supabase-related keys from sessionStorage
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clear any app-specific user data
    localStorage.removeItem('userName');

    console.log('All storage data cleared');
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Auth session error:', error.message);
          // Clear all local data and force logout
          clearAllStorageData();
          setUser(null);
        } else if (session?.user) {
          // Validate that the session is actually valid by checking expiry
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log('Session expired, clearing data');
            clearAllStorageData();
            setUser(null);
          } else {
            setUser(session.user);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Clear all data on any unexpected error
        clearAllStorageData();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentTime = Date.now();
        const userId = session?.user?.id ?? null;

        // Deduplicate events - ignore if same event for same user within 100ms
        if (lastEventRef.current) {
          const { event: lastEvent, userId: lastUserId, timestamp: lastTimestamp } = lastEventRef.current;
          if (event === lastEvent && userId === lastUserId && (currentTime - lastTimestamp) < 100) {
            return; // Skip duplicate event
          }
        }

        // Update last event reference
        lastEventRef.current = { event, userId, timestamp: currentTime };


        // Handle sign out events specifically
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // Handle cross-tab session sync
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for localStorage changes from other tabs
      // Supabase uses keys like 'sb-<project-id>-auth-token'
      if (e.key?.startsWith('sb-') && e.key.endsWith('-auth-token')) {
        if (e.newValue === null || e.newValue === 'null') {
          // Session was cleared in another tab
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signOut = async () => {
    try {
      // Always clear local state first to ensure UI updates immediately
      setUser(null);

      // Try to sign out from Supabase, but don't block on it
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (signOutError) {
        // If signOut fails (like 403 Forbidden), continue with cleanup
        console.log('Supabase signOut failed, continuing with local cleanup:', signOutError);
      }

      // Clear all local storage data regardless of Supabase result
      clearAllStorageData();

    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if everything fails, ensure user is logged out locally
      setUser(null);
      clearAllStorageData();
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};