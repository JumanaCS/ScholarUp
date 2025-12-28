import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { Colors } from '../constants';
import { useStats, useFlashCards } from '../context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  image?: string;
  learned: boolean;
}

interface QuizScreenProps {
  route: {
    params: {
      cards: FlashCard[];
      quizType: 'all' | 'unlearned';
      setId: string;
    };
  };
  navigation: any;
}

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
  const { cards: initialCards, quizType, setId } = route.params;
  const { incrementQuizzesTaken, incrementQuizzesPassed, incrementCardsLearned } = useStats();
  const { toggleCardLearned } = useFlashCards();
  const [hasTrackedQuiz, setHasTrackedQuiz] = useState(false);
  const [gotAnyWrong, setGotAnyWrong] = useState(false);

  // Filter cards based on quiz type
  const getInitialCards = () => {
    if (quizType === 'unlearned') {
      return initialCards.filter(card => !card.learned);
    }
    return [...initialCards];
  };

  const [remainingCards, setRemainingCards] = useState<FlashCard[]>(getInitialCards());
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (remainingCards.length === 0 && !hasTrackedQuiz) {
      setIsCompleted(true);
      // Track quiz completion
      incrementQuizzesTaken();
      // Only count as perfect score if they never pressed "I got that wrong"
      if (!gotAnyWrong) {
        incrementQuizzesPassed();
      }
      setHasTrackedQuiz(true);
    }
  }, [remainingCards]);

  const currentCard = remainingCards[currentCardIndex];

  const handleCardPress = () => {
    setShowAnswer(!showAnswer);
  };

  const handleGotRight = async () => {
    const card = currentCard;

    // Mark the card as learned if it wasn't already
    if (!card.learned) {
      await toggleCardLearned(setId, card.id, true);
      incrementCardsLearned(1);
    }

    // Remove the card from remaining cards (card stays in quiz rotation until gotten right)
    const newRemainingCards = remainingCards.filter((_, index) => index !== currentCardIndex);
    setRemainingCards(newRemainingCards);

    if (newRemainingCards.length === 0) {
      setIsCompleted(true);
    } else {
      // Move to next card or wrap around
      setCurrentCardIndex(currentCardIndex >= newRemainingCards.length ? 0 : currentCardIndex);
      setShowAnswer(false);
    }
  };

  const handleGotWrong = () => {
    // Mark that they got at least one wrong (no perfect score)
    setGotAnyWrong(true);
    // Keep card in the quiz, move to next card
    const nextIndex = (currentCardIndex + 1) % remainingCards.length;
    setCurrentCardIndex(nextIndex);
    setShowAnswer(false);
  };

  if (isCompleted) {
    return (
      <View style={styles.container}>
        {/* Back Arrow */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>

        {/* Completion Card */}
        <View style={styles.completionContainer}>
          <View style={styles.completionCard}>
            <Text style={styles.completionTitle}>YOU'VE COMPLETED LEARNING THIS SET!</Text>
            <Text style={styles.completionEmoji}>(๑˃ᴗ˂)ﻭ</Text>
            <TouchableOpacity style={styles.backToSetButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backToSetText}>← back to set</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards to quiz!</Text>
          <TouchableOpacity style={styles.backToSetButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backToSetText}>← back to set</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>

      {/* Quiz Card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.quizCard}
          activeOpacity={0.9}
          onPress={handleCardPress}
        >
          {/* Question */}
          <Text style={styles.questionText}>{currentCard.question}</Text>

          {/* Image (shown with question) */}
          {currentCard.image && (
            <Image
              source={{ uri: currentCard.image }}
              style={styles.cardImage}
              resizeMode="contain"
            />
          )}

          {/* Answer (shown when tapped) */}
          {showAnswer && (
            <Text style={styles.answerText}>{currentCard.answer}</Text>
          )}

          {/* Tap to reveal hint */}
          {!showAnswer && (
            <Text style={styles.tapHint}>tap to reveal answer</Text>
          )}

          {/* Buttons (shown when answer is revealed) */}
          {showAnswer && (
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.rightButton} onPress={handleGotRight}>
                <Text style={styles.rightButtonText}>I got that right</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.wrongButton} onPress={handleGotWrong}>
                <Text style={styles.wrongButtonText}>I got that wrong</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Progress indicator */}
        <Text style={styles.progressText}>
          {remainingCards.length} card{remainingCards.length !== 1 ? 's' : ''} remaining
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tan,
    paddingTop: isTablet ? 50 : 40,
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizCard: {
    width: isTablet ? width * 0.6 : width * 0.85,
    minHeight: isTablet ? 300 : 250,
    backgroundColor: Colors.darkGreen,
    borderRadius: 25,
    padding: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 28 : 22,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  answerText: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.9,
  },
  cardImage: {
    width: isTablet ? 200 : 150,
    height: isTablet ? 150 : 100,
    borderRadius: 10,
    marginBottom: 15,
  },
  tapHint: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 14 : 12,
    color: Colors.white,
    opacity: 0.6,
    marginTop: 20,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
    width: '100%',
  },
  rightButton: {
    flex: 1,
    backgroundColor: Colors.mediumGreen,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrongButton: {
    flex: 1,
    backgroundColor: Colors.lightBrown,
    paddingVertical: isTablet ? 14 : 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
    textAlign: 'center',
  },
  wrongButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
    textAlign: 'center',
  },
  progressText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.text,
    marginTop: 20,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCard: {
    width: isTablet ? width * 0.6 : width * 0.85,
    backgroundColor: Colors.darkGreen,
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
  },
  completionTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 26 : 20,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 15,
  },
  completionEmoji: {
    fontSize: isTablet ? 32 : 26,
    marginBottom: 25,
    color: Colors.white,
  },
  backToSetButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  backToSetText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 14,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 20,
    color: Colors.text,
    marginBottom: 20,
  },
});
