import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import emailService, { sendPasswordResetEmail } from '../utils/emailService';
// import { generateToken } from '../utils/helpers';
import { validateToken } from '../utils/security';

import { createClient } from '@supabase/supabase-js';
import { generateToken } from '../utils/helpers';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SERVICE_ROLE_KEY;

// ✅ Client for public operations
export const supabasesAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

 type LoginResult = {
  user: any; // you can replace `any` with `User` if you have the User type
  email_confirmed: boolean;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConfirmed: boolean;
  login: (email: string, password: string) => Promise<LoginResult >;
  signup: (name: string, email: string, password: string, country?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token:string,password: string) => Promise<boolean>;
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
  const hasRunRef = useRef(false);

   useEffect(() => {
    const run = async () => {
      const token = new URLSearchParams(window.location.search).get('token');

      if (!token || hasRunRef.current) return;
      hasRunRef.current = true; // guard to prevent reruns

      try {
        await confirmEmail(token);
      } catch (err) {
        console.error('Confirmation error:', err);
      }
    };

    run();
  }, []);

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
        .select('id, user_id, email, contact_name, company_name, country, role, created_at, updated_at,email_confirmed')
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
          updated_at: profile.updated_at,
          email_confirmed:profile.email_confirmed
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
        .select('id, user_id, email, contact_name, company_name, country, role, created_at, updated_at,email_confirmed')
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
          updated_at: newProfile.updated_at,
          email_confirmed:newProfile.email_confirmed
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



const login = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  try {
    debugger;
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

    if (!data?.user) {
      // If user is missing, explicitly throw error
      throw new Error('No user returned from login');
    }

    let email_confirmed = false;

    const { data: userData } = await supabase
      .from('users')
      .select('email_confirmed')
      .eq('user_id', data.user.id)
      .single();

    email_confirmed = userData?.email_confirmed ?? false;

    await fetchUserProfile(data.user.id, data.user.email);

    if (!data.session) {
      const confirmationToken = btoa(data.user.id + ':' + new Date().getTime());

      await emailService.sendSignupConfirmationEmail(
        data.user.email,
        data.user.user_metadata?.name || data.user.email.split('@')[0],
        confirmationToken
      );
    }

    return {
      user: data.user,
      email_confirmed
    };

  } catch (error) {
    // Still propagate error for caller to handle
    throw error;
  }
};






  const forgotPassword = async (email: string): Promise<boolean> => {
  try {
    setIsLoading(true);
    if (!email) {
      throw new Error('Email is required');
    }

    debugger;
    
    const sanitizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, contact_name')
      .eq('email', sanitizedEmail)
      .single();
      
    if (userError || !userData) {
      console.error('User not found for password reset:', userError);
      // Don't reveal if user exists or not for security
      return true;
    }
    
    // Generate reset token
    const resetToken = generateToken();
    
    // Store token in database
    const { data, error } = await supabase
        .from('users')
        .update({
          email_confirmation_token: resetToken,
          confirmation_sent_at: new Date().toISOString()
        })
        .eq('email', sanitizedEmail)
        .select();

    console.log("UPDATE ERROR:", error);
    console.log("UPDATE RESULT:", data);
      
    if (!data) {
      console.error('Error updating user with reset token:', data);
      throw new Error('Failed to process password reset request');
    }
    
    // Send password reset email
    await sendPasswordResetEmail(
      sanitizedEmail, 
      userData.contact_name || 'User', 
      resetToken
    );
    
    return true;
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    setIsLoading(false)
    throw error;
  }finally{
    setIsLoading(false)
  }
};



const resetPassword = async function resetPassword(token: string,newPassword: string): Promise<boolean> {
  debugger;
  try {
    setIsLoading(true);
    // console.log('Attempting to reset password');

    // // Get the token from URL
    // const urlParams = new URLSearchParams(window.location.search);
    // const token = urlParams.get('token');


    if (!token || !newPassword) {
      throw new Error("Token and new password are required");
    }

    // if (!validateToken(token)) {
    //   throw new Error("Invalid token format");
    // }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    console.log("🔐 Attempting to reset password with token:", token.substring(0, 5) + "...");

    // 1️⃣ Validate token in custom users table
    const { data: user, error: tokenError } = await supabase
      .from("users")
      .select("*")
      .eq("email_confirmation_token", token.trim())
      .maybeSingle();

    if (tokenError || !user) {
      console.error("❌ Token validation failed:", tokenError);
      throw new Error("Invalid or expired token");
    }

    console.log("✅ Token found for user:", user.email);

    // Check token expiry (24 hours)
    const tokenDate = new Date(user.confirmation_sent_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.error("⏳ Token expired. Hours since creation:", hoursDiff);
      throw new Error("Token has expired. Please request a new password reset.");
    }

    console.log("✅ Token is valid and not expired");

    // 2️⃣ Fetch Supabase Auth user by email
    const { data: authUsersData, error: authError } = await supabasesAdmin.auth.admin.listUsers({
      email: user.email
    });

    if (authError) {
      console.error("❌ Error fetching auth user by email:", authError);
      throw new Error("Failed to find user in Supabase Auth");
    }

    if (!authUsersData?.users?.length) {
      console.error("❌ No Supabase Auth user found for email:", user.email);
      throw new Error("User not found in Supabase Auth");
    }

    const authUser = authUsersData.users[0];
    console.log("✅ Supabase Auth user found. ID:", authUser.id);

    // 3️⃣ Update password in Supabase Auth
    const { error: adminError } = await supabasesAdmin.auth.admin.updateUserById(authUser.id, {
      password: newPassword
    });

    if (adminError) {
      console.error("❌ Admin API error updating password:", adminError);
      throw new Error("Failed to update password");
    }

    console.log("✅ Password updated successfully in Supabase Auth");

    // 4️⃣ Clear token in custom users table
    const { error: clearTokenError } = await supabase
      .from("users")
      .update({ email_confirmation_token: null, confirmation_sent_at: null })
      .eq("id", user.id);

    if (clearTokenError) {
      console.error("⚠️ Error clearing token:", clearTokenError);
      // Don’t throw here; password was already updated
    }

    console.log("🎉 Password reset flow completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    setIsLoading(false)
    throw error;
  }finally{
    setIsLoading(false)
  }
}






//   const resetPassword = async (password: string): Promise<void> => {
//   try {
//     setIsLoading(true);
//     console.log('Attempting to reset password');

//     // Get the token from URL
//     const urlParams = new URLSearchParams(window.location.search);
//     const token = urlParams.get('token');
    
//     if (!token) {
//       throw new Error('Reset token is missing');
//     }
    
//     // Parse the token to get the email and timestamp
//     try {
//       const decodedToken = atob(token);
//       const [email] = decodedToken.split(':');
      
//       if (!email) {
//         throw new Error('Invalid reset token format');
//       }
      
//       // Verify token from localStorage
//       const storedTokenData = localStorage.getItem('passwordResetToken:' + email);
//       if (!storedTokenData) {
//         throw new Error('Reset token has expired or is invalid');
//       }
      
//       const { token: storedToken, expires } = JSON.parse(storedTokenData);
      
//       if (storedToken !== token) {
//         throw new Error('Invalid reset token');
//       }
      
//       if (expires < new Date().getTime()) {
//         localStorage.removeItem('passwordResetToken:' + email);
//         throw new Error('Reset token has expired');
//       }
      
//       // Update password directly using updateUser API
//       const { error } = await supabase.auth.updateUser({
//         password: password
//       });

//       if (error) {
//         console.error('Password update error:', error);
//         throw error;
//       }
      
//       // Clean up token
//       localStorage.removeItem('passwordResetToken:' + email);
      
//       console.log('Password reset successful');
//       return;
//     } catch (tokenError) {
//       console.error('Token parsing error:', tokenError);
//       throw new Error('Invalid or expired reset token');
//     }
//   } catch (error) {
//     console.error('Password update error:', error);
//     throw error;
//   } finally {
//     setIsLoading(false);
//   }
// };


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
          console.warn('Please check your email to confirm your account');
          setIsConfirmed(true);
          
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
    debugger;
    setIsLoading(true);
    console.log('Confirming email with token:', token?.substring(0, 5) + '...');

    if (!token || token.trim() === '') {
      console.error('No token provided');
      throw new Error('Invalid confirmation token');
    }

    // Step 1: Check if token exists
    console.log('Looking up user with token in database');

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email_confirmation_token', token.trim());

    if (userError || !users || users.length === 0) {
      console.error('User lookup error or no data found:', userError);
      throw new Error('Invalid or expired confirmation token');
    }

    const userData = users[0];

    console.log('User found for token:', userData.email);

    // Step 2: Check if already confirmed
    if (userData.email_confirmed) {
      console.warn('User already confirmed');
      setIsConfirmed(true);
      return;
    }

    // Step 3: Check if token expired (older than 24 hours)
    const confirmationSentAt = new Date(userData.confirmation_sent_at);
    const now = new Date();
    const hoursSinceSent = (now.getTime() - confirmationSentAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSent > 24) {
      console.error('Token expired, hours since sent:', hoursSinceSent);
      throw new Error('Confirmation token has expired. Please request a new one.');
    }

    // Step 4: Update user as confirmed
    console.log('Updating user confirmation status...');
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
    setIsConfirmed(true);

    // Step 5: Optional – Clean up the URL to remove the token
    window.history.replaceState({}, document.title, '/');

  } catch (error) {
    console.error('Email confirmation error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  
  // const confirmEmail = async (token: string): Promise<void> => {
  //   try {
  //     debugger;
  //     setIsLoading(true);
  //     console.log('Confirming email with token:', token.substring(0, 5) + '...');
     
     
  //     if (!token) {
  //       throw new Error('Invalid confirmation token');
  //     }
     
  //     // Find user with this token
  //     console.log('Looking up user with token in database');
     
  //     // First check if token exists at all
  //     const { count, error: countError } = await supabase
  //       .from('users')
  //       .select('*', { count: 'exact', head: true })
  //       .eq('email_confirmation_token', token);
       
  //     console.log('Token exists in database?', countError ? `Error: ${countError.message}` : `Count: ${count}`);
     
  //     if (countError) {
  //       console.error('Error checking token existence:', countError);
  //     }
     
  //     // Now get the actual user data
  //     const { data: userData, error: userError } = await supabase
  //       .from('users')
  //       .select('*')
  //       .eq('email_confirmation_token', token.trim())
  //       .single();
     
  //     console.log('User lookup result:', userError ? `Error: ${userError.message}` : 'Success', userData ? `Data found for: ${userData.email}` : 'No data');
     
  //     if (userError || !userData) {
  //       console.error('User lookup error or no data found:', userError);
  //       throw new Error('Invalid or expired confirmation token');
  //     }
     
  //     // Check if token is expired (24 hours)
  //     const confirmationSentAt = new Date(userData.confirmation_sent_at);
  //     const now = new Date();
  //     const hoursSinceConfirmationSent = confirmationSentAt ? (now.getTime() - confirmationSentAt.getTime()) / (1000 * 60 * 60) : 0;
     
  //     if (hoursSinceConfirmationSent > 24) {
  //       console.error('Token expired, hours since sent:', hoursSinceConfirmationSent);
  //       throw new Error('Confirmation token has expired. Please request a new one.');
  //     }
     
  //     // Update user as confirmed
  //     console.log('Updating user as confirmed, ID:', userData.id);
  //     const { error: updateError } = await supabase
  //         .from('users')
  //         .update({
  //           email_confirmed: true,
  //           email_confirmation_token: null
  //         })
  //         .eq('id', userData.id);
     
  //     if (updateError) {
  //       console.error('Error updating user confirmation status:', updateError);
  //       throw new Error('Failed to confirm email. Please try again.');
  //     }
     
  //     console.log('Email confirmation successful, setting isConfirmed to true');
     
  //     setIsConfirmed(true);
     
  //     return;
  //   } catch (error) {
  //     console.error('Email confirmation error:', error);
  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const logout = async () => {
    try {
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      );
      
      await Promise.race([logoutPromise, timeoutPromise]);
      setUser(null);
      setIsConfirmed(false);
    } catch (error) {
      // Even if logout fails, clear the user state
      setUser(null);
      setIsConfirmed(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isConfirmed,
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