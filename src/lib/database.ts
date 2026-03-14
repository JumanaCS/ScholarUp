import { supabase } from './supabase';

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
  definition: string
) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({ user_id: userId, set_id: setId, term, definition })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcard(
  userId: string,
  cardId: string,
  updates: { term?: string; definition?: string; learned?: boolean }
) {
  const updateData: { term?: string; definition?: string; learned?: boolean } = {};

  if (updates.term !== undefined) updateData.term = updates.term;
  if (updates.definition !== undefined) updateData.definition = updates.definition;
  if (updates.learned !== undefined) updateData.learned = updates.learned;

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

// ============ USER STATS ============
export async function fetchUserStats(userId: string) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    if (__DEV__) console.error('Error fetching user stats:', error);
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
