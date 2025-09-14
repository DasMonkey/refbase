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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          // Check if the error is related to invalid refresh token
          if (error.message.includes('Invalid Refresh Token') ||
              error.message.includes('Refresh Token Not Found')) {
            // Clear the local session data
            await supabase.auth.signOut();
            setUser(null);
          } else {
            console.error('Auth session error:', error);
          }
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Clear session on any unexpected error
        await supabase.auth.signOut();
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
      // Check if there's a current session first
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No session to sign out from, just clear local state
        setUser(null);
        return;
      }

      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        // Handle specific auth errors gracefully
        if (error.message.includes('Auth session missing') ||
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('Refresh Token Not Found')) {
          // Session already cleared, just update local state
          setUser(null);
        } else {
          console.error('Error signing out:', error);
        }
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if sign out fails, clear local state
      setUser(null);
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