import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants';
import { useLists } from '../context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { lists, updateListItems } = useLists();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() - 2);
    return today;
  });

  // Get the 5 days to display starting from startDate
  const getDaysToShow = () => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const daysToShow = getDaysToShow();
  const currentMonth = MONTHS[selectedDate.getMonth()];

  // Format date as MM/DD for comparison
  const formatDateForComparison = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  };

  // Get all tasks with their list info for a specific date
  const getTasksForDate = (date: Date) => {
    const dateStr = formatDateForComparison(date);
    const tasks: { task: any; list: any }[] = [];

    lists.forEach(list => {
      list.items.forEach(item => {
        if (item.dueDate === dateStr && !item.completed) {
          tasks.push({ task: item, list });
        }
      });
    });

    return tasks;
  };

  // Check if a date has any tasks
  const dateHasTasks = (date: Date): boolean => {
    return getTasksForDate(date).length > 0;
  };

  // Get tasks for currently selected day
  const selectedDayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, lists]);

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if date is the selected date
  const isSelected = (date: Date): boolean => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const handlePrevDays = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() - 5);
    setStartDate(newStart);
  };

  const handleNextDays = () => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + 5);
    setStartDate(newStart);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTaskPress = (task: any, list: any) => {
    navigation.navigate('ListDetail', {
      listId: list.id,
      listName: list.name,
      listEmoji: list.emoji,
      items: list.items,
      onUpdateItems: (items: any[]) => updateListItems(list.id, items),
    });
  };

  return (
    <View style={styles.container}>
      {/* Month Title */}
      <Text style={styles.monthTitle}>{currentMonth}</Text>

      {/* Days Row */}
      <View style={styles.daysRow}>
        <TouchableOpacity onPress={handlePrevDays} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'<'}</Text>
        </TouchableOpacity>

        {daysToShow.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCircle,
              isSelected(date) && styles.dayCircleSelected,
            ]}
            onPress={() => handleDayPress(date)}
          >
            <Text style={[
              styles.dayText,
              isSelected(date) && styles.dayTextSelected,
            ]}>
              {date.getDate()}
            </Text>
            {dateHasTasks(date) && (
              <View style={styles.taskDot} />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={handleNextDays} style={styles.arrowButton}>
          <Text style={styles.arrowText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Divider Line */}
      <View style={styles.divider} />

      {/* Tasks List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.tasksContainer}
        showsVerticalScrollIndicator={false}
      >
        {selectedDayTasks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>no tasks today!</Text>
            <Text style={styles.emptySubtitle}>time to relax and recharge</Text>
          </View>
        ) : (
          selectedDayTasks.map(({ task, list }) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => handleTaskPress(task, list)}
            >
              <Text style={styles.taskEmoji}>{list.emoji}</Text>
              <Text style={styles.taskText}>{task.text}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.tan,
    paddingTop: isTablet ? 90 : 75,
  },
  monthTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 42 : 32,
    color: Colors.darkGreen,
    textAlign: 'center',
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isTablet ? 40 : 10,
    gap: isTablet ? 15 : 8,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 28 : 22,
    color: Colors.darkGreen,
  },
  dayCircle: {
    width: isTablet ? 70 : 55,
    height: isTablet ? 70 : 55,
    borderRadius: isTablet ? 35 : 27.5,
    backgroundColor: Colors.mediumGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: Colors.darkGreen,
  },
  dayText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 24 : 20,
    color: '#A0A0A0',
  },
  dayTextSelected: {
    color: Colors.textDark,
  },
  taskDot: {
    position: 'absolute',
    bottom: isTablet ? 6 : 4,
    width: isTablet ? 10 : 8,
    height: isTablet ? 10 : 8,
    borderRadius: isTablet ? 5 : 4,
    backgroundColor: '#E88B8B',
  },
  divider: {
    height: 2,
    backgroundColor: Colors.darkGreen,
    marginHorizontal: isTablet ? 60 : 30,
    marginTop: 25,
    marginBottom: 30,
  },
  scrollView: {
    flex: 1,
  },
  tasksContainer: {
    paddingHorizontal: isTablet ? 40 : 20,
    paddingBottom: 120,
    gap: 15,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 36 : 28,
    color: Colors.lightBrown,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 18 : 14,
    color: Colors.textDark,
    opacity: 0.7,
  },
  taskCard: {
    backgroundColor: Colors.darkGreen,
    borderRadius: 30,
    paddingVertical: isTablet ? 18 : 16,
    paddingHorizontal: isTablet ? 25 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskEmoji: {
    fontSize: isTablet ? 28 : 24,
  },
  taskText: {
    fontFamily: 'Mini',
    fontSize: isTablet ? 20 : 16,
    color: Colors.white,
    flex: 1,
  },
});
