import React, { useState, useRef } from 'react';
import { Text, View, Alert, StyleSheet} from 'react-native';
import Toolbar from './components/Toolbar.js';
import MainMap from './components/Map.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {LoginScreen, RegisterScreen} from './components/Accounts.js';

const Stack = createStackNavigator();

export default function App () {
  const mapRef = useRef(null);

  // Re-orient map to north (compass button)
  const realignMap = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({heading: 0});
    }
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name = "Main" options={{headerShown: false}}>
          {props => (
            <View style={ styles.container }>
              <MainMap ref={mapRef}/>
              <Toolbar {...props} realignMap={realignMap}/>
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen name="Login" component={LoginScreen}/>
        <Stack.Screen name="Register" component={RegisterScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  }
});