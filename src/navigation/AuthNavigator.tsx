import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, SignUpScreen } from '../screens';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
        animationDuration: 0,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'none' }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ animation: 'none' }}
      />
    </Stack.Navigator>
  );
}
