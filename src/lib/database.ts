import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// ============ IMAGE UPLOAD ============
export async function uploadImage(userId: string, imageUri: string, folder: string = 'general'): Promise<string | null> {
  try {
    const fileName = `${userId}/${folder}/${Date.now()}.jpg`;

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const urlParts = imageUrl.split('/user-images/');
    if (urlParts.length < 2) return;

    const path = urlParts[1];
    await supabase.storage.from('user-images').remove([path]);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

// ============ GALLERY ============
export async function fetchGalleryImages(userId: string) {
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveGalleryImage(userId: string, imageUrl: string) {
  const { data, error } = await supabase
    .from('gallery_images')
    .insert({ user_id: userId, image_url: imageUrl })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGalleryImage(imageId: string, imageUrl: string) {
  // Delete from storage
  await deleteImage(imageUrl);

  // Delete from database
  const { error } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

// ============ FLASHCARD SETS ============
export async function fetchFlashcardSets(userId: string) {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select(`
      *,
      flashcards (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFlashcardSet(userId: string, name: string, emoji: string = '📚') {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .insert({ user_id: userId, name, emoji })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFlashcardSet(setId: string) {
  const { error } = await supabase
    .from('flashcard_sets')
    .delete()
    .eq('id', setId);

  if (error) throw error;
}

export async function updateFlashcardSet(setId: string, name: string) {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', setId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ FLASHCARDS ============
export async function createFlashcard(
  userId: string,
  setId: string,
  term: string,
  definition: string,
  imageUri?: string
) {
  let imageUrl: string | null = null;

  // Upload image if provided
  if (imageUri) {
    imageUrl = await uploadImage(userId, imageUri, 'flashcards');
  }

  const { data, error } = await supabase
    .from('flashcards')
    .insert({ user_id: userId, set_id: setId, term, definition, image_url: imageUrl })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcard(
  userId: string,
  cardId: string,
  updates: { term?: string; definition?: string; imageUri?: string; learned?: boolean }
) {
  const updateData: { term?: string; definition?: string; image_url?: string; learned?: boolean } = {};

  if (updates.term !== undefined) updateData.term = updates.term;
  if (updates.definition !== undefined) updateData.definition = updates.definition;
  if (updates.learned !== undefined) updateData.learned = updates.learned;

  // Upload new image if provided (only if it's a local file, not an existing URL)
  if (updates.imageUri) {
    // Check if it's already a URL (starts with http) or a local file path
    if (updates.imageUri.startsWith('http')) {
      // It's already an uploaded URL, keep it as is
      updateData.image_url = updates.imageUri;
    } else {
      // It's a local file, upload it
      const imageUrl = await uploadImage(userId, updates.imageUri, 'flashcards');
      if (imageUrl) updateData.image_url = imageUrl;
    }
  }

  const { data, error } = await supabase
    .from('flashcards')
    .update(updateData)
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFlashcard(cardId: string) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
}

// ============ TASK LISTS ============
export async function fetchTaskLists(userId: string) {
  const { data, error } = await supabase
    .from('task_lists')
    .select(`
      *,
      tasks (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTaskList(userId: string, name: string, emoji: string = '📝') {
  const { data, error } = await supabase
    .from('task_lists')
    .insert({ user_id: userId, name, emoji })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaskList(listId: string) {
  const { error } = await supabase
    .from('task_lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
}

export async function updateTaskList(listId: string, name: string, emoji: string) {
  const { data, error } = await supabase
    .from('task_lists')
    .update({ name, emoji })
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ TASKS ============
export async function createTask(userId: string, listId: string, text: string, dueDate?: string) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, list_id: listId, text, due_date: dueDate })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(taskId: string, updates: { text?: string; completed?: boolean; due_date?: string }) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

// ============ TIMER SESSIONS ============
export async function saveTimerSession(userId: string, durationSeconds: number) {
  const { data, error } = await supabase
    .from('timer_sessions')
    .insert({ user_id: userId, duration_seconds: durationSeconds })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTimerSessions(userId: string) {
  const { data, error } = await supabase
    .from('timer_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============ USER STATS ============
export async function fetchUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
  return data;
}

export async function upsertUserStats(userId: string, stats: {
  total_study_time?: number;
  total_break_time?: number;
  focus_sessions?: number;
  break_sessions?: number;
  tasks_created?: number;
  tasks_completed?: number;
  cards_created?: number;
  cards_studied?: number;
  quizzes_taken?: number;
  quizzes_passed?: number;
  default_focus_time?: number;
  default_break_time?: number;
}) {
  const { data, error } = await supabase
    .from('user_stats')
    .upsert(
      {
        user_id: userId,
        ...stats,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementUserStat(userId: string, field: string, amount: number = 1) {
  // First get current stats
  const current = await fetchUserStats(userId);
  const currentValue = current?.[field] || 0;

  const { data, error } = await supabase
    .from('user_stats')
    .upsert(
      {
        user_id: userId,
        [field]: currentValue + amount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
