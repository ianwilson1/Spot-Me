import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, StyleSheet, Text} from 'react-native';
import Toolbar from './components/Toolbar.js';
import MapView, { Marker, Polygon } from 'react-native-maps';
import {LoginScreen, RegisterScreen, AccountMenuScreen, UpdateAccount, UpdateUsername, UpdatePasswd} from './components/Accounts.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';

const Stack = createStackNavigator();

export default function App () {
  // Refs (for tracking objects between components)
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // States
  const [carLocation, setCarLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [zoom, setZoom] = useState(0);

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

  //Start of provisional code for parking lot overlay (part1)
  //Define first parking spot coordinates
  const parkingLotBaseCoords = [
    { latitude: 36.8139167, longitude: -119.7424710 }, // Lower Left
    { latitude: 36.8139167, longitude: -119.7424399 }, // Lower Right
    { latitude: 36.8139700, longitude: -119.7424399 }, // Upper Right
    { latitude: 36.8139700, longitude: -119.7424710 }, // Upper Left
    { latitude: 36.8139167, longitude: -119.7424710 }, // Close the rectangle
  ];

  // Longitude offset for each additional parking spot (9 feet wide)
  const longitudeOffset = 0.0000311;  // 9 feet in degrees of longitude

  // Generate coordinates for 48 parking spots (1 base + 47 more to the right)
  const parkingLots = [];
  for (let i = 0; i < 48; i++) {
    const offsetLongitude = -119.7422222 + (i * longitudeOffset);
    const newParkingLotCoords = parkingLotBaseCoords.map(coord => ({
      latitude: coord.latitude,
      longitude: coord.longitude + (i * longitudeOffset), // Increment longitude for each new spot
    }));
    parkingLots.push(newParkingLotCoords);
  }
  //End of provisional code for parking lot overlay (part1)

  // Re-orient map to north (compass button)
  const realignMap = () => {
    if (mapRef.current) {
      mapRef.current.animateCamera({heading: 0});
    }
  }

const checkPermissions = async () => {
  const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);
  if (status !== 'granted') {
    Alert.alert('Permission required to save the file.');
    return false;
  }
  return true;
};


  // Save user's parked car location (aka create persistent marker of current location)
const saveLocation = async () => {
  const permission = await checkPermissions();
  if(!permission) {
    console.log("Incorrect permissions");
    return;
  }
  console.log("You have permission!");
  if (carLocation == null) {
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

            const locJSON = JSON.stringify(carLoc);
            const fileUri = FileSystem.documentDirectory + './cache/carloc.json';

            try {
              await FileSystem.writeAsStringAsync(fileUri, locJSON, {
                encoding: FileSystem.EncodingType.UTF8
              });
              console.log('Car location saved:', fileUri);
            } catch (error) {
              console.error('Error saving car location:', error);
            }
          }
        },
        { 
          text: "Cancel" 
        }
      ]
    );
  } else {
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

const fileUri = `${FileSystem.documentDirectory}localData.json`;
  const refreshData = async () => { // TODO: Still need to finish this function, not fully functional
    let msg = JSON.stringify({ "op":"RefreshData" })
      try {
        const data = await sendMsg(msg);
        console.log('Refresh successful:', data);

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        let updateData = data;

        if (fileInfo.exists) {
          const localData = await FileSystem.readAsStringAsync(fileUri);
          const parsedLocalData = JSON.parse(localData.json)
        }

      } 
      catch (error) {
        console.error('Error sending message:', error);
      }
    };
  
    const handleRegionChangeComplete = (region) => {
      const zoomLevel = Math.log2(360 / region.latitudeDelta);
      setZoom(zoomLevel); // Show polygons only if zoom level is 17 or higher
    };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name = "Main" options={{headerShown: false}}>
          {props => (
            <View style={ styles.container }>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>SpotMe</Text>
              </View>

              <MapView 
                ref={mapRef}
                style={styles.map}
                setCamera={{
                    heading: 50,
                }}
                minZoomLevel={15}
                onRegionChange={handleRegionChangeComplete}
                initialRegion={{
                    latitude: 36.81369124340123,
                    longitude: -119.7455163161234,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
              >
                {/*Start of provisional code for parking spot overlay(part1)*/}
                {zoom >= 15.78 && parkingLots.map((lotCoords, index) => ((
                  <Polygon
                    key={index}
                    coordinates={lotCoords}
                    strokeColor="black"
                    fillColor="rgba(0, 255, 0, 0.2)"
                    strokeWidth={1}
                    tappable
                  />
                
                )))}
                {/*End of provisional code for parking spot overlay (part2)*/}

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

              <Toolbar 
                {...props} 
                realignMap={realignMap} 
                aveLocation={saveLocation} 
                refreshData={refreshData}
                isLoggedIn={isLoggedIn}
                setIsLoggedIn={setIsLoggedIn}
              />
            </View>
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Register"
          children={(screenProps) => (
            <RegisterScreen 
              {...screenProps} 
              sendMsg={sendMsg}
              isLoggedIn={isLoggedIn}  
              setIsLoggedIn={setIsLoggedIn}
            />
          )}
        />
        <Stack.Screen
          name="Login"
          children={(screenProps) => (
            <LoginScreen 
              {...screenProps} 
              sendMsg={sendMsg}
              isLoggedIn={isLoggedIn} 
              setIsLoggedIn={setIsLoggedIn}
            />
          )}
        />
        <Stack.Screen
          name="AccountMenu"
          children={(screenProps) =>(
            <AccountMenuScreen
              {...screenProps}
              isLoggedIn={isLoggedIn} 
              setIsLoggedIn={setIsLoggedIn}
            />
          )}
        />
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
    fontWeight: 'bold',
    fontSize: 26,
    color: 'darkblue',
  },
  titleContainer: {
    position: 'absolute',
    top: 62,
    width: '100%',
    alignItems: 'center', // Center the title horizontally
    zIndex: 10, // Ensure it is on top of the map
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  }
});