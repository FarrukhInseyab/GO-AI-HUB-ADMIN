import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, country?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (error) {
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          // Check if session is still valid
          if (session.expires_at && new Date(session.expires_at * 1000) <= new Date()) {
            await refreshSession();
            return;
          }
          
          await fetchUserProfile(session.user.id, session.user.email);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      } else if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      if (!userId) {
        return;
      }
      
      // Test connectivity first
      const connectivityPromise = supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(1);
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connectivity test timeout')), 5000)
      );
      
      const { error: testError } = await Promise.race([
        connectivityPromise,
        timeoutPromise
      ]) as any;
      
      if (testError) {
        return;
      }
      
      // Fetch user profile from users table
      const profilePromise = supabase
        .from('users')
        .select('id, user_id, email, contact_name, company_name, country, role, created_at, updated_at')
        .eq('user_id', userId)
        .single();
        
      const profileTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 8000)
      );
      
      const { data: profile, error } = await Promise.race([
        profilePromise,
        profileTimeoutPromise
      ]) as any;

      if (error) {
        // If profile doesn't exist, try to create it
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          await createMissingProfile(userId, userEmail);
          return;
        }
        return;
      }

      if (profile) {
        // Check if user is an Evaluator
        if (profile.role !== 'Evaluator') {
          // Sign out user if they're not an Evaluator
          await supabase.auth.signOut();
          throw new Error('Access denied. Only Evaluators can access this admin portal.');
        }

        const userData: User = {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          contact_name: profile.contact_name,
          company_name: profile.company_name,
          country: profile.country,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
        setUser(userData);
      } else {
        await createMissingProfile(userId, userEmail);
      }
    } catch (error) {
      // If it's an access denied error, re-throw it
      if (error instanceof Error && error.message.includes('Access denied')) {
        throw error;
      }
      // Silent error handling for other errors
    }
  };

  const createMissingProfile = async (userId: string, userEmail?: string) => {
    try {
      if (!userEmail) {
        return;
      }
      
      const profileData = {
        user_id: userId,
        email: userEmail,
        contact_name: userEmail.split('@')[0],
        company_name: 'GO AI HUB',
        country: 'Saudi Arabia', // Default country
        role: 'Evaluator' as const,
        created_at: new Date().toISOString()
      };
      
      const insertPromise = supabase
        .from('users')
        .insert([profileData])
        .select('id, user_id, email, contact_name, company_name, country, role, created_at, updated_at')
        .single();
        
      const insertTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
      );
      
      const { data: newProfile, error: insertError } = await Promise.race([
        insertPromise,
        insertTimeoutPromise
      ]) as any;
      
      if (!insertError && newProfile) {
        const userData: User = {
          id: newProfile.id,
          user_id: newProfile.user_id,
          email: newProfile.email,
          contact_name: newProfile.contact_name,
          company_name: newProfile.company_name,
          country: newProfile.country,
          role: newProfile.role,
          created_at: newProfile.created_at,
          updated_at: newProfile.updated_at
        };
        setUser(userData);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const refreshSession = async () => {
    try {
      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session refresh timeout')), 10000)
      );
      
      const { data: { session }, error } = await Promise.race([
        refreshPromise,
        timeoutPromise
      ]) as any;
      
      if (!error && session?.user) {
        await fetchUserProfile(session.user.id, session.user.email);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 15000)
      );
      
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        throw new Error('Invalid email or password');
      }

      if (data.user) {
        await fetchUserProfile(data.user.id, data.user.email);
      }
    } catch (error) {
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string, country: string = 'Saudi Arabia') => {
    try {
      const signupPromise = supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: 'Evaluator',
            country: country
          }
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timeout')), 15000)
      );
      
      const { data, error } = await Promise.race([
        signupPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        throw new Error(error.message);
      }

      if (data.user && data.session) {
        await fetchUserProfile(data.user.id, data.user.email);
      } else if (data.user && !data.session) {
        throw new Error('Please check your email to confirm your account');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      setUser(null);
    } catch (error) {
      // Even if logout fails, clear the user state
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};