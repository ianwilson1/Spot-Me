import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const Toolbar = ({realignMap}) => {
  const [carLocSaved, setCarLocSaved] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const saveLocation = () => {
    if (!carLocSaved) {
      Alert.alert("Car Location saved.", "", [{ text: "OK" }]);
      setCarLocSaved(true);
    } else {
      Alert.alert("Car location unsaved.", "", [{ text: "OK" }]);
      setCarLocSaved(false);
    }
  };

  const goToAccount = () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Account Options",
        "Please log in or register.",
        [
          { text: "Log In", onPress: () => setIsLoggedIn(true) },
          { text: "Register", onPress: () => setIsLoggedIn(true) },
          { text: "Cancel", style: "cancel" }
        ]
      );
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
    Alert.alert("Data refreshed.");
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