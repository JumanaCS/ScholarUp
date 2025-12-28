import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Dimensions, useWindowDimensions, Modal, Text, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { LoginScreen, SignUpScreen, HomeScreen, TimerScreen, FlashCardsScreen, SetDetailScreen, QuizScreen, ListsScreen, ListDetailScreen, StatsScreen } from './src/screens';
import { Colors } from './src/constants';
import { ListsProvider, TimerProvider, useTimer, StatsProvider, AuthProvider, FlashCardsProvider, useAuth } from './src/context';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const timerIcon = require('./src/assets/images/Timer.png');
const flashCardsIcon = require('./src/assets/images/FlashCards.png');
const homeIcon = require('./src/assets/images/Home.png');
const listsIcon = require('./src/assets/images/Lists.png');
const statsIcon = require('./src/assets/images/Stats.png');

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  // Use the shorter dimension to detect tablet - phones have shorter side < 500
  const shortSide = Math.min(width, height);
  const isTablet = shortSide >= 600;

  console.log('Screen dimensions:', width, 'x', height, 'isTablet:', isTablet);

  const icons: { [key: string]: any } = {
    Timer: timerIcon,
    FlashCards: flashCardsIcon,
    Home: homeIcon,
    Lists: listsIcon,
    Stats: statsIcon,
  };

  // Calculate navbar width for tablets to match mobile look
  const navbarWidth = isTablet ? 420 : undefined;

  const dynamicStyles = {
    tabBarContainer: {
      position: 'absolute' as const,
      bottom: isTablet ? 30 : 25,
      left: isTablet ? (width - navbarWidth!) / 2 : 30,
      right: isTablet ? (width - navbarWidth!) / 2 : 30,
    },
    tabButton: {
      width: isTablet ? 65 : 55,
      height: isTablet ? 65 : 55,
    },
    tabIcon: {
      width: isTablet ? 58 : 53,
      height: isTablet ? 58 : 53,
    },
    tabIconActive: {
      width: isTablet ? 54 : 49,
      height: isTablet ? 54 : 49,
    },
  };

  return (
    <View style={dynamicStyles.tabBarContainer}>
      <View style={tabStyles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={1}
              style={[
                tabStyles.tabButton,
                dynamicStyles.tabButton,
                { backgroundColor: isFocused ? Colors.activeGreen : Colors.mediumGreen },
              ]}
            >
              <Image
                source={icons[route.name]}
                style={[
                  dynamicStyles.tabIcon,
                  isFocused && dynamicStyles.tabIconActive,
                ]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Component to handle app state changes and show leave modal
const AppStateHandler = () => {
  const { isTimerRunning, resetTimer } = useTimer();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const appState = useRef(AppState.currentState);
  const wasTimerRunningWhenLeft = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // App is going to background - remember if timer was running
      if (appState.current === 'active' && (nextAppState === 'inactive' || nextAppState === 'background')) {
        if (isTimerRunning) {
          wasTimerRunningWhenLeft.current = true;
        }
      }

      // App is coming back to foreground - show popup if timer was running when they left
      if ((appState.current === 'inactive' || appState.current === 'background') && nextAppState === 'active') {
        if (wasTimerRunningWhenLeft.current && isTimerRunning) {
          setShowLeaveModal(true);
          wasTimerRunningWhenLeft.current = false;
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isTimerRunning]);

  const handleEndTimer = () => {
    resetTimer();
    setShowLeaveModal(false);
  };

  const handleContinue = () => {
    setShowLeaveModal(false);
  };

  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  const dynamicModalStyles = {
    container: {
      width: isTablet ? 400 : '85%',
      maxWidth: isTablet ? 400 : 320,
      padding: isTablet ? 35 : 25,
    },
    title: {
      fontSize: isTablet ? 24 : 22,
    },
    message: {
      fontSize: isTablet ? 17 : 15,
      marginBottom: isTablet ? 30 : 20,
    },
    button: {
      paddingVertical: isTablet ? 14 : 11,
      paddingHorizontal: isTablet ? 30 : 22,
    },
    buttonText: {
      fontSize: isTablet ? 18 : 15,
    },
  };

  return (
    <Modal visible={showLeaveModal} transparent animationType="fade">
      <View style={leaveModalStyles.overlay}>
        <View style={[leaveModalStyles.container, dynamicModalStyles.container]}>
          <Text style={[leaveModalStyles.title, dynamicModalStyles.title]}>You Left the App</Text>
          <Text style={[leaveModalStyles.message, dynamicModalStyles.message]}>
            You left while your timer was running. Would you like to continue or end your session?
          </Text>
          <View style={leaveModalStyles.buttonRow}>
            <TouchableOpacity style={[leaveModalStyles.stayButton, dynamicModalStyles.button]} onPress={handleContinue}>
              <Text style={[leaveModalStyles.stayButtonText, dynamicModalStyles.buttonText]}>Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[leaveModalStyles.leaveButton, dynamicModalStyles.button]} onPress={handleEndTimer}>
              <Text style={[leaveModalStyles.leaveButtonText, dynamicModalStyles.buttonText]}>End Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const tabStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.navGreen,
    borderRadius: 18,
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabButton: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const leaveModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontFamily: 'Mini',
    fontSize: 22,
    color: '#000',
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Mini',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  stayButton: {
    backgroundColor: '#99AD8C',
    borderRadius: 25,
    alignItems: 'center',
  },
  stayButtonText: {
    fontFamily: 'Mini',
    color: '#fff',
  },
  leaveButton: {
    backgroundColor: '#E88B8B',
    borderRadius: 25,
    alignItems: 'center',
  },
  leaveButtonText: {
    fontFamily: 'Mini',
    color: '#fff',
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Home"
    >
      <Tab.Screen name="Timer" component={TimerScreen} />
      <Tab.Screen name="FlashCards" component={FlashCardsScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Lists" component={ListsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// Navigation component that checks auth state
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#CDE19C' }}>
        <ActivityIndicator size="large" color="#84A169" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is signed in - show main app
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'none' }} />
            <Stack.Screen name="SetDetail" component={SetDetailScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="Quiz" component={QuizScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="ListDetail" component={ListDetailScreen} options={{ animation: 'none' }} />
          </>
        ) : (
          // User is not signed in - show auth screens
          <>
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ animation: 'none' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'none' }} />
          </>
        )}
      </Stack.Navigator>
      <AppStateHandler />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Mini': require('./src/assets/fonts/mini.otf'),
    'BPreplay': require('./src/assets/fonts/BPreplay/BPreplay.otf'),
    'BPreplay-Bold': require('./src/assets/fonts/BPreplay/BPreplayBold.otf'),
    'BPreplay-Italic': require('./src/assets/fonts/BPreplay/BPreplayItalics.otf'),
    'BPreplay-BoldItalic': require('./src/assets/fonts/BPreplay/BPreplayBoldItalics.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#CDE19C' }}>
        <ActivityIndicator size="large" color="#84A169" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <TimerProvider>
        <ListsProvider>
          <StatsProvider>
            <FlashCardsProvider>
              <AppNavigator />
            </FlashCardsProvider>
          </StatsProvider>
        </ListsProvider>
      </TimerProvider>
    </AuthProvider>
  );
}
