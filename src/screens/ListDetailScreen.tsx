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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../constants';
import { useLists, useStats } from '../context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

interface ListDetailScreenProps {
  route: {
    params: {
      listId: string;
      listName: string;
      listEmoji: string;
      items: ListItem[];
      onUpdateItems: (items: ListItem[]) => void;
    };
  };
  navigation: any;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ListDetailScreen({ route, navigation }: ListDetailScreenProps) {
  const { listId, listName, listEmoji } = route.params;
  const { lists, addTask, updateTask } = useLists();
  const { incrementTasksCreated, incrementTasksCompleted } = useStats();

  // Get items from context to stay in sync
  const currentList = lists.find(l => l.id === listId);
  const items = currentList?.items || [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = async () => {
    if (newTaskText.trim() && !isCreating) {
      setIsCreating(true);
      const dueDate = selectedDate ? formatDate(selectedDate) : undefined;
      const newTask = await addTask(listId, newTaskText.trim(), dueDate);
      setIsCreating(false);

      if (newTask) {
        incrementTasksCreated();
        resetModal();
      }
    }
  };

  const resetModal = () => {
    setNewTaskText('');
    setSelectedDate(null);
    setShowCreateModal(false);
    setShowDatePicker(false);
  };

  const toggleCompleted = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const wasCompleted = item.completed;
    const newCompleted = !wasCompleted;

    await updateTask(itemId, { completed: newCompleted });

    // Track when task is marked as completed (not when unmarked)
    if (newCompleted && !wasCompleted) {
      incrementTasksCompleted();
    } else if (!newCompleted && wasCompleted) {
      // Decrement when unchecking
      incrementTasksCompleted(-1);
    }
  };

  const formatDate = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  const getTaskColor = (completed: boolean) => {
    return completed ? '#6B8A54' : Colors.darkGreen;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={calendarStyles.dayCell} />);
    }
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            calendarStyles.dayCell,
            isSelected && calendarStyles.selectedDay,
          ]}
          onPress={() => setSelectedDate(new Date(year, month, day))}
        >
          <Text style={[
            calendarStyles.dayText,
            isSelected && calendarStyles.selectedDayText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const renderTaskItem = (item: ListItem) => {
    const bgColor = getTaskColor(item.completed);

    return (
      <View key={item.id} style={[styles.taskCard, { backgroundColor: bgColor }]}>
        {/* Top Row: Checkbox and Task text */}
        <TouchableOpacity style={styles.taskTop} onPress={() => toggleCompleted(item.id)}>
          <View style={[styles.checkbox, item.completed && styles.checkboxChecked]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[
            styles.taskText,
            item.completed && styles.taskTextCompleted,
          ]}>
            {item.text}
          </Text>
        </TouchableOpacity>

        {/* Due Date at bottom right */}
        {item.dueDate && (
          <Text style={styles.dueDateText}>{item.dueDate}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backArrow}>{'<'}</Text>
      </TouchableOpacity>

      {/* List Title with Emoji */}
      <View style={styles.titleRow}>
        <Text style={styles.titleEmoji}>{listEmoji}</Text>
        <Text style={styles.listTitle}>{listName}</Text>
      </View>

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.tasksContainer}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => renderTaskItem(item))}

        {/* New Task Button */}
        <TouchableOpacity
          style={styles.newTaskButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.newTaskButtonText}>new task  +</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Task Modal */}
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
              {/* Close button */}
              <TouchableOpacity style={styles.closeButton} onPress={resetModal}>
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Modal title */}
                <Text style={styles.modalTitle}>new task</Text>

                {/* Task input */}
                <Text style={styles.inputLabel}>enter task:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="enter task"
                  placeholderTextColor="#BEBEBE"
                  value={newTaskText}
                  onChangeText={setNewTaskText}
                />

                {/* Date picker button */}
                <Text style={styles.inputLabelSpaced}>choose a due date (optional):</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(showDatePicker ? false : true)}
                >
                  <Text style={styles.dateButtonText}>
                    {selectedDate ? formatDate(selectedDate) : 'choose date'}
                  </Text>
                </TouchableOpacity>

                {/* Calendar dropdown */}
                {showDatePicker && (
                  <View style={calendarStyles.container}>
                    {/* Month/Year header */}
                    <View style={calendarStyles.header}>
                      <Text style={calendarStyles.monthYear}>
                        {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                      </Text>
                      <View style={calendarStyles.navButtons}>
                        <TouchableOpacity
                          onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                        >
                          <Text style={calendarStyles.navButton}>{'<'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                        >
                          <Text style={calendarStyles.navButton}>{'>'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Day labels */}
                    <View style={calendarStyles.weekRow}>
                      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                        <Text key={day} style={calendarStyles.weekDayText}>{day}</Text>
                      ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={calendarStyles.daysGrid}>
                      {renderCalendar()}
                    </View>

                    {/* Save button */}
                    <TouchableOpacity
                      style={calendarStyles.saveButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={calendarStyles.saveButtonText}>save</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Create button */}
                {!showDatePicker && (
                  <TouchableOpacity
                    style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                    onPress={handleCreateTask}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.createButtonText}>create</Text>
                    )}
                  </TouchableOpacity>
                )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 25,
  },
  titleEmoji: {
    fontSize: isTablet ? 36 : 28,
  },
  listTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 42 : 32,
    color: Colors.textDark,
  },
  scrollView: {
    flex: 1,
  },
  tasksContainer: {
    paddingBottom: 120,
    gap: 15,
  },
  taskCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: isTablet ? 100 : 80,
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: isTablet ? 24 : 20,
    height: isTablet ? 24 : 20,
    borderWidth: 2,
    borderColor: Colors.white,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  checkmark: {
    color: Colors.darkGreen,
    fontSize: isTablet ? 16 : 12,
    fontWeight: 'bold',
  },
  taskText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
    flex: 1,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
  },
  dueDateText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  newTaskButton: {
    backgroundColor: Colors.lightBrown,
    borderRadius: 25,
    paddingVertical: isTablet ? 16 : 14,
    alignItems: 'center',
  },
  newTaskButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 22 : 18,
    color: Colors.white,
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
    alignItems: 'center',
    paddingBottom: 10,
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
    marginTop: 25,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.textDark,
    textAlign: 'center',
  },
  dateButton: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  dateButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.textDark,
  },
  createButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 15,
    marginTop: 30,
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
});

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 15,
    padding: 15,
    width: '100%',
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthYear: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 16,
    color: Colors.white,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  navButton: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 18,
    color: Colors.white,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 12 : 10,
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
  },
  selectedDay: {
    backgroundColor: Colors.limeGreen,
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  selectedDayText: {
    color: Colors.white,
  },
  saveButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignSelf: 'center',
    marginTop: 15,
  },
  saveButtonText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 16 : 14,
    color: Colors.white,
  },
});
