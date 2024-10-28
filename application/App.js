import React from 'react';
import { Text, View, Alert, StyleSheet} from 'react-native';
import Toolbar from './components/Toolbar.js'
import MainMap from './components/Map.js';
import MapView from 'react-native-maps';

export default function App () {
  return (
    <View style={ styles.container }>
      <MainMap />
      <MapView 
        style={styles.map}
        initialRegion={{
            latitude: 36.81369124340123,
            longitude: -119.7455163161234,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }}
      >
      </MapView>
      <Toolbar />
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