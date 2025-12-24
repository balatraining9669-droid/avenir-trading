import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { User } from '../types';

interface AuthContextType {
  currentUser: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, role: 'admin' | 'buyer', additionalData?: Partial<User>) => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Initializing auth...');
    let mounted = true;

    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Initial session:', session?.user?.email || 'No user');
        
        if (!mounted) return;
        
        setCurrentUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User ID:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Init auth error:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state changed:', event, session?.user?.email || 'No user');
      
      if (!mounted) return;
      
      setCurrentUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 Fetching user profile for:', session.user.id);
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      console.log('📊 Fetching user profile for UID:', uid);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        
        // If user not found in users table, create a default profile
        if (error.code === 'PGRST116') {
          console.log('⚠️ User profile not found, needs to be created');
          // Don't throw, just set profile to null
          setUserProfile(null);
          return;
        }
        
        throw error;
      }
      
      console.log('✅ User profile loaded:', data);
      console.log('👤 Role:', data?.role);
      setUserProfile(data as User);
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
    console.log('✅ Sign in successful');
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    console.log('✅ Signed out successfully');
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: 'admin' | 'buyer',
    additionalData?: Partial<User>
  ) => {
    console.log('📝 Signing up user:', email, 'with role:', role);
    const siteUrl = (import.meta as any)?.env?.VITE_SITE_URL || window.location.origin;
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/`,
      },
    });

    if (authError) {
      console.error('❌ Sign up auth error:', authError);
      throw authError;
    }
    if (!authData.user) {
      console.error('❌ User creation failed - no user data returned');
      throw new Error('User creation failed');
    }

    console.log('✅ Auth user created:', authData.user.id);
    console.log('💾 Creating user profile in database...');

    // Create user profile in database
    const userProfile = {
      uid: authData.user.id,
      email: email,
      role: role,
      ...additionalData
    };

    const { data: insertedData, error: profileError } = await supabase
      .from('users')
      .insert([userProfile])
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      throw profileError;
    }

    console.log('✅ User profile created successfully:', insertedData);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signOut,
    signUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
