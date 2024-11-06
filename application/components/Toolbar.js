import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, Text, Platform  } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {LoginScreen, RegisterScreen} from './Accounts';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const Toolbar = ({realignMap, saveLocation, navigation}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const goToAccount = () => {
    if (!isLoggedIn) {
      Alert.alert(
        "",
        "You are currently not logged in.",
        [
          {text: "Log In", onPress: () => navigation.navigate('Login')},
          {text: "Register", onPress: () => navigation.navigate('Register')},
          {text: "Cancel", style: "Cancel"}
        ]
      )
    } else {
      Alert.alert(
        "Logged In",
        "You are currently logged in.",
        [
          { text: "Log Out", onPress: () => setIsLoggedIn(false) },
          { text: "OK", style: "cancel" }
        ]
      );
    }
  };

  const refreshData = () => {
    Alert.alert("TODO: Implement refresh following database implementation.");
  };
    return (
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={realignMap} style={styles.iconContainer}>
          <Ionicons name="compass" size={32} color="white" />
          <Text style={styles.iconLabel}>North</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveLocation} style={styles.iconContainer}>
          <MaterialIcons name="directions-car" size={32} color="white" />
          <Text style={styles.iconLabel}>My Car</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToAccount} style={styles.iconContainer}>
          <Ionicons name="person" size={32} color="white" />
          <Text style={styles.iconLabel}>My Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshData} style={styles.iconContainer}>
          <Ionicons name="refresh-circle" size={32} color="white" />
          <Text style={styles.iconLabel}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'red',
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      width: '100%',
      bottom: 0,
      height: 90,
      justifyContent: 'space-around',
      paddingBottom: 30,
      backgroundColor: 'darkblue',
    },
    iconContainer: {
      alignItems: 'center',
      paddingHorizontal: '20',
    },
    iconLabel: {
      marginTop: 3,
      fontSize: 12,
      textAlign: 'center',
      color: 'white',
    },
  });

export default Toolbar;