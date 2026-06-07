import React, { createContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  isRestricted: boolean;
  profile: any | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);

  const clearAuthState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuspended(false);
    setIsRestricted(false);
  };

  const loadCachedData = (currentUser: User) => {
    try {
      const cachedProfileStr = sessionStorage.getItem(`profile_${currentUser.id}`);
      const cachedIsAdminStr = sessionStorage.getItem(`isAdmin_${currentUser.id}`);

      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        setProfile(cachedProfile);
        setIsSuspended(!!cachedProfile.is_suspended);
        setIsRestricted(!!cachedProfile.is_restricted);
      }
      if (cachedIsAdminStr) {
        setIsAdmin(JSON.parse(cachedIsAdminStr));
      }
    } catch (e) {
      console.error('Error parsing cached auth metadata:', e);
    }
  };

  const fetchProfileAndRole = async (currentUser: User) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
        supabase
          .rpc('has_role', { _user_id: currentUser.id, _role: 'admin' })
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setIsSuspended(!!profileRes.data.is_suspended);
        setIsRestricted(!!profileRes.data.is_restricted);
        sessionStorage.setItem(`profile_${currentUser.id}`, JSON.stringify(profileRes.data));
      } else {
        setProfile(null);
        setIsSuspended(false);
        setIsRestricted(false);
        sessionStorage.removeItem(`profile_${currentUser.id}`);
      }

      const isAdminRole = !!roleRes.data;
      setIsAdmin(isAdminRole);
      sessionStorage.setItem(`isAdmin_${currentUser.id}`, JSON.stringify(isAdminRole));
    } catch (err) {
      console.error('Error fetching auth metadata:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileAndRole(user);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Step 1: Get initial session immediately
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          loadCachedData(initialSession.user);
          // Mark loading done immediately - profile data loads in background
          setLoading(false);
          // Fetch fresh profile data in background
          fetchProfileAndRole(initialSession.user);
        } else {
          clearAuthState();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
        if (isMounted) {
          clearAuthState();
          setLoading(false);
        }
      }
    };

    initSession();

    // Step 2: Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      console.log('[Auth] Event:', event);

      if (!newSession || event === 'SIGNED_OUT') {
        clearAuthState();
        setLoading(false);
        return;
      }

      setSession(newSession);
      const newUser = newSession.user;
      setUser(newUser);

      if (newUser) {
        loadCachedData(newUser);
        setLoading(false);
        // Fetch fresh profile data in background
        fetchProfileAndRole(newUser);
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (user) {
      sessionStorage.removeItem(`profile_${user.id}`);
      sessionStorage.removeItem(`isAdmin_${user.id}`);
    }
    await supabase.auth.signOut();
    clearAuthState();
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        isSuspended,
        isRestricted,
        profile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
