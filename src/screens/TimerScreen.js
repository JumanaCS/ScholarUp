// Jumana Suleiman 
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from "react-native";

// Define a custom component for each timer
const Timer = ({ title, initialTime, navigation }) => {
  // Use state variables to store the current time, status and button text
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [buttonText, setButtonText] = useState("Start");

  // Use a useEffect hook to update the time every second when the timer is running
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {

          // If the time reaches zero, stop the timer and reset the button text
          if (prevTime === 0) {
            setIsRunning(false);
            setButtonText("Start");
            return 0;
          }

          // Otherwise, decrement the time by one second
          return prevTime - 1;
        });
      }, 1000);
    } else {
      // Clear the interval when the timer is not running
      clearInterval(interval);
    }
    // Return a cleanup function to clear the interval
    return () => clearInterval(interval);
  }, [isRunning]);

  // function to handle the button pres
  const handlePress = () => {
    // the running status and the button text
    setIsRunning((prevStatus) => !prevStatus);
    setButtonText((prevText) => (prevText === "Start" ? "Pause" : "Start"));
  };

  // Format the time in minutes and seconds
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const formattedTime = `${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`; // rewatch video 

  return (
    <View style={styles.timer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.line} />
      <TouchableOpacity onPress={handlePress}>
        <Text style={styles.time}>{formattedTime}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

//  main 
const TimerScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/images/timerBack.png")}
        style={styles.backgroundImage}
      />
      <Timer title="Focus" initialTime={1500} />
      <Timer title="Break" initialTime={300} />
      
      <View style={styles.navBar}>
        <View style={styles.bottomBar}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  timer: {
    width: 150,
    height: 300,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    marginTop: 150,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  line: {
    width: "100%",
    height: 1,
    backgroundColor: "black",
    marginVertical: 10,
  },
  time: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#212121",
  },
  button: {
    width: 100,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#93a9ac",
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  navBar: {
    position: "absolute",
    bottom: 10,
    width: "80%", 
    height: "auto",
    borderRadius: 20,
    margin: 10,
    borderTopColor: "#000", // Changed border color to match HomeScreen
    backgroundColor: "#667e52", // Changed background color to match HomeScreen
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    
  },
  icon: {
    width: 60,
    height: 60,
  },
});

export default TimerScreen;