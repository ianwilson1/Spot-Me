import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, StyleSheet, Text} from 'react-native';
import Toolbar from './components/Toolbar.js';
import MapView, { Marker, Polygon } from 'react-native-maps';
import {LoginScreen, RegisterScreen, AccountMenuScreen, UpdateAccount, UpdateUsername, UpdatePasswd, YourPermits, WeeklySchedule} from './components/Accounts.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import parkingData from './assets/parking_lot_data.json';


const Stack = createStackNavigator();

export default function App () {
  // Refs (for tracking objects between components)
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  // States
  const [carLocation, setCarLocation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [parkingSpots, setParkingSpots] = useState([]);

  //Pull parking spot data from assets
  useEffect(() =>{
    setParkingSpots(parkingData);
  }, []);

  //Handle zoom to display parking lot
  const handleRegionChangeComplete = (region) => {
    const zoomLevel = Math.log2(360 / region.latitudeDelta);
    setZoom(zoomLevel);
  };
  // Function to handle tapping spot
  const handlePolygonPress = (parkingLot, spotId, blockId) => {
    Alert.alert(`Parking Lot: ${parkingLot}`, `Block ID: ${blockId}\nSpot ID: ${spotId}\n`);
  };

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
  }, []);

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

  /*Start of provisional code for parking lot overlay (part1)
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
  End of provisional code for parking lot overlay (part1)
*/
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

        // Parse the data and initialize updatedStatus as an empty array
        const parsedData = JSON.parse(data);

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        // Gather spaces across all parking lots
        let updatedStatus = [];
        let congestionData = {};

        parsedData.forEach((lot) => {
          updatedStatus = updatedStatus.concat(lot.spaces); // Add spaces from each lot
          congestionData[lot.lot_id] = lot.congestion_percent; //Log the congestion data for each parking lot (P6, P5)
        });
        
        // Update parking spots with the status from the server
        const updatedSpots = parkingSpots.map((spot) => {
          const spaceStatus = updatedStatus.find((s) => s.space_id === spot.id);
          return {
            ...spot,
            status: spaceStatus ? spaceStatus.status : 0, // Default to 0 if no status is found
          };
        });

        setParkingSpots(updatedSpots);

        //For testing purposes
        let congestionP6 = congestionData['P6'];
        let congestionP5 = congestionData['P5'];
        console.log(`Congestion for P6: ${congestionP6 * 100}%`);
        console.log(`Congestion for P5: ${congestionP5 * 100}%`);

      } 
      catch (error) {
        console.error('Error sending message:', error);
      }
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
                {zoom >= 15.78 
                  && parkingSpots.map((spot) => {
                  // Determine the fill color based on the status
                  const statusColors = {
                    0: "rgba(255, 0, 0, 0.5)", // Red for unavailable
                    1: "rgba(0, 255, 0, 0.5)", // Green for available
                    2: "rgba(255, 255, 0, 0.5)", // Yellow for reserved
                  };
                  const fillColor = statusColors[spot.status] || "rgba(128, 128, 128, 0.5)"; // Gray as default
                  return (
                    <Polygon
                      key={spot.id}
                      coordinates={spot.coordinates}
                      strokeColor="black"
                      fillColor={fillColor}
                      strokeWidth={1}
                      tappable
                      onPress={() => handlePolygonPress(spot.parkingLot, spot.id, spot.block)}
                    />
                  );  
                })}
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
                saveLocation={saveLocation} 
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
              sendMsg={sendMsg}
            />
          )}
        />
        <Stack.Screen
          name='UpdateAccount'
          children={(screenProps) => (
            <UpdateAccount
              {...screenProps}
            />
          )}
          />
          <Stack.Screen
            name='UpdateUsername'
            children={(screenProps) => 
              <UpdateUsername
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='UpdatePasswd'
            children={(screenProps) =>
              <UpdatePasswd
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='YourPermits'
            children={(screenProps) => 
              <YourPermits
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='WeeklySchedule'
            children={(screenProps) => 
              <WeeklySchedule
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
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
    alignItems: 'center', 
    zIndex: 10, 
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  }
});