import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

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
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User created but needs to verify email
        return { success: true, needsVerification: true };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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

      // Delete gallery images (and their storage files)
      const { data: galleryImages } = await supabase
        .from('gallery_images')
        .select('image_url')
        .eq('user_id', userId);

      if (galleryImages) {
        for (const img of galleryImages) {
          if (img.image_url) {
            const urlParts = img.image_url.split('/user-images/');
            if (urlParts.length >= 2) {
              await supabase.storage.from('user-images').remove([urlParts[1]]);
            }
          }
        }
      }

      // Delete all user data from tables
      await supabase.from('gallery_images').delete().eq('user_id', userId);
      await supabase.from('timer_sessions').delete().eq('user_id', userId);
      await supabase.from('tasks').delete().eq('user_id', userId);
      await supabase.from('task_lists').delete().eq('user_id', userId);
      await supabase.from('flashcards').delete().eq('user_id', userId);
      await supabase.from('flashcard_sets').delete().eq('user_id', userId);
      await supabase.from('user_stats').delete().eq('user_id', userId);

      // Delete user's storage folder
      const { data: storageFiles } = await supabase.storage
        .from('user-images')
        .list(userId);

      if (storageFiles && storageFiles.length > 0) {
        const filesToDelete = storageFiles.map(file => `${userId}/${file.name}`);
        await supabase.storage.from('user-images').remove(filesToDelete);
      }

      // Sign out the user (this will trigger the auth state change)
      await supabase.auth.signOut();

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting account:', error);
      return { success: false, error: error.message };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
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
