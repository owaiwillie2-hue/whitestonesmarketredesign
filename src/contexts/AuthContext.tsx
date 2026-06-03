import React, { createContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
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
  const [profile, setProfile] = useState<any | null>(null);

  const loadCachedData = (currentUser: User) => {
    try {
      const cachedProfileStr = sessionStorage.getItem(`profile_${currentUser.id}`);
      const cachedIsAdminStr = sessionStorage.getItem(`isAdmin_${currentUser.id}`);

      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        setProfile(cachedProfile);
        setIsSuspended(!!cachedProfile.is_suspended);
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
        sessionStorage.setItem(`profile_${currentUser.id}`, JSON.stringify(profileRes.data));
      } else {
        setProfile(null);
        setIsSuspended(false);
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
    // Immediate session check on mount to prevent any delay/hanging in onAuthStateChange
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        const newUser = initialSession?.user ?? null;
        setUser(newUser);
        if (newUser) {
          loadCachedData(newUser);
          // If we have cached profile data, we can mark loading as complete immediately
          if (sessionStorage.getItem(`profile_${newUser.id}`)) {
            setLoading(false);
          }
          await fetchProfileAndRole(newUser);
        }
      } catch (err) {
        console.error('Error fetching initial session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      
      if (newUser) {
        loadCachedData(newUser);
        if (sessionStorage.getItem(`profile_${newUser.id}`)) {
          setLoading(false);
        }
        await fetchProfileAndRole(newUser);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsSuspended(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    setLoading(true);
    if (user) {
      sessionStorage.removeItem(`profile_${user.id}`);
      sessionStorage.removeItem(`isAdmin_${user.id}`);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuspended(false);
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
        profile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
