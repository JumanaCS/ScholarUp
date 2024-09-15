/*
Kailey Bergeron 
HomeScreen
Dec. 8th, 2023

fitst must:
npm install moment
*/

import React, { useState, useEffect } from "react";
import { Text, StyleSheet, View, Image, TouchableOpacity } from "react-native";
// import for date
import moment from "moment";
//import for Tasks
import Tasks from "./Tasks"; 

const HomeScreen = ({ navigation }) => {
  // State for the current date
  const [currentDate, setCurrentDate] = useState(moment());

  // Function to move to the previous week
  const goToPreviousWeek = () => {
    setCurrentDate(currentDate.clone().subtract(1, "week"));
  };

  // Function to move to the next week
  const goToNextWeek = () => {
    setCurrentDate(currentDate.clone().add(1, "week"));
  };

  // Function to render the days of the week
  const renderWeekDays = () => {
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = currentDate.clone().startOf("week").add(i, "days");
      const dayNumber = day.format("D");
      // Highlight current day
      const isSelectedDay = day.isSame(moment(), "day");
      // Render each day as a TouchableOpacity
      days.push(
        <TouchableOpacity
          key={i}
          style={[styles.dayCircle, isSelectedDay && styles.selectedDay]}
          onPress={() => {
            // Handle day selection here
          }}
        >
          <Text style={styles.dayText}>{dayNumber}</Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

 // Function to get tasks for the current day
 const getTasksForCurrentDay = () => {
  // Logic to filter tasks for the current day
  if (selectedListIndex !== null) {
    const selectedList = lists[selectedListIndex];
    const selectedListTasks = selectedList.tasks || [];

    return selectedListTasks.filter((task) => {
      // Compare task date with the current date
      const taskDate = new Date(task.date);
      const currentDate = new Date();

      return (
        taskDate.getFullYear() === currentDate.getFullYear() &&
        taskDate.getMonth() === currentDate.getMonth() &&
        taskDate.getDate() === currentDate.getDate()
      );
    });
  }

  return [];
};

// Function to render tasks for the current day
const renderTasksForCurrentDay = () => {
  const tasksForCurrentDay = getTasksForCurrentDay();

  if (tasksForCurrentDay.length === 0) {
    // Render no tasks available
    return (
      <View style={styles.noTasksContainer}>
        <Image source={require("./../../assets/images/homeScreen.jpg")} />
      </View>
      
    );
  }

  // Render tasks for the current day
  return tasksForCurrentDay.map((task, index) => (
    <View key={index} style={styles.taskRow}>
      <Text>{task.title}</Text>
      <TouchableOpacity
        onPress={() => {
          const updatedCompletedTasks = { ...completedTasks };
          updatedCompletedTasks[`${selectedListIndex}-${index}`] = !completedTasks[`${selectedListIndex}-${index}`];
          setCompletedTasks(updatedCompletedTasks);
        }}
        style={[
          styles.checkbox,
          // Add conditional styles based on completion status
          styles.checkbox,
          completedTasks[`${selectedListIndex}-${index}`] ? styles.checked : styles.unchecked,
        ]}
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(index)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  ));
};

return (
  <View style={styles.container}>
    {/* Header with Month and Arrows */}
    <View style={styles.topContainer}>
      <View style={styles.header}>
        {/* Button to go to the previous week */}
        <TouchableOpacity onPress={goToPreviousWeek}>
          <Text style={styles.arrow}>{'<'}</Text>
        </TouchableOpacity>
        {/* Display current month */}
        <Text style={styles.monthText}>{currentDate.format("MMMM")}</Text>
        {/* Button to go to the next week */}
        <TouchableOpacity onPress={goToNextWeek}>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days Circles */}
      <View style={styles.weekDaysContainer}>{renderWeekDays()}</View>
    </View>

      <View style={styles.noTasksContainer}>
        <Image source={require("./../../assets/images/homeScreen.png")} />
      </View>


    {/* Reusable Bottom Navigation Bar */}
    <View style={styles.bottomBar}>
      {/* Navigation buttons */}
      <TouchableOpacity onPress={() => navigation.navigate("Timer")}>
        <Image source={require("../../assets/images/clock.png")} style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Flash")}>
        <Image source={require("../../assets/images/flashcards.png")} style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Image source={require("../../assets/images/homelogo.png")} style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Tasks")}>
        <Image source={require("../../assets/images/calender.png")} style={styles.icon} />
      </TouchableOpacity>
    </View>
  </View>
);
};


//styling for HomeScreen
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e8e3dd",
    flex: 1,
    justifyContent: "space-between",
  },
  topContainer: {
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  arrow: {
    fontSize: 30, 
    fontStyle: "bold",
  },
  monthText: {
    fontSize: 35,
  },
  weekDaysContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#a9ba9d",
  },
  selectedDay: {
    // Highlight color for the current day
    backgroundColor: "#88735c", 
  },
  dayText: {
    fontSize: 16,
  },
  noTasksContainer: {
    margin: 50,
  },
  bottomBar: {
    backgroundColor: "#667e52",
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 5,
    paddingTop: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    margin: 20,
    justifyContent: "space-around",
  },
  icon: {
    width: 60,
    height: 60,
  },
});

export default HomeScreen;