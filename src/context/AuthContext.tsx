import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import emailService from '../utils/emailService';
import { generateToken } from '../utils/helpers';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConfirmed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, country?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);

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
        return;
      }
      
      // Set confirmation status
      setIsConfirmed(profile.email_confirmed || false);
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
      
      // Send confirmation email for new signups
      if (data.user && !data.session) {
        // Generate a confirmation token
        const confirmationToken = btoa(data.user.id + ':' + new Date().getTime());
        
        // Send confirmation email
        await emailService.sendSignupConfirmationEmail(
          data.user.email,
          data.user.user_metadata?.name || data.user.email.split('@')[0],
          confirmationToken
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
  try {
    setIsLoading(true);
    console.log('Initiating password reset for:', email.trim().toLowerCase());

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('contact_name')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (userError && !userError.message.includes('No rows found')) {
      console.error('Error fetching user data:', userError);
    }

    const resetToken = btoa(email.trim().toLowerCase() + ':' + new Date().getTime());

    const tokenData = {
      token: resetToken,
      expires: new Date().getTime() + 60 * 60 * 1000, // 1 hour
    };
    localStorage.setItem(
      'passwordResetToken:' + email.trim().toLowerCase(),
      JSON.stringify(tokenData)
    );

    try {
      const emailSent = await emailService.sendPasswordResetEmail(
        email.trim().toLowerCase(),
        userData?.contact_name || email.trim().toLowerCase().split('@')[0],
        resetToken
      );

      console.log('Password reset email sent:', emailSent);

      if (!emailSent) {
        throw new Error('Failed to send recovery email');
      }

      return; // Just return void as the function signature indicates
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      throw emailError;
    }
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};


  const resetPassword = async (password: string): Promise<void> => {
  try {
    setIsLoading(true);
    console.log('Attempting to reset password');

    // Get the token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
      throw new Error('Reset token is missing');
    }
    
    // Parse the token to get the email and timestamp
    try {
      const decodedToken = atob(token);
      const [email] = decodedToken.split(':');
      
      if (!email) {
        throw new Error('Invalid reset token format');
      }
      
      // Verify token from localStorage
      const storedTokenData = localStorage.getItem('passwordResetToken:' + email);
      if (!storedTokenData) {
        throw new Error('Reset token has expired or is invalid');
      }
      
      const { token: storedToken, expires } = JSON.parse(storedTokenData);
      
      if (storedToken !== token) {
        throw new Error('Invalid reset token');
      }
      
      if (expires < new Date().getTime()) {
        localStorage.removeItem('passwordResetToken:' + email);
        throw new Error('Reset token has expired');
      }
      
      // Update password directly using updateUser API
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        throw error;
      }
      
      // Clean up token
      localStorage.removeItem('passwordResetToken:' + email);
      
      console.log('Password reset successful');
      return;
    } catch (tokenError) {
      console.error('Token parsing error:', tokenError);
      throw new Error('Invalid or expired reset token');
    }
  } catch (error) {
    console.error('Password update error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};


  const signup = async (name: string, email: string, password: string, country: string = 'Saudi Arabia') => {
    try {
      console.log('Starting signup process for:', email);
      
      // Generate a confirmation token before signup
      const confirmationToken = generateToken();
      console.log('Generated confirmation token');
      
      const signupPromise = supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name,
            role: 'Evaluator',
            country
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
      
      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      console.log('User created successfully:', data.user.id);

      // Store the token in the database
      try {
        console.log('Storing token in database for user:', data.user.id);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email_confirmation_token: confirmationToken,
            confirmation_sent_at: new Date().toISOString()
          })
          .eq('user_id', data.user.id);
        
        if (updateError) {
          console.error('Error storing confirmation token:', updateError);
          throw updateError;
        } else {
          console.log('Confirmation token stored in database');
        }
      } catch (dbError) {
        console.error('Database error when storing token:', dbError);
        throw new Error('Failed to store confirmation token. Please try again.');
      }
      
      
      // Send confirmation email
      try {
        console.log('Attempting to send confirmation email to:', data.user.email);
        const emailSent = await emailService.sendSignupConfirmationEmail(
          data.user.email,
          name,
          confirmationToken
        );
        
        console.log('Signup confirmation email sent:', emailSent);
        
        if (!emailSent) {
          throw new Error('Failed to send confirmation email. Please try again.');
        } else {
          setSuccess('Please check your email to confirm your account');
          return;
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        throw new Error('Account created but failed to send confirmation email. Please contact support.');
      }
    } catch (error) {
      throw error;
    }
  };
  
  const confirmEmail = async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Confirming email with token:', token.substring(0, 5) + '...');
      
      
      if (!token) {
        throw new Error('Invalid confirmation token');
      }
      
      // Find user with this token
      console.log('Looking up user with token in database');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email_confirmation_token', token)
        .single();
      
      console.log('User lookup result:', userError ? 'Error' : 'Success', userData ? 'Data found' : 'No data');
      
      if (userError || !userData) {
        console.error('User lookup error or no data found:', userError);
        throw new Error('Invalid or expired confirmation token');
      }
      
      // Check if token is expired (24 hours)
      const confirmationSentAt = new Date(userData.confirmation_sent_at);
      const now = new Date();
      const hoursSinceConfirmationSent = (now.getTime() - confirmationSentAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceConfirmationSent > 24) {
        console.error('Token expired, hours since sent:', hoursSinceConfirmationSent);
        throw new Error('Confirmation token has expired. Please request a new one.');
      }
      
      // Update user as confirmed
      console.log('Updating user as confirmed, ID:', userData.id);
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email_confirmed: true,
          email_confirmation_token: null
        })
        .eq('id', userData.id);
      
      if (updateError) {
        console.error('Error updating user confirmation status:', updateError);
        throw new Error('Failed to confirm email. Please try again.');
      }
      
      console.log('Email confirmation successful');
      
      // If the user is already logged in, update their profile
      if (user && user.id === userData.id) {
        setIsConfirmed(true);
        setUser({
          ...user,
          email_confirmed: true
        } as User);
      }
      
      return;
    } catch (error) {
      console.error('Email confirmation error:', error);
      throw error;
    } finally {
      setIsLoading(false);
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
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isConfirmed: user?.email_confirmed || isConfirmed,
      login, 
      signup, 
      logout, 
      refreshSession, 
      forgotPassword, 
      resetPassword,
      confirmEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
};