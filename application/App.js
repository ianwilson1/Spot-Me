import React, { useState, useRef } from 'react';
import { Text, View, Alert, StyleSheet} from 'react-native';
import Toolbar from './components/Toolbar.js'
import MainMap from './components/Map.js';

export default function App () {
  const mapRef = useRef(null);

  // Re-orient map to north (compass button)
  const realignMap = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({heading: 0});
    }
  }

  return (
    <View style={styles.container}>
      <Text>If you see this, something is terribly wrong!</Text>
      <MainMap ref={mapRef}/>
      <Toolbar realignMap={realignMap}/>
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
  }
});