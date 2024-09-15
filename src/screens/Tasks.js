/*
Kailey Bergeron 
Tasks/Lists Screen
Dec. 8th, 2023

first:
npm install @react-native-community/datetimepicker

*/

import React, { useState, useEffect } from "react";
import { Text, StyleSheet, View, Button, TextInput, TouchableOpacity, Image, AsyncStorage } from "react-native";
import DatePicker from '@react-native-community/datetimepicker'; 

//constraints for different states
const LIST_SCREEN_STATE = "listCreation";
const TASKS_CREATION_STATE = "tasksCreation";

const Tasks = ({ navigation }) => {
  // States for managing lists, tasks, inputs, and UI states
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [myListState, setMyListState] = useState(LIST_SCREEN_STATE);
  const [selectedListIndex, setSelectedListIndex] = useState(null);
  const [promptingAddTask, setPromptingAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  // Initialize taskDate with today's date
  const [taskDate, setTaskDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  // State to hold the selected date
  const [completedTasks, setCompletedTasks] = useState({});

  // Function to load lists from AsyncStorage
  const loadLists = async () => {
    try {
      const storedLists = await AsyncStorage.getItem("lists");
      if (storedLists !== null) {
        const parsedLists = JSON.parse(storedLists);
        const listsWithParsedDates = parsedLists.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) => ({
            ...task,
            date: new Date(task.date),
          })),
        }));
        setLists(listsWithParsedDates);
      }
    } catch (error) {
      console.error("Error loading lists:", error);
    }
  };

  // Function to save lists to AsyncStorage
  const saveLists = async (updatedLists) => {
    try {
      await AsyncStorage.setItem("lists", JSON.stringify(updatedLists));
    } catch (error) {
      console.error("Error saving lists:", error);
    }
  };

  useEffect(() => {
    loadLists(); // Load lists when the component mounts
  }, []);

  // Helper function to get tasks for the current date
  const getTasksForCurrentDate = () => {
    if (selectedListIndex !== null) {
      const selectedList = lists[selectedListIndex];
      const selectedListTasks = selectedList.tasks || [];

      if (selectedListTasks.length === 0) {
        return <Text style={styles.noLists}>No tasks available.</Text>;
      }

      return selectedListTasks.map((task, index) => (
        <View key={index} style={styles.list}>
          {/* ... existing code for displaying tasks */}
        </View>
      ));
    }
    return null;
  };

  // Helper function to render tasks or image based on the current date
  const getTasksOrImageForCurrentDate = () => {
    if (taskDate === currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })) {
      return getTasksForCurrentDate();
    } 
  };
  

  // Event handlers for adding, deleting lists and tasks
  const handleAddList = () => {
    setShowAddList(true);
  };
  const handleDeleteList = (index) => {
    const updatedLists = lists.filter((_, i) => i !== index);
    setLists(updatedLists);
    saveLists(updatedLists);
    if (selectedListIndex === index) {
      setMyListState(LIST_SCREEN_STATE);
      setSelectedListIndex(null);
    }
  }
  const handleSaveList = () => {
    const updatedLists = [...lists, { title: newListTitle, tasks: [] }]; // Initialize tasks array for the new list
    setLists(updatedLists);
    // save lists when updated
    saveLists(updatedLists);
    setShowAddList(false);
    setNewListTitle("");
  };
  const handleAddTask = () => {
    if (selectedListIndex !== null) {
      const newTask = {
        title: taskTitle,
        date: new Date(taskDate), // Ensure taskDate is a valid date string or date object
      };
  
      const updatedLists = [...lists];
      updatedLists[selectedListIndex].tasks = [
        ...(updatedLists[selectedListIndex].tasks || []),
        newTask,
      ];
  
      setLists(updatedLists);
      saveLists(updatedLists);
  
      // Clear task inputs after adding task
      setTaskTitle('');
      setTaskDate(new Date()); // Reset taskDate to today's date after adding the task
    }
  };
  const handleDeleteTask = (taskIndex) => {
    const updatedLists = [...lists];
    updatedLists[selectedListIndex].tasks = updatedLists[selectedListIndex].tasks.filter((_, i) => i !== taskIndex);
    setLists(updatedLists);
    saveLists(updatedLists);
  };

  // Event handler for date change in DatePicker
  const handleDateChange = (event, selected) => {
    if (selected) {
      setSelectedDate(selected);
      setTaskDate(selected.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
      // The setTaskDate here updates the state variable 'taskDate' with the formatted date
    }
  };

  // Navigation function to navigate between screens
  const navigateTo = (screenName) => {
    if(screenName === "Tasks") {
      // load lists if returning to tasks screen
      loadLists();
    }
    navigation.navigate(screenName);
  };

  let whatToDisplay; 

  // Switch statement to render different UI based on state
  switch (myListState) {
    // LIST SCREEN
    case LIST_SCREEN_STATE:
      whatToDisplay = (
        <View style={styles.container}>
          <Text style={styles.header}>my lists</Text>
          {lists.length > 0 &&
            lists.map((list, index) => (
              <TouchableOpacity
                key={index}
                style={styles.list}
                onPress={() => {
                  setSelectedListIndex(index); // Set selectedListIndex on list item click
                  setMyListState(TASKS_CREATION_STATE);
                }}
              >
              <Text style={styles.title}> {list.title}</Text>
              
              <TouchableOpacity
                style={styles.deleteButton} 
                onPress={() => handleDeleteList(index)}>
                <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          }

          {!showAddList ? (
            <TouchableOpacity
              style={[styles.addList, { backgroundColor: "#88735c" }]}
              onPress={handleAddList}
            >
              <Text style={{ color: "white" }}>new list +</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter list title"
                value={newListTitle}
                onChangeText={(text) => setNewListTitle(text)}
              />
              <Button title="Save List" onPress={handleSaveList} />
            </View>
          )}

          <View style={styles.navBar}>
            {/* Reusable Bottom Navigation Bar */}
            <View style={styles.bottomBar}>
              <TouchableOpacity onPress={() => navigateTo("Timer")}>
                <Image source={require("../../assets/images/clock.png")} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo("Flash")}>
                <Image source={require("../../assets/images/flashcards.png")} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo("Home")}>
                <Image source={require("../../assets/images/homelogo.png")} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigateTo("Tasks")}>
                <Image source={require("../../assets/images/calender.png")} style={styles.icon} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    break;

    // tasks creation screen 
    case TASKS_CREATION_STATE:
      if (selectedListIndex !== null) {
        const selectedList = lists[selectedListIndex];
        const selectedListTasks = selectedList.tasks || [];
        whatToDisplay = (
          <View style={styles.container}>
            <Text style={styles.header}>{selectedList.title}</Text>
            
            {selectedListTasks.length === 0 ? (
              <Text style={styles.noLists}>No tasks available.</Text>
            ) : (
              selectedListTasks.map((task, index) => (
                <View key={index} style={styles.list}>
                  <View style={styles.taskRow}>
                    <View style={styles.checkboxContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          const updatedCompletedTasks = { ...completedTasks };
                          updatedCompletedTasks[`${selectedListIndex}-${index}`] = !completedTasks[`${selectedListIndex}-${index}`];
                          setCompletedTasks(updatedCompletedTasks);
                        }}
                        style={[
                          styles.checkbox,
                          completedTasks[`${selectedListIndex}-${index}`] ? styles.checked : styles.unchecked,
                        ]}
                      />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text>{task.title} - {task.date instanceof Date ? task.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteTask(index)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.addList, { backgroundColor: "#88735c" }]}
                onPress={() => setPromptingAddTask(true)}
              >
                <Text style={{ color: "white" }}>Add Task</Text>
              </TouchableOpacity>
    
              {promptingAddTask && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter task title"
                    value={taskTitle}
                    onChangeText={(text) => setTaskTitle(text)}
                  />
                   <DatePicker
                  value={taskDate}
                  mode="date"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setTaskDate(selectedDate);
                    }
                  }}
                />
                <Button
                  title="Save Task"
                  onPress={() => {
                    handleAddTask();
                    setPromptingAddTask(false);
                    setTaskTitle('');
                    setTaskDate(new Date()); // Reset the date picker to today's date after saving the task
                  }}
                />
                </View>
              )}
            </View>
            
            <TouchableOpacity
              onPress={() => {
                setMyListState(LIST_SCREEN_STATE);
                setPromptingAddTask(false);
              }}
              style={styles.backButtonContainer}
            >
              <Text style={styles.backButtonText}>Back to Lists</Text>
            </TouchableOpacity>
          </View>

        );
      } else {
        whatToDisplay = null;
      }
      break;
      
    default:
      whatToDisplay = null;
  }
  return whatToDisplay;
};

//Styling for Tasks and List
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e8e3dd",
    flex: 1,
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 20,
  },
  header: {
    fontSize: 30, 
    fontWeight: "bold",
    marginBottom: 20,
    color: "#88735c",
    textAlign: "center",
  },
  noLists: {
    fontSize: 20,
    fontStyle: "italic",
  },
  list: {
    marginBottom: 5,
    margin: 20,
    padding: 20,
    backgroundColor: "#667e52",
  },
  deleteButton: {
    position: "absolute",
    right: 5,
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    borderRadius: 5,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "black",
  },
  backButtonContainer: {
    backgroundColor: '#88735c',
    position: "absolute",
    bottom: 25,
    right: 20,
    borderWidth: 1,
    borderColor: "#000",
    padding: 15,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16, 
  },
  addList: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    margin: 20,
  },
  inputContainer: {
    marginTop: 20,
  },
  input: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkbox: {
    width: 16,
    height: 16,
  },
  checked: {
    backgroundColor: '#000',
  },
  unchecked: {
    backgroundColor: 'transparent',
  },
  navBar: {
    justifyContent: "flex-end",
    flex: 1,
  },
  bottomBar: {
    backgroundColor: "#678239",
    flexDirection: "row",
    justifyContent: "center",
    bottom: 10,
    paddingBottom: 5,
    paddingTop: 5,
    paddingHorizontal: 20,
    borderRadius: 20,
    margin: 20,
    justifyContent: "space-around"
  },
  icon: {
    width: 60,
    height: 60,
    // Adjust styles as needed
  },
});

export default Tasks;