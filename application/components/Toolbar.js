import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {LoginScreen, RegisterScreen} from './Accounts';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';


const Toolbar = ({realignMap, navigation}) => {
  const [carLocSaved, setCarLocSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const saveLocation = () => {
    if (!carLocSaved) {
      Alert.alert(
        "Save car location?", "", [
          { 
            text: "Yes",
            onPress: () => { // IMPLEMENT CAR SAVE FUNCTION AND CALL HERE
              setCarLocSaved(true); 
              Alert.alert("TODO: Save user's current position");
            }
          },
          { 
            text: "Cancel" 
          }
        ]
      );
    } else {
      Alert.alert(
        "Car location saved.", "", [
          { 
            text: "View",
            onPress: () => Alert.alert("TODO: Move camera to saved location")
          },
          {
            text: "Forget" // TODO: Forget saved car location 
          },
          {
            text: "Cancel"
          }
        ]
      );
    }
  };

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
          <Ionicons name="compass" size={32} color="black" />
          <Text style={styles.iconLabel}>North</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveLocation} style={styles.iconContainer}>
          <MaterialIcons name="directions-car" size={32} color="black" />
          <Text style={styles.iconLabel}>My Car</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToAccount} style={styles.iconContainer}>
          <Ionicons name="person" size={32} color="black" />
          <Text style={styles.iconLabel}>My Account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={refreshData} style={styles.iconContainer}>
          <Ionicons name="refresh-circle" size={32} color="black" />
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
      flexDirection: 'column',
      alignItems: 'flex-end',
      position: 'absolute',
      top: 60,
      right: 25,
      height: 220,
      justifyContent: 'space-between',
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 60,
    },
    iconLabel: {
      marginTop: 3,
      fontSize: 12,
      textAlign: 'center',
    },
  });

export default Toolbar;