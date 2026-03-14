import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

// Security: Map internal errors to user-friendly messages
const getSafeErrorMessage = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('invalid login credentials')) return 'Invalid email or password';
  if (message.includes('email not confirmed')) return 'Please verify your email before logging in';
  if (message.includes('user already registered')) return 'An account with this email already exists';
  if (message.includes('invalid email')) return 'Please enter a valid email address';
  if (message.includes('password')) return 'Password does not meet requirements';
  if (message.includes('rate limit') || message.includes('too many')) return 'Too many attempts. Please try again later';
  if (message.includes('network') || message.includes('fetch')) return 'Network error. Please check your connection';

  return 'An unexpected error occurred. Please try again';
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ success: boolean; needsVerification?: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<{ success: boolean; needsVerification?: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // For mobile apps, we don't need a redirect URL
        },
      });

      if (error) {
        return { success: false, error: getSafeErrorMessage(error) };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but needs to verify email
        return { success: true, needsVerification: true };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: getSafeErrorMessage(error) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      // Delete user data from all tables
      const userId = user.id;

      // Delete all user data from tables
      await supabase.from('tasks').delete().eq('user_id', userId);
      await supabase.from('task_lists').delete().eq('user_id', userId);
      await supabase.from('flashcards').delete().eq('user_id', userId);
      await supabase.from('flashcard_sets').delete().eq('user_id', userId);
      await supabase.from('user_stats').delete().eq('user_id', userId);

      // Sign out the user (this will trigger the auth state change)
      await supabase.auth.signOut();

      return { success: true };
    } catch (error: any) {
      if (__DEV__) console.error('Error deleting account:', error);
      return { success: false, error: getSafeErrorMessage(error) };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return { success: false, error: getSafeErrorMessage(error) };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: getSafeErrorMessage(error) };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      deleteAccount,
      resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
