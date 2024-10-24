import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const Toolbar = ({ realignMap, saveLocation, goToAccount, refreshData }) => {
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

const MainScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parking App Toolbar</Text>
      <Toolbar 
        realignMap={() => console.log("Realign Map")} 
        saveLocation={() => console.log("Save Location")} 
        goToAccount={() => console.log("Go to Account")} 
        refreshData={() => console.log("Refresh Data")} 
      />
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

export default MainScreen;
