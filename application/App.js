import React from 'react';
import { Text, View, Alert, StyleSheet} from 'react-native';
import Toolbar from './components/Toolbar.js'
import MainMap from './components/Map.js';
import MapView from 'react-native-maps';

export default function App () {
  return (
    <View style={ styles.container }>
      <MainMap />
      <Toolbar />
    </View>
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