import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchUserStats,
  upsertUserStats,
  saveTimerSession,
  fetchGalleryImages,
  saveGalleryImage,
  deleteGalleryImage,
  uploadImage,
} from '../lib/database';

interface Stats {
  totalFocusTime: number;
  totalBreakTime: number;
  focusSessions: number;
  breakSessions: number;
  cardsCreated: number;
  cardsLearned: number;
  quizzesTaken: number;
  quizzesPassed: number;
  tasksCreated: number;
  tasksCompleted: number;
}

interface Settings {
  defaultFocusTime: number;
  defaultBreakTime: number;
  notifications: boolean;
  soundEffects: boolean;
}

interface GalleryImage {
  id: string;
  image_url: string;
}

interface StatsContextType {
  stats: Stats;
  settings: Settings;
  gallery: GalleryImage[];
  loading: boolean;
  galleryLoading: boolean;
  addFocusTime: (seconds: number) => void;
  addBreakTime: (seconds: number) => void;
  incrementFocusSessions: () => void;
  incrementBreakSessions: () => void;
  incrementCardsCreated: (count?: number) => void;
  incrementCardsLearned: (count?: number) => void;
  incrementQuizzesTaken: () => void;
  incrementQuizzesPassed: () => void;
  incrementTasksCreated: (count?: number) => void;
  incrementTasksCompleted: (count?: number) => void;
  addToGallery: (imageUri: string) => Promise<void>;
  removeFromGallery: (imageId: string, imageUrl: string) => Promise<void>;
  clearGallery: () => void;
  updateSettings: (newSettings: Partial<Settings>) => void;
  saveSession: (durationSeconds: number) => Promise<void>;
}

const defaultStats: Stats = {
  totalFocusTime: 0,
  totalBreakTime: 0,
  focusSessions: 0,
  breakSessions: 0,
  cardsCreated: 0,
  cardsLearned: 0,
  quizzesTaken: 0,
  quizzesPassed: 0,
  tasksCreated: 0,
  tasksCompleted: 0,
};

const defaultSettings: Settings = {
  defaultFocusTime: 1500,
  defaultBreakTime: 300,
  notifications: true,
  soundEffects: true,
};

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Load stats from Supabase when user logs in
  useEffect(() => {
    const loadStats = async () => {
      if (!user) {
        setStats(defaultStats);
        setGallery([]);
        setLoading(false);
        setGalleryLoading(false);
        return;
      }

      try {
        setLoading(true);
        setGalleryLoading(true);

        // Load stats
        const data = await fetchUserStats(user.id);
        if (data) {
          setStats({
            totalFocusTime: data.total_study_time || 0,
            totalBreakTime: data.total_break_time || 0,
            focusSessions: data.focus_sessions || 0,
            breakSessions: data.break_sessions || 0,
            cardsCreated: data.cards_created || 0,
            cardsLearned: data.cards_studied || 0,
            quizzesTaken: data.quizzes_taken || 0,
            quizzesPassed: data.quizzes_passed || 0,
            tasksCreated: data.tasks_created || 0,
            tasksCompleted: data.tasks_completed || 0,
          });
          // Load settings
          setSettings(prev => ({
            ...prev,
            defaultFocusTime: data.default_focus_time || 1500,
            defaultBreakTime: data.default_break_time || 300,
          }));
        }

        // Load gallery
        const galleryData = await fetchGalleryImages(user.id);
        setGallery(galleryData || []);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
        setGalleryLoading(false);
      }
    };

    loadStats();
  }, [user]);

  // Sync stats to Supabase
  const syncStats = async (newStats: Stats) => {
    if (!user) return;

    try {
      await upsertUserStats(user.id, {
        total_study_time: newStats.totalFocusTime,
        total_break_time: newStats.totalBreakTime,
        focus_sessions: newStats.focusSessions,
        break_sessions: newStats.breakSessions,
        tasks_created: newStats.tasksCreated,
        tasks_completed: newStats.tasksCompleted,
        cards_created: newStats.cardsCreated,
        cards_studied: newStats.cardsLearned,
        quizzes_taken: newStats.quizzesTaken,
        quizzes_passed: newStats.quizzesPassed,
      });
    } catch (error) {
      console.error('Error syncing stats:', error);
    }
  };

  const addFocusTime = (seconds: number) => {
    setStats(prev => {
      const newStats = { ...prev, totalFocusTime: prev.totalFocusTime + seconds };
      syncStats(newStats);
      return newStats;
    });
  };

  const addBreakTime = (seconds: number) => {
    setStats(prev => {
      const newStats = { ...prev, totalBreakTime: prev.totalBreakTime + seconds };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementFocusSessions = () => {
    setStats(prev => {
      const newStats = { ...prev, focusSessions: prev.focusSessions + 1 };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementBreakSessions = () => {
    setStats(prev => {
      const newStats = { ...prev, breakSessions: prev.breakSessions + 1 };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementCardsCreated = (count = 1) => {
    setStats(prev => {
      const newStats = { ...prev, cardsCreated: prev.cardsCreated + count };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementCardsLearned = (count = 1) => {
    setStats(prev => {
      const newStats = { ...prev, cardsLearned: prev.cardsLearned + count };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementQuizzesTaken = () => {
    setStats(prev => {
      const newStats = { ...prev, quizzesTaken: prev.quizzesTaken + 1 };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementQuizzesPassed = () => {
    setStats(prev => {
      const newStats = { ...prev, quizzesPassed: prev.quizzesPassed + 1 };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementTasksCreated = (count = 1) => {
    setStats(prev => {
      const newStats = { ...prev, tasksCreated: prev.tasksCreated + count };
      syncStats(newStats);
      return newStats;
    });
  };

  const incrementTasksCompleted = (count = 1) => {
    setStats(prev => {
      const newStats = { ...prev, tasksCompleted: prev.tasksCompleted + count };
      syncStats(newStats);
      return newStats;
    });
  };

  const saveSession = async (durationSeconds: number) => {
    if (!user) return;

    try {
      await saveTimerSession(user.id, durationSeconds);
    } catch (error) {
      console.error('Error saving timer session:', error);
    }
  };

  const addToGallery = async (imageUri: string) => {
    if (!user) return;

    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadImage(user.id, imageUri, 'gallery');
      if (!imageUrl) {
        console.error('Failed to upload image');
        return;
      }

      // Save to database
      const savedImage = await saveGalleryImage(user.id, imageUrl);
      setGallery(prev => [savedImage, ...prev]);
    } catch (error) {
      console.error('Error adding to gallery:', error);
    }
  };

  const removeFromGallery = async (imageId: string, imageUrl: string) => {
    try {
      await deleteGalleryImage(imageId, imageUrl);
      setGallery(prev => prev.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Error removing from gallery:', error);
    }
  };

  const clearGallery = () => {
    setGallery([]);
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    // Sync timer settings to database
    if (user && (newSettings.defaultFocusTime !== undefined || newSettings.defaultBreakTime !== undefined)) {
      try {
        const dbUpdate: { default_focus_time?: number; default_break_time?: number } = {};
        if (newSettings.defaultFocusTime !== undefined) {
          dbUpdate.default_focus_time = newSettings.defaultFocusTime;
        }
        if (newSettings.defaultBreakTime !== undefined) {
          dbUpdate.default_break_time = newSettings.defaultBreakTime;
        }
        await upsertUserStats(user.id, dbUpdate);
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  };

  return (
    <StatsContext.Provider value={{
      stats,
      settings,
      gallery,
      loading,
      galleryLoading,
      addFocusTime,
      addBreakTime,
      incrementFocusSessions,
      incrementBreakSessions,
      incrementCardsCreated,
      incrementCardsLearned,
      incrementQuizzesTaken,
      incrementQuizzesPassed,
      incrementTasksCreated,
      incrementTasksCompleted,
      addToGallery,
      removeFromGallery,
      clearGallery,
      updateSettings,
      saveSession,
    }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}
