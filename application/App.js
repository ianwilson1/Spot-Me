import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, StyleSheet} from 'react-native';
import Toolbar from './components/Toolbar.js';
import MapView, { Marker } from 'react-native-maps';
import {LoginScreen, RegisterScreen} from './components/Accounts.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Location from 'expo-location';

const Stack = createStackNavigator();

export default function App () {
  // Refs (for tracking objects between components)
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // States
  const [carLocation, setCarLocation] = useState(null);

  // Establish connection to server
  useEffect( () => {
    const ConnectToServer = () => {
      const client = new WebSocket('ws://34.105.119.88:15024')
      socketRef.current = client;
    };

    ConnectToServer();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    }
  }, [])

  // CALL THIS TO SEND MESSAGE TO THE SERVER!
  // Returns the server response.
  const sendMsg = (msg) => {
    const socket = socketRef.current;

    return new Promise((resolve, reject) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
      
        socket.onmessage = (event) => {
          resolve(event.data); 
        }
  
        socket.onerror = (error) => {
          reject('ERROR: ' + error);
        }
      }
      else {
        reject('ERROR: Could not connect to server!')
      }
    });
  };

  // Re-orient map to north (compass button)
  const realignMap = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({heading: 0});
    }
  }

  // Save user's parked car location (aka create persistent marker of current location)
  const saveLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location permission required to use this feature.');
          return;
        }
        Alert.alert(
          "Save car location?", "", [
            { 
              text: "Yes",
              onPress: async () => {
                let carLoc = await Location.getCurrentPositionAsync({});
                            
                setCarLocation(carLoc.coords);
              }
            },
            { 
              text: "Cancel" 
            }
          ]
        );
    } 
    else {
      Alert.alert(
        "Already saved!", "", [
          { 
            text: "Locate",
            onPress: () => {
              if (mapRef.current) {
                mapRef.current.animateToRegion({ // Center and zoom in on car's location
                    latitude: carLocation.latitude,
                    longitude: carLocation.longitude,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                }, 1000);
              }
            }
          },
          {
            text: "Update", // TODO: Update saved car location
            onPress: async () => {
              let newLoc = await Location.getCurrentPositionAsync({});
              setCarLocation(newLoc.coords);
            }
          },
          {
            text: "Forget",
            onPress: () => setCarLocation(null)
          },
        ]
      );
    }
  };

  const refreshData = async () => {
    let msg = JSON.stringify({ "op":"RefreshData" })
      try {
        const data = await sendMsg(msg);


      } 
      catch (error) {
        console.error('Error sending message:', error);
      }
    }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name = "Main" options={{headerShown: false}}>
          {props => (
            <View style={ styles.container }>

              <MapView 
                ref={mapRef}
                style={styles.map}
                setCamera={{
                    heading: 50,
                }}
                minZoomLevel={15}
                initialRegion={{
                    latitude: 36.81369124340123,
                    longitude: -119.7455163161234,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
              >
                {carLocation != null && (
                    <Marker
                        title = {'Your Car'}
                        pinColor={'navy'}
                        coordinate = {{
                            latitude: carLocation.latitude,
                            longitude: carLocation.longitude,
                        }}
                    />
                )}
            </MapView>

              <Toolbar {...props} realignMap={realignMap} saveLocation={saveLocation} refreshData={refreshData}/>
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Register"
          children={(screenProps) => (
            <RegisterScreen {...screenProps} sendMsg={sendMsg} />
          )}
        />
        <Stack.Screen
          name="Login"
          children={(screenProps) => (
            <LoginScreen {...screenProps} sendMsg={sendMsg}/>
          )}/>
      </Stack.Navigator>
    </NavigationContainer>
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
  map: {
    ...StyleSheet.absoluteFillObject,
  }
});