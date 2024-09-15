//Jumana Suleiman 
// Dec 8th 2023

import React, {useState} from 'react';
import {View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ImageBackground} from 'react-native';

const SignUp = (props) => {
  // State variables for the two input bars
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <View style={styles.container}>
      <ImageBackground
            source={require("../../assets/images/UserPage.png")}
            style={styles.backgroundImage}
      /> 

      {/* ScholarUp Image */}
      <Image
        style={styles.image}
        source={require("../../assets/images/logo.png")}
      />

       {/* First input User */}
       <TextInput
         style={styles.input}
         placeholder="enter email"
         value={email}
         onChangeText={setEmail}
      />

      {/* Second input User */}
      <TextInput
         style={styles.input}
         placeholder="enter username"
         value={username}
         onChangeText={setUsername}
      />

      {/* Third input Password */}
      <TextInput
        style={styles.input}
        placeholder="enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Fourth input User */}
      <TextInput
         style={styles.input}
         placeholder="confirm password"
         value={confirm}
         onChangeText={setConfirm}
      />

      {/* bar sign up */}
      <TouchableOpacity style={styles.bar} onPress= {function(){props.navigation.navigate("Home")}}>
          <Text style={styles.text}>sign up</Text>
        </TouchableOpacity>

      {/* Clickable text at the bottom for log in */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Have an account?</Text>
        <TouchableOpacity onPress= {function(){props.navigation.navigate('SignIn')}}>
          <Text style={[styles.footerText, styles.link]}>Log in</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  backgroundImage:{
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 0.5, // changed from no flex
    //opacity: 0.3,     
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // changed from 'space-evenly'
    flexDirection: "column",
  },
  image: { 
    marginBottom: 10,
    flex: 0.5, // changed from 1
    width: 350,
    height: "100%",
    resizeMode: "contain", 
  },
  input: {
    width: 260,
    height: 50,
    backgroundColor: '#84a169',
    borderRadius: 25,
    padding: 10,
    fontSize: 18,
    marginBottom: 20,
  },
  bar: {
    marginBottom: 15,
    width: 100,
    height: 50,
    backgroundColor: '#88725b',
    borderRadius: 25,
    padding: 10,
    fontSize: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginTop: 10,
    fontSize: 18,
    color: '#84a169',
    marginHorizontal: 5,
    fontWeight: "bold",
  },
  link: {
    marginTop: 10,
    fontSize: 18,
    color: "#88725b",
    fontWeight: "bold",
  },
});

export default SignUp;

