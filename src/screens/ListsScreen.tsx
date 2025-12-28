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
import { useLists } from '../context';

const whitePencil = require('../assets/images/White_pencil.png');

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

interface List {
  id: string;
  name: string;
  emoji: string;
  items: ListItem[];
}

const EMOJI_OPTIONS = ['💻', '📓', '📚', '✏️', '🎯', '🏠', '💼', '🎨', '🎵', '⭐'];

export default function ListsScreen() {
  const navigation = useNavigation<any>();
  const { lists, createList, updateList, deleteList, updateListItems } = useLists();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📓');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateList = async () => {
    if (newListName.trim() && !isCreating) {
      setIsCreating(true);
      const newList = await createList(newListName.trim(), selectedEmoji);
      setIsCreating(false);

      if (newList) {
        setNewListName('');
        setSelectedEmoji('📓');
        setShowCreateModal(false);
        // Navigate to the newly created list
        navigation.navigate('ListDetail', {
          listId: newList.id,
          listName: newList.name,
          listEmoji: newList.emoji,
          items: newList.items,
          onUpdateItems: (items: ListItem[]) => handleUpdateItems(newList.id, items),
        });
      }
    }
  };

  const handleUpdateItems = (listId: string, items: ListItem[]) => {
    updateListItems(listId, items);
  };

  const handleListPress = (list: List) => {
    navigation.navigate('ListDetail', {
      listId: list.id,
      listName: list.name,
      listEmoji: list.emoji,
      items: list.items,
      onUpdateItems: (items: ListItem[]) => handleUpdateItems(list.id, items),
    });
  };

  const handleEditList = (list: List) => {
    setEditingList(list);
    setNewListName(list.name);
    setSelectedEmoji(list.emoji);
    setShowEditModal(true);
  };

  const handleUpdateList = async () => {
    if (editingList && newListName.trim()) {
      setIsUpdating(true);
      await updateList(editingList.id, newListName.trim(), selectedEmoji);
      setIsUpdating(false);
      resetEditModal();
    }
  };

  const handleDeleteList = () => {
    if (editingList) {
      Alert.alert(
        'Delete List',
        'Are you sure you want to delete this list? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setIsDeleting(true);
              await deleteList(editingList.id);
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
    setEditingList(null);
    setNewListName('');
    setSelectedEmoji('📓');
  };

  const renderListCard = (list: List) => {
    const itemCount = list.items.length;

    return (
      <TouchableOpacity
        key={list.id}
        style={styles.listCard}
        activeOpacity={0.8}
        onPress={() => handleListPress(list)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardEmoji}>{list.emoji}</Text>
            <View>
              <Text style={styles.cardName}>{list.name}</Text>
              <Text style={styles.cardItemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.pencilButton}
            onPress={() => handleEditList(list)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Image source={whitePencil} style={styles.pencilIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.headerTitle}>my lists</Text>

      {/* Lists */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listsContainer}
        showsVerticalScrollIndicator={false}
      >
        {lists.map(renderListCard)}

        {/* New List Button */}
        <TouchableOpacity
          style={styles.newListButton}
          activeOpacity={0.8}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.newListText}>new list  +</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create List Modal */}
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
              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              {/* Modal title */}
              <Text style={styles.modalTitle}>create a list</Text>

              {/* Name input */}
              <Text style={styles.inputLabel}>enter list name:</Text>
              <TextInput
                style={styles.input}
                placeholder="enter name"
                placeholderTextColor="#BEBEBE"
                value={newListName}
                onChangeText={setNewListName}
              />

              {/* Emoji picker */}
              <Text style={styles.inputLabelSpaced}>choose an emoji:</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Create button */}
              <TouchableOpacity
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateList}
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

      {/* Edit List Modal */}
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

              <Text style={styles.modalTitle}>edit list</Text>

              <Text style={styles.inputLabel}>list name:</Text>
              <TextInput
                style={styles.input}
                placeholder="enter name"
                placeholderTextColor="#BEBEBE"
                value={newListName}
                onChangeText={setNewListName}
              />

              <Text style={styles.inputLabelSpaced}>choose an emoji:</Text>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      selectedEmoji === emoji && styles.emojiButtonSelected,
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.createButton, isUpdating && styles.createButtonDisabled]}
                onPress={handleUpdateList}
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
                onPress={handleDeleteList}
                disabled={isUpdating || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.deleteButtonText}>delete list</Text>
                )}
              </TouchableOpacity>
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
    paddingTop: isTablet ? 80 : 70,
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
  listsContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    paddingBottom: 120,
    gap: 15,
  },
  listCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 30,
    paddingVertical: isTablet ? 20 : 18,
    paddingHorizontal: isTablet ? 25 : 20,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardEmoji: {
    fontSize: isTablet ? 32 : 26,
  },
  cardName: {
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
    marginBottom: 8,
  },
  cardItemCount: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
    opacity: 0.7,
  },
    newListButton: {
    backgroundColor: Colors.lightBrown,
    borderRadius: 30,
    paddingVertical: isTablet ? 18 : 16,
    alignItems: 'center',
  },
  newListText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 20,
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
    width: isTablet ? 450 : width * 0.85,
    backgroundColor: Colors.darkGreen,
    borderRadius: 25,
    padding: 25,
    paddingTop: 50,
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
    fontSize: isTablet ? 32 : 26,
    color: Colors.white,
    marginBottom: 25,
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
    marginTop: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontFamily: 'BPreplay-Bold',
    fontSize: isTablet ? 18 : 14,
    color: Colors.textDark,
    textAlign: 'center',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 25,
  },
  emojiButton: {
    width: isTablet ? 50 : 45,
    height: isTablet ? 50 : 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  emojiButtonSelected: {
    backgroundColor: Colors.white,
  },
  emojiText: {
    fontSize: isTablet ? 26 : 22,
  },
  createButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
  },
  pencilButton: {
    padding: 5,
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
    minWidth: 100,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
  },
});
