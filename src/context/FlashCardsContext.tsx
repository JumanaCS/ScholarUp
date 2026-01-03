import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchFlashcardSets,
  createFlashcardSet as dbCreateSet,
  updateFlashcardSet as dbUpdateSet,
  deleteFlashcardSet as dbDeleteSet,
  createFlashcard as dbCreateCard,
  updateFlashcard as dbUpdateCard,
  deleteFlashcard as dbDeleteCard,
} from '../lib/database';

interface FlashCard {
  id: string;
  term: string;
  definition: string;
  set_id: string;
  image_url?: string | null;
  learned?: boolean;
}

interface FlashCardSet {
  id: string;
  name: string;
  emoji: string;
  flashcards: FlashCard[];
}

interface FlashCardsContextType {
  sets: FlashCardSet[];
  loading: boolean;
  refreshSets: () => Promise<void>;
  createSet: (name: string, emoji?: string) => Promise<FlashCardSet | null>;
  updateSet: (setId: string, name: string) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  addCard: (setId: string, term: string, definition: string, imageUri?: string) => Promise<FlashCard | null>;
  updateCard: (cardId: string, term: string, definition: string, imageUri?: string) => Promise<void>;
  toggleCardLearned: (setId: string, cardId: string, learned: boolean) => Promise<void>;
  deleteCard: (setId: string, cardId: string) => Promise<void>;
}

const FlashCardsContext = createContext<FlashCardsContextType | undefined>(undefined);

export function FlashCardsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashCardSet[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSets = async () => {
    if (!user) {
      setSets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchFlashcardSets(user.id);
      setSets(data || []);
    } catch (error) {
      if (__DEV__) console.error('Error fetching flashcard sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSets();
  }, [user]);

  const createSet = async (name: string, emoji: string = '📚'): Promise<FlashCardSet | null> => {
    if (!user) return null;

    // Security: Input validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0 || trimmedName.length > 100) {
      return null;
    }

    try {
      const newSet = await dbCreateSet(user.id, trimmedName, emoji);
      const setWithCards = { ...newSet, flashcards: [] };
      setSets(prev => [setWithCards, ...prev]);
      return setWithCards;
    } catch (error) {
      if (__DEV__) console.error('Error creating set:', error);
      return null;
    }
  };

  const updateSet = async (setId: string, name: string) => {
    // Security: Input validation
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length === 0 || trimmedName.length > 100) {
      return;
    }

    try {
      await dbUpdateSet(setId, trimmedName);
      setSets(prev => prev.map(s => s.id === setId ? { ...s, name } : s));
    } catch (error) {
      if (__DEV__) console.error('Error updating set:', error);
    }
  };

  const deleteSet = async (setId: string) => {
    try {
      await dbDeleteSet(setId);
      setSets(prev => prev.filter(s => s.id !== setId));
    } catch (error) {
      if (__DEV__) console.error('Error deleting set:', error);
    }
  };

  const addCard = async (setId: string, term: string, definition: string, imageUri?: string): Promise<FlashCard | null> => {
    if (!user) return null;

    // Security: Input validation
    const trimmedTerm = term.trim();
    const trimmedDef = definition.trim();
    if (!trimmedTerm || trimmedTerm.length > 500 || !trimmedDef || trimmedDef.length > 2000) {
      return null;
    }

    try {
      const newCard = await dbCreateCard(user.id, setId, trimmedTerm, trimmedDef, imageUri);
      setSets(prev => prev.map(set =>
        set.id === setId
          ? { ...set, flashcards: [...set.flashcards, newCard] }
          : set
      ));
      return newCard;
    } catch (error) {
      if (__DEV__) console.error('Error adding card:', error);
      return null;
    }
  };

  const updateCard = async (cardId: string, term: string, definition: string, imageUri?: string) => {
    if (!user) return;

    try {
      const updatedCard = await dbUpdateCard(user.id, cardId, { term, definition, imageUri });
      setSets(prev => prev.map(set => ({
        ...set,
        flashcards: set.flashcards.map(card =>
          card.id === cardId ? { ...card, term, definition, image_url: updatedCard.image_url } : card
        ),
      })));
    } catch (error) {
      if (__DEV__) console.error('Error updating card:', error);
    }
  };

  const toggleCardLearned = async (setId: string, cardId: string, learned: boolean) => {
    if (!user) return;

    try {
      await dbUpdateCard(user.id, cardId, { learned });
      setSets(prev => prev.map(set => ({
        ...set,
        flashcards: set.flashcards.map(card =>
          card.id === cardId ? { ...card, learned } : card
        ),
      })));
    } catch (error) {
      if (__DEV__) console.error('Error toggling card learned:', error);
    }
  };

  const deleteCard = async (setId: string, cardId: string) => {
    try {
      await dbDeleteCard(cardId);
      setSets(prev => prev.map(set =>
        set.id === setId
          ? { ...set, flashcards: set.flashcards.filter(c => c.id !== cardId) }
          : set
      ));
    } catch (error) {
      if (__DEV__) console.error('Error deleting card:', error);
    }
  };

  return (
    <FlashCardsContext.Provider value={{
      sets,
      loading,
      refreshSets,
      createSet,
      updateSet,
      deleteSet,
      addCard,
      updateCard,
      toggleCardLearned,
      deleteCard,
    }}>
      {children}
    </FlashCardsContext.Provider>
  );
}

export function useFlashCards() {
  const context = useContext(FlashCardsContext);
  if (context === undefined) {
    throw new Error('useFlashCards must be used within a FlashCardsProvider');
  }
  return context;
}
