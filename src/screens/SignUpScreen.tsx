import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors } from '../constants';
import { useAuth } from '../context';

const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 600;

const logo = require('../assets/images/logo.png');
const star = require('../assets/images/star.png');
const leaves = require('../assets/images/leaves.gif');

const GRID_SIZE = 30;

const GridBackground = () => {
  const horizontalLines = [];
  const verticalLines = [];

  for (let i = 0; i <= height / GRID_SIZE; i++) {
    horizontalLines.push(
      <Line
        key={`h-${i}`}
        x1="0"
        y1={i * GRID_SIZE}
        x2={width}
        y2={i * GRID_SIZE}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1"
      />
    );
  }

  for (let i = 0; i <= width / GRID_SIZE; i++) {
    verticalLines.push(
      <Line
        key={`v-${i}`}
        x1={i * GRID_SIZE}
        y1="0"
        x2={i * GRID_SIZE}
        y2={height}
        stroke="rgba(255, 255, 255, 0.4)"
        strokeWidth="1"
      />
    );
  }

  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
      {horizontalLines}
      {verticalLines}
    </Svg>
  );
};

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  // Spinning animations for stars
  const spinTopRight = useRef(new Animated.Value(0)).current;
  const spinMiddleLeft = useRef(new Animated.Value(0)).current;
  const spinBottomRight = useRef(new Animated.Value(0)).current;
  const spinTopLeft = useRef(new Animated.Value(0)).current;
  const spinBottomLeft = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startSpinning = (animValue: Animated.Value, duration: number) => {
      animValue.setValue(0);
      Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    };

    startSpinning(spinTopRight, 8000);
    startSpinning(spinMiddleLeft, 5000);
    startSpinning(spinBottomRight, 3000);
    startSpinning(spinTopLeft, 6000);
    startSpinning(spinBottomLeft, 7000);
  }, [spinTopRight, spinMiddleLeft, spinBottomRight, spinTopLeft, spinBottomLeft]);

  const spinTopRightInterpolate = spinTopRight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinMiddleLeftInterpolate = spinMiddleLeft.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const spinBottomRightInterpolate = spinBottomRight.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinTopLeftInterpolate = spinTopLeft.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinBottomLeftInterpolate = spinBottomLeft.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const handleSignUp = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await signUp(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      if (result.needsVerification) {
        Alert.alert(
          'Verify Your Email',
          'We sent a verification link to your email. Please check your inbox and verify your email before logging in.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
      // Navigation happens automatically via auth state change
    } else {
      Alert.alert('Sign Up Failed', result.error || 'An error occurred');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      // Navigation happens automatically via auth state change
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in
      } else {
        // Other error
        console.log('Apple Sign In Error:', e);
      }
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {/* Grid Background */}
        <GridBackground />

        {/* Leaves - behind everything */}
        <Image source={leaves} style={styles.leaves} resizeMode="contain" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
        {/* Stars */}
        <Animated.Image
          source={star}
          style={[
            styles.starTopRight,
            { transform: [{ rotate: spinTopRightInterpolate }] },
          ]}
        />
        <Animated.Image
          source={star}
          style={[
            styles.starMiddleLeft,
            { transform: [{ rotate: spinMiddleLeftInterpolate }] },
          ]}
        />
        <Animated.Image
          source={star}
          style={[
            styles.starBottomRight,
            { transform: [{ rotate: spinBottomRightInterpolate }] },
          ]}
        />
        {/* Extra stars for iPad */}
        {isTablet && (
          <>
            <Animated.Image
              source={star}
              style={[
                styles.starTopLeft,
                { transform: [{ rotate: spinTopLeftInterpolate }] },
              ]}
            />
            <Animated.Image
              source={star}
              style={[
                styles.starBottomLeftStar,
                { transform: [{ rotate: spinBottomLeftInterpolate }] },
              ]}
            />
          </>
        )}

        <View style={styles.contentContainer}>
          {/* Logo */}
          <Image source={logo} style={styles.logo} resizeMode="contain" />

          {/* Input fields */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              {email.length === 0 && !emailFocused && (
                <Text style={styles.placeholderText}>enter email</Text>
              )}
              <TextInput
                style={styles.input}
                placeholder={emailFocused ? "enter email" : ""}
                placeholderTextColor={Colors.white}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                selection={!emailFocused && email.length > 0 ? { start: 0, end: 0 } : undefined}
              />
            </View>

            <View style={styles.inputWrapper}>
              {password.length === 0 && !passwordFocused && (
                <Text style={styles.placeholderText}>enter password</Text>
              )}
              <TextInput
                style={styles.input}
                placeholder={passwordFocused ? "enter password" : ""}
                placeholderTextColor={Colors.white}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                selection={!passwordFocused && password.length > 0 ? { start: 0, end: 0 } : undefined}
              />
            </View>

            <View style={styles.inputWrapper}>
              {confirmPassword.length === 0 && !confirmPasswordFocused && (
                <Text style={styles.placeholderText}>confirm password</Text>
              )}
              <TextInput
                style={styles.input}
                placeholder={confirmPasswordFocused ? "confirm password" : ""}
                placeholderTextColor={Colors.white}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="oneTimeCode"
                autoComplete="off"
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                selection={!confirmPasswordFocused && confirmPassword.length > 0 ? { start: 0, end: 0 } : undefined}
              />
            </View>

            {/* Sign Up button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.signUpButtonText}>sign up</Text>
              )}
            </TouchableOpacity>

            {/* Sign in with Apple (iOS only) */}
            {Platform.OS === 'ios' && (
              <>
                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={25}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

        {/* Login link - fixed at bottom */}
        <View style={styles.loginContainer}>
          <Text style={styles.haveAccountText}>Have an account? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGreen,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
    paddingBottom: height * 0.02,
  },
  logo: {
    width: isTablet ? width * 0.5 : width * 0.85,
    height: isTablet ? height * 0.12 : height * 0.15,
    marginBottom: height * 0.08,
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    width: isTablet ? '50%' : '85%',
    height: isTablet ? 60 : 45,
    backgroundColor: Colors.darkGreen,
    borderRadius: 30,
    marginBottom: isTablet ? 18 : 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: isTablet ? 60 : 45,
    maxHeight: isTablet ? 60 : 45,
    paddingHorizontal: 25,
    fontSize: isTablet ? 24 : 20,
    fontFamily: 'Mini',
    color: Colors.white,
  },
  inputWithText: {
    textAlign: 'left',
  },
  inputHidden: {
    position: 'absolute',
    opacity: 0,
  },
  placeholderText: {
    position: 'absolute',
    fontSize: isTablet ? 24 : 20,
    fontFamily: 'Mini',
    color: Colors.white,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  signUpButton: {
    backgroundColor: Colors.lightBrown,
    paddingVertical: isTablet ? 14 : 10,
    paddingHorizontal: isTablet ? 45 : 30,
    borderRadius: 25,
    marginTop: isTablet ? 12 : 8,
  },
  signUpButtonText: {
    color: Colors.white,
    fontSize: isTablet ? 22 : 16,
    fontFamily: 'Mini',
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: isTablet ? 20 : 15,
    marginBottom: isTablet ? 15 : 10,
    width: isTablet ? '50%' : '85%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.darkGreen,
  },
  dividerText: {
    color: Colors.darkGreen,
    fontSize: isTablet ? 18 : 14,
    fontFamily: 'Mini',
    marginHorizontal: 15,
  },
  appleButton: {
    width: isTablet ? '50%' : '85%',
    height: isTablet ? 55 : 45,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: isTablet ? 'center' : 'flex-end',
    paddingBottom: height * 0.05,
    paddingRight: isTablet ? 0 : width * 0.2,
  },
  haveAccountText: {
    color: Colors.darkGreen,
    fontSize: isTablet ? 22 : 16,
    fontFamily: 'Mini',
  },
  loginText: {
    color: Colors.lightBrown,
    fontSize: isTablet ? 22 : 16,
    fontFamily: 'Mini',
    textDecorationLine: 'underline',
  },
  starTopRight: {
    position: 'absolute',
    top: height * 0.06,
    right: width * 0.08,
    width: isTablet ? width * 0.08 : width * 0.14,
    height: isTablet ? width * 0.08 : width * 0.14,
  },
  starMiddleLeft: {
    position: 'absolute',
    top: isTablet ? height * 0.42 : height * 0.38,
    left: width * 0.05,
    width: isTablet ? width * 0.05 : width * 0.09,
    height: isTablet ? width * 0.05 : width * 0.09,
  },
  starBottomRight: {
    position: 'absolute',
    bottom: height * 0.15,
    right: width * 0.08,
    width: isTablet ? width * 0.07 : width * 0.12,
    height: isTablet ? width * 0.07 : width * 0.12,
  },
  starTopLeft: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.12,
    width: width * 0.06,
    height: width * 0.06,
  },
  starBottomLeftStar: {
    position: 'absolute',
    bottom: height * 0.25,
    left: width * 0.15,
    width: width * 0.05,
    height: width * 0.05,
  },
  leaves: {
    position: 'absolute',
    bottom: isTablet ? -75 : -40,
    left: isTablet ? -10 : -10,
    width: isTablet ? width * 0.3 : width * 0.45,
    height: isTablet ? height * 0.3 : height * 0.25,
  },
});
