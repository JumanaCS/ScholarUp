import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants';
import { useStats, useFlashCards } from '../context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const whitePencil = require('../assets/images/White_pencil.png');

interface SetDetailScreenProps {
  route: {
    params: {
      setId: string;
      setName: string;
    };
  };
  navigation: any;
}

export default function SetDetailScreen({ route, navigation }: SetDetailScreenProps) {
  const { setId, setName } = route.params;
  const { sets, addCard, updateCard, toggleCardLearned, deleteCard } = useFlashCards();
  const { incrementCardsCreated, incrementCardsLearned } = useStats();

  // Get the current set from context
  const currentSet = sets.find(s => s.id === setId);
  const cards = currentSet?.flashcards || [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingCard, setEditingCard] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateCard = async () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setIsSaving(true);
      await addCard(setId, newQuestion.trim(), newAnswer.trim());
      incrementCardsCreated();
      setIsSaving(false);
      resetModal();
    }
  };

  const handleUpdateCard = async () => {
    if (editingCard && newQuestion.trim() && newAnswer.trim()) {
      setIsSaving(true);
      await updateCard(editingCard.id, newQuestion.trim(), newAnswer.trim());
      setIsSaving(false);
      resetModal();
    }
  };

  const resetModal = () => {
    setNewQuestion('');
    setNewAnswer('');
    setEditingCard(null);
    setShowCreateModal(false);
  };

  const handleEditCard = (card: any) => {
    setEditingCard(card);
    setNewQuestion(card.term);
    setNewAnswer(card.definition);
    setShowCreateModal(true);
  };

  const handleToggleLearned = async (card: any) => {
    const newLearned = !card.learned;
    await toggleCardLearned(setId, card.id, newLearned);
    // Increment by 1 if checking, decrement by 1 if unchecking
    incrementCardsLearned(newLearned ? 1 : -1);
  };

  const renderCard = (card: any) => {
    const bgColor = card.learned ? '#5A7545' : Colors.darkGreen;
    const textColor = Colors.white;

    return (
      <View key={card.id} style={[styles.card, { backgroundColor: bgColor }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardTextContent}>
            <Text style={[styles.cardQuestion, { color: textColor }]}>{card.term}</Text>
            <Text style={[styles.cardAnswer, { color: textColor }]}>{card.definition}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <TouchableOpacity onPress={() => handleEditCard(card)}>
            <Image source={whitePencil} style={styles.pencilIcon} resizeMode="contain" />
          </TouchableOpacity>
          <View style={styles.learnedContainer}>
            <Text style={styles.learnedText}>Learned:</Text>
            <TouchableOpacity
              style={[styles.learnedCheckbox, card.learned && styles.learnedCheckboxChecked]}
              onPress={() => handleToggleLearned(card)}
            >
              {card.learned && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Convert cards format for Quiz screen
  const quizCards = cards.map(card => ({
    id: card.id,
    question: card.term,
    answer: card.definition,
    learned: card.learned || false,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>

      <Text style={styles.setTitle}>{setName}</Text>

      <View style={styles.quizButtonsRow}>
        <TouchableOpacity
          style={styles.quizButton}
          onPress={() => navigation.navigate('Quiz', { cards: quizCards, quizType: 'all', setId })}
        >
          <Text style={styles.quizButtonText}>quiz all</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quizButtonAlt}
          onPress={() => navigation.navigate('Quiz', { cards: quizCards, quizType: 'unlearned', setId })}
        >
          <Text style={styles.quizButtonAltText}>quiz unlearned</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newCardButton} onPress={() => setShowCreateModal(true)}>
        <Text style={styles.newCardButtonText}>new card +</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {cards.map(renderCard)}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={resetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={styles.modalOverlayTouch} activeOpacity={1} onPress={resetModal}>
            <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
              <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>
                  {editingCard ? 'edit card' : 'create a card'}
                </Text>

                <Text style={styles.inputLabel}>enter front of card:</Text>
                <TextInput
                  style={styles.inputLarge}
                  placeholder="enter question"
                  placeholderTextColor="#BEBEBE"
                  value={newQuestion}
                  onChangeText={setNewQuestion}
                  multiline
                />

                <Text style={styles.inputLabelSpaced}>enter back of card:</Text>
                <TextInput
                  style={styles.inputLarge}
                  placeholder="enter answer"
                  placeholderTextColor="#BEBEBE"
                  value={newAnswer}
                  onChangeText={setNewAnswer}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={editingCard ? handleUpdateCard : handleCreateCard}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>save</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tan,
    paddingTop: isTablet ? 85 : 75,
    paddingHorizontal: isTablet ? 40 : 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backArrow: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 36 : 28,
    color: Colors.darkGreen,
  },
  setTitle: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 42 : 32,
    color: Colors.textDark,
    marginBottom: 15,
  },
  quizButtonsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  quizButton: {
    flex: 1,
    backgroundColor: Colors.mediumGreen,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  quizButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
  },
  quizButtonAlt: {
    flex: 1,
    backgroundColor: Colors.limeGreen,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  quizButtonAltText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
  },
  newCardButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  newCardButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingBottom: 120,
    gap: 15,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    minHeight: isTablet ? 150 : 120,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flex: 1,
    marginBottom: 15,
  },
  cardTextContent: {
    flex: 1,
    marginRight: 10,
  },
  cardQuestion: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 22 : 18,
    marginBottom: 15,
  },
  learnedCheckbox: {
    width: isTablet ? 26 : 22,
    height: isTablet ? 26 : 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnedCheckboxChecked: {
    backgroundColor: Colors.white,
  },
  checkmark: {
    color: Colors.darkGreen,
    fontSize: isTablet ? 16 : 14,
    fontWeight: 'bold',
  },
  learnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  learnedText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 16,
    color: Colors.white,
  },
  cardAnswer: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 16 : 14,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pencilIcon: {
    width: isTablet ? 28 : 22,
    height: isTablet ? 28 : 22,
  },
  modalOverlay: {
    flex: 1,
  },
  modalOverlayTouch: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isTablet ? 500 : width * 0.9,
    maxHeight: '85%',
    backgroundColor: Colors.darkGreen,
    borderRadius: 25,
    paddingHorizontal: 25,
    paddingTop: 50,
    paddingBottom: 25,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 28 : 24,
    color: Colors.white,
  },
  modalTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 32 : 26,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputLabel: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 14,
    color: Colors.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  inputLabelSpaced: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 14,
    color: Colors.white,
    marginBottom: 10,
    marginTop: 25,
    textAlign: 'center',
  },
  inputLarge: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 16 : 14,
    color: Colors.textDark,
    minHeight: isTablet ? 120 : 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
  },
});
