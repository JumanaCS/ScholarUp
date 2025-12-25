import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  HomeScreen,
  TimerScreen,
  FlashCardsScreen,
  ListsScreen,
  StatsScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="FlashCards" component={FlashCardsScreen} />
        <Tab.Screen name="Lists" component={ListsScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
