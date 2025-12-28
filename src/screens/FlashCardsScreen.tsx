import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants';
import { useFlashCards } from '../context';

const whitePencil = require('../assets/images/White_pencil.png');

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

export default function FlashCardsScreen() {
  const navigation = useNavigation<any>();
  const { sets, loading, createSet, updateSet, deleteSet, refreshSets } = useFlashCards();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [newSetName, setNewSetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getSetStats = (set: any) => {
    const total = set.flashcards?.length || 0;
    const learned = 0; // We can add a learned field later
    return { total, learned };
  };

  const handleCreateSet = async () => {
    if (newSetName.trim()) {
      setIsCreating(true);
      const newSet = await createSet(newSetName.trim());
      setIsCreating(false);
      setNewSetName('');
      setShowCreateModal(false);

      if (newSet) {
        navigation.navigate('SetDetail', {
          setId: newSet.id,
          setName: newSet.name,
        });
      }
    }
  };

  const handleSetPress = (set: any) => {
    navigation.navigate('SetDetail', {
      setId: set.id,
      setName: set.name,
    });
  };

  const handleEditSet = (set: any) => {
    setEditingSet(set);
    setNewSetName(set.name);
    setShowEditModal(true);
  };

  const handleUpdateSet = async () => {
    if (editingSet && newSetName.trim()) {
      setIsUpdating(true);
      await updateSet(editingSet.id, newSetName.trim());
      setIsUpdating(false);
      resetEditModal();
    }
  };

  const handleDeleteSet = () => {
    if (editingSet) {
      Alert.alert(
        'Delete Set',
        'Are you sure you want to delete this set? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);
              await deleteSet(editingSet.id);
              setIsDeleting(false);
              resetEditModal();
            },
          },
        ]
      );
    }
  };

  const resetEditModal = () => {
    setShowEditModal(false);
    setEditingSet(null);
    setNewSetName('');
  };

  const renderSetCard = (set: any) => {
    const { total, learned } = getSetStats(set);

    return (
      <TouchableOpacity
        key={set.id}
        style={styles.setCard}
        activeOpacity={0.8}
        onPress={() => handleSetPress(set)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardName}>{set.name}</Text>
          <TouchableOpacity onPress={() => handleEditSet(set)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Image source={whitePencil} style={styles.pencilIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <Text style={styles.learnedText}>Cards: {total}</Text>
      </TouchableOpacity>
    );
  };

  const renderNewSetCard = () => (
    <TouchableOpacity
      style={styles.newSetCard}
      activeOpacity={0.8}
      onPress={() => setShowCreateModal(true)}
    >
      <Text style={styles.newSetText}>new set +</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.darkGreen} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>my sets</Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {sets.map(renderSetCard)}
          {renderNewSetCard()}
        </View>
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCreateModal(false)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>create a set</Text>

              <TextInput
                style={styles.input}
                placeholder="create a name"
                placeholderTextColor={Colors.textLight}
                value={newSetName}
                onChangeText={setNewSetName}
              />

              <TouchableOpacity
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateSet}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>create</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Set Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={resetEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={resetEditModal}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <TouchableOpacity
                style={styles.closeButton}
                onPress={resetEditModal}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>edit set</Text>

              <TextInput
                style={styles.input}
                placeholder="set name"
                placeholderTextColor={Colors.textLight}
                value={newSetName}
                onChangeText={setNewSetName}
              />

              <TouchableOpacity
                style={[styles.createButton, isUpdating && styles.createButtonDisabled]}
                onPress={handleUpdateSet}
                disabled={isUpdating || isDeleting}
              >
                {isUpdating ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.createButtonText}>save</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteButton, isDeleting && styles.createButtonDisabled]}
                onPress={handleDeleteSet}
                disabled={isUpdating || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>delete set</Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const cardWidth = isTablet ? (width - 80 - 30) / 3 : (width - 60 - 15) / 2;
const cardHeight = isTablet ? 180 : 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tan,
    paddingTop: isTablet ? 80 : 70,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 48 : 38,
    color: Colors.textDark,
    marginLeft: isTablet ? 40 : 20,
    marginBottom: 25,
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    paddingBottom: 120,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 15,
  },
  setCard: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: Colors.darkGreen,
    borderRadius: 20,
    padding: 15,
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
    alignSelf: 'flex-start',
  },
  learnedText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 14,
    color: Colors.white,
    alignSelf: 'flex-end',
  },
  newSetCard: {
    width: cardWidth,
    height: cardHeight,
    backgroundColor: Colors.lightBrown,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newSetText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 28 : 22,
    color: Colors.white,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isTablet ? 400 : width * 0.85,
    backgroundColor: Colors.darkGreen,
    borderRadius: 25,
    padding: 25,
    paddingTop: 40,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 20,
  },
  closeButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 28 : 24,
    color: Colors.white,
  },
  modalTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 34 : 28,
    color: Colors.white,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 22 : 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 15,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pencilIcon: {
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
  },
  deleteButton: {
    backgroundColor: '#E88B8B',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 15,
    marginTop: 15,
  },
  deleteButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
  },
});
