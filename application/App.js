import React, { useState, useRef, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, Modal, TouchableOpacity, Platform, Linking} from 'react-native';
import Toolbar from './components/Toolbar.js';
import MapView, { Marker, Polygon } from 'react-native-maps';
import {LoginScreen, AccountMenuScreen, UpdateAccount, UpdateUsername, UpdatePasswd, YourPermits, WeeklyScheduler} from './components/Accounts.js';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as Notifications from "expo-notifications";
import parkingData from './assets/parking_lot_data.json';
import Histogram from './components/histogram.js'
// import WeeklySchedule from './components/WeeklySched.js'

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
  const [congestionData, setCongestionData] = useState({});
  const [trackedSpotId, setTrackedSpotId] = useState(null);

  //Pull parking spot data from assets
  useEffect(() =>{
    //console.log(parkingData)
    setParkingSpots(parkingData);
  }, []);

  const getInitialDay = () => {
    const today = new Date().getDay();
    return today === 0 || today === 6 ? 0 : today - 1; // Map Sunday (0) & Saturday (6) to Monday (0)
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() - 1); // Monday = 0
  const [selectedDay, setSelectedDay] = useState(getInitialDay()); // Initialize to current day
  
  //This is provisional
  const getDayData = (day) => {
    const congestionDataMap = {
      monday: [0.32, 0.03, 0.36, 0.19, 0.55, 0.93, 0.49, 0.13, 0.01, 0.39, 0.67, 0.88, 0.47, 0.5, 0.13, 0.11, 0.24, 0.78, 0.67, 0.62, 0.13, 0.84, 0.69, 0.01, 0.88, 0.9, 0.86, 0.62, 0.99, 0.49, 0.09, 0.12],
      tuesday: [0.23, 0.35, 0.7, 0.66, 0.2, 0.56, 0.15, 0.83, 0.37, 0.75, 0.92, 0.78, 0.66, 0.59, 0.89, 0.36, 0.19, 1.0, 0.95, 0.92, 0.93, 0.56, 0.16, 0.97, 0.99, 0.24, 0.76, 0.84, 0.36, 0.81, 0.37, 0.87],
      wednesday: [0.31, 0.66, 0.16, 0.28, 0.79, 0.32, 0.25, 0.17, 0.88, 0.56, 0.68, 0.9, 0.64, 0.86, 0.45, 0.77, 0.5, 0.2, 0.88, 0.65, 0.99, 0.32, 0.09, 0.39, 0.6, 0.06, 0.79, 0.4, 0.16, 0.73, 0.84, 0.45],
      thursday: [0.2, 0.92, 0.85, 0.45, 0.85, 0.13, 0.49, 0.44, 0.2, 0.62, 0.16, 0.87, 0.48, 0.27, 0.7, 0.78, 0.9, 0.33, 0.89, 0.08, 0.58, 0.35, 0.29, 0.09, 0.58, 0.34, 0.43, 0.42, 0.36, 0.45, 0.41, 0.86],
      friday: [0.71, 0.53, 0.82, 0.95, 0.49, 0.89, 0.56, 0.75, 0.43, 0.14, 0.15, 0.28, 0.4, 0.08, 0.59, 0.18, 0.11, 0.25, 0.29, 0.68, 0.71, 0.57, 0.65, 0.51, 0.98, 0.18, 0.04, 0.52, 0.01, 0.22, 0.08, 0.65],
    };
  
    return {
      day: day,
      values: congestionDataMap[day] || [],
    };
  };

  //Handle zoom to display parking lot
  const handleRegionChangeComplete = (region) => {
    const zoomLevel = Math.log2(360 / region.latitudeDelta);
    setZoom(zoomLevel);
    //console.log(zoom);

    if (mapRef.current && zoomLevel < 13) {
      mapRef.current.setCamera({
        center: {
          latitude: 36.81369124340123,
          longitude: -119.7455163161234,
        },
        zoom: 15,  // Desired zoom level
        heading: 0,
        pitch: 0,
        altitude: 0, // Optional
      });
    };
  };
  // Function to handle tapping spot
  const handlePolygonPress = (parkingLot, spotId, blockId, coordinates) => {
    Alert.alert(`Parking Lot: ${parkingLot}`, `Spot ID: ${spotId}\n`, [
      { 
          text: "Reserve and Navigate",
          onPress: () => {
              let latitude = coordinates[0].latitude;
              let longitude = coordinates[0].longitude;
              softReserve(latitude, longitude, spotId);
            }
      },
      {
        text: "Cancel"
      }
    ]);   // `Block ID: ${blockId}\n   --> for testing
  };

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "You need to enable notifications to use this feature.");
    }
  }

  // Request Notification Permissions
  useEffect( () => {
    requestPermissions();
  }, []);

  // CALL THIS TO SEND MESSAGE TO THE SERVER!
  // Returns the server response.
  const sendMsg = (msg) => {
    const socket = socketRef.current;

    return new Promise((resolve, reject) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            reject("ERROR: Could not connect to server!");
            return;
        }

        socket.send(msg);

        // Temporary listener for this specific response
        const handleResponse = (event) => {
          //console.log("sendMsg() received event: " + event);
            try {
                const data = JSON.parse(event.data);

                // Ensure the response matches the request type
                const sentOp = JSON.parse(msg).op;
                if (data.op === sentOp) {
                    resolve(event.data);

                    // Remove this specific listener after handling the response
                    socket.removeEventListener("message", handleResponse);
                }
            } catch (error) {
                reject("Error parsing WebSocket response: " + error);
            }
        };

        socket.addEventListener("message", handleResponse);

        socket.onerror = (error) => {
            reject("WebSocket Error: " + error);
        };
    });
  };


    // Establish connection to server
    useEffect( () => {
      const ConnectToServer = () => {
        const client = new WebSocket('ws://34.169.42.70:15024')
        socketRef.current = client;

        client.onopen = () => {
          //refreshData();
        }
      }
  
      ConnectToServer();
  
      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      }
    }, []);

  // Use this to begin navigation
  const softReserve = async (latitude, longitude, spotId) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        Alert.alert("WebSocket Error", "Connection to server is not open.");
        return;
    }

    try {
        // Step 1: Query the spot status
        const queryResponse = await sendMsg(JSON.stringify({ op: "QuerySpot", id: spotId }));
        const serverResponse = JSON.parse(queryResponse);

        if (serverResponse.status === "occupied") {
            Alert.alert("Spot Occupied", "This spot is occupied or became occupied during transaction. Please choose another spot.");
            return;
        }
        if (serverResponse.status === "reserved") {
            Alert.alert("Spot Already Reserved", "This spot is reserved or was reserved during transaction. Please choose another spot.");
            return;
        }

        // Step 2: Start navigation
        let destination = encodeURIComponent(`${latitude},${longitude}`);
        let url = Platform.OS === "ios"
            ? `maps://?saddr=&daddr=${destination}&directionsmode=driving`
            : `google.navigation:q=${destination}`;

        Linking.openURL(url).catch(() => Alert.alert("Error", "Failed to start navigation."));

        setTrackedSpotId(spotId);

        // Step 3: Send reservation request
        console.log("Sending reservation request...");
        const reserveResponse = await sendMsg(JSON.stringify({ op: "ReserveSpot", id: spotId }));
        const reserveStatus = JSON.parse(reserveResponse);
        console.log("Received server response:", reserveStatus);

        // Step 4: Handle initial reservation response
        if (reserveStatus.status === "prereserved") {
            console.log("Prereserved");
            Alert.alert("Spot Prereserved", "The parking spot was prereserved mid-transaction.");
        }
        if (reserveStatus.status === "preoccupied" || reserveStatus.status === "taken") {
            console.log("Taken");
            Alert.alert("Spot Taken", "The parking spot was taken.");
        }
        if (reserveStatus.status === "time_limit_reached") {
            Alert.alert("Time Limit Reached", "Your reservation time is up.");
        }
    } catch (error) {
        console.error("Error occurred during reservation:", error);
    }
};

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

const parkingLots = [
  { name: 'P5', coordinates: { latitude: 36.811609, longitude: -119.741742 }, congestionKey: 'P5' },
  { name: 'P6', coordinates: { latitude: 36.813297806394154, longitude: -119.7417291064082 }, congestionKey: 'P6'},
];

// Function to handle tapping the parking lot marker
const handleMarkerPress = (lot) => {
  setSelectedMarker(lot.name);
  setSelectedLot(lot);
  setSelectedDay(getInitialDay());
  setIsModalVisible(true); // Show the modal when a marker is pressed
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const handlePrevDay = () => {
  setSelectedDayIndex((prev) => (prev === 0 ? 4 : prev - 1));
};
const handleNextDay = () => {
  setSelectedDayIndex((prev) => (prev === 4 ? 0 : prev + 1));
};


// Function to close the modal
const closeModal = () => {
  setIsModalVisible(false);
  setSelectedLot(null);
  setSelectedMarker(null);
};

// Function to determine marker scale based on selection
const getMarkerScale = (lotName) => {
  return lotName === selectedMarker ? 1.5 : 1; // Larger scale if selected
};

  // Save user's parked car location (aka create persistent marker of current location)
const saveLocation = async () => {

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
                        
            console.log(carLoc.coords);
            setCarLocation(carLoc.coords);
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
  const refreshData = async () => {
    let msg = JSON.stringify({ "op":"RefreshData" })
      try {
        const serverResponse = await sendMsg(msg);
        // console.log('Refresh successful:', serverResponse);
        let responseData = JSON.parse(serverResponse)

        // Parse the data and initialize updatedStatus as an empty array
        const parsedData = JSON.parse(responseData.data);

        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        // Gather spaces across all parking lots
        let updatedStatus = [];
        let newCongestionData = {};

        parsedData.forEach((lot) => {
          updatedStatus = updatedStatus.concat(lot.spaces); // Add spaces from each lot
          newCongestionData[lot.lot_id] = lot.congestion_percent; //Log the congestion data for each parking lot (P6, P5)
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
        setCongestionData(newCongestionData);

        //For testing purposes
        let congestionP6 = newCongestionData['P6'];
        let congestionP5 = newCongestionData['P5'];
        console.log(`Congestion for P6: ${congestionP6 * 100}%`);
        console.log(`Congestion for P5: ${congestionP5 * 100}%`);

      } 
      catch (error) {
        console.error(error);
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
                showsPointsOfInterest={false}
                showsUserLocation={true}
                showsBuildings={false}
                showsCompass={false}
                showsMyLocationButton={false}
                showsTraffic={false}
                minZoomLevel={15}
                onRegionChange={handleRegionChangeComplete}
              >
                {zoom >= 16.86 && parkingSpots
                  .map((spot) => {
                    const statusColors = {
                      0: "rgba(0, 255, 0, 1)", // Green for available
                      1: "rgba(255, 0, 0, 1)", // Red for unavailable
                      2: "rgba(255, 255, 0, 1)", // Yellow for reserved
                    };
                    const fillColor = statusColors[spot.status] || "rgba(128, 128, 128, 0.5)"; // Default gray
                    return (
                      <Polygon
                        key={spot.id}
                        coordinates={spot.coordinates}
                        fillColor={fillColor}
                        strokeColor={"black"}
                        strokeWidth={1}
                        tappable
                        onPress={() => handlePolygonPress(spot.parkingLot, spot.id, spot.block, spot.coordinates)}
                      />
                    );
                  })
                }
                                
                {parkingLots.map((lot, index) => {
                  const congestion = congestionData[lot.congestionKey] || 2;

                  if (congestion == 2) color = "gray"; // Default value (cannot be 0, it would mean empty, not default)
                  else if (congestion > 0.85) color = "red"; // High congestion
                  else if (congestion > 0.65) color = "yellow"; // Medium congestion
                  else color = "green"; // Low congestion

                  let img = lot.name.toLowerCase() + color;

                  const pins = {
                    "p5gray": require("./assets/pins/p5gray.png"),
                    "p5red": require("./assets/pins/p5red.png"),
                    "p5yellow": require("./assets/pins/p5yellow.png"),
                    "p5green": require("./assets/pins/p5green.png"),
                    "p6gray": require("./assets/pins/p6gray.png"),
                    "p6red": require("./assets/pins/p6red.png"),
                    "p6yellow": require("./assets/pins/p6yellow.png"),
                    "p6rgreen": require("./assets/pins/p6red.png")
                  };

                  return(
                    <Marker
                      key={color + index}
                      pinColor={color}
                      image = {pins[img]}
                      coordinate={lot.coordinates}
                      onPress={() => handleMarkerPress(lot)}  // Show modal on press
                      style={{ transform: [{ scale: getMarkerScale(lot.name) }] }}
                    />
                  );
                })}

                {carLocation != null && (
                    <Marker
                        title = {'Your Car'}
                        pinColor={'navy'}
                        image = {require("./assets/pins/carloc.png")}
                        coordinate = {{
                            latitude: carLocation.latitude,
                            longitude: carLocation.longitude,
                        }}
                    />
                )}
              </MapView>

              {/* Pop-up Modal for Expected Congestion */}
              <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeModal}
              >
                <View style={styles.modalBackground}>
                  <View style={styles.modalContainer}>
                    {selectedLot && (
                      <>
                        <Text style={styles.modalTitle}>
                          {`${selectedLot.name} Congestion`}
                        </Text>

                        <Text style={styles.modalTextOne}>
                          {`Current: ${Math.round((congestionData[selectedLot.congestionKey]?.[selectedDay] || 0) * 100)}%`}
                        </Text>

                        <Histogram data={getDayData(daysOfWeek[selectedDay].toLowerCase())} />
                      </>
                    )}

                    <View style={styles.bottomRow}>
                      <View style={styles.modalNavigation}>
                        <TouchableOpacity
                          onPress={() => setSelectedDay((selectedDay - 1 + 5) % 5)}
                          disabled={selectedDay === 0}
                          style={styles.navButtonWrapper}
                        >
                          <Text style={styles.navButton}>{'<'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                          <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setSelectedDay((selectedDay + 1) % 5)}
                          disabled={selectedDay === 4}
                          style={styles.navButtonWrapper}
                        >
                          <Text style={styles.navButton}>{'>'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>

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
          name="Login"
          options={{headerShown: false}}
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
          options={{headerShown: false}}
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
          options={{headerShown: false}}
          children={(screenProps) => (
            <UpdateAccount
              {...screenProps}
            />
          )}
          />
          <Stack.Screen
            name='UpdateUsername'
            options={{headerShown: false}}
            children={(screenProps) => 
              <UpdateUsername
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='UpdatePasswd'
            options={{headerShown: false}}
            children={(screenProps) =>
              <UpdatePasswd
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='YourPermits'
            options={{headerShown: false}}
            children={(screenProps) => 
              <YourPermits
                {...screenProps}
                sendMsg={sendMsg}
              />
            }
          />
          <Stack.Screen
            name='WeeklyScheduler'
            options={{headerShown: false}}
            children={(screenProps) => 
              <WeeklyScheduler
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
    backgroundColor: 'white',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 26,
    color: '#002e6d',
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
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    maxHeight: '50%',
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalTextOne: {
    fontSize: 16,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: 'row',        // Makes children (Close button and Nav buttons) appear side by side
    justifyContent: 'space-between', // Space between Close and Nav buttons
    alignItems: 'center',  // Center vertically
    width: '100%',              // Ensures the row spans the entire modal width
    marginTop: 10,              // Space between the modal content and buttons
    paddingHorizontal: 20,      // Padding for inner spacing
  },
  closeButton: {
    backgroundColor: '#002e6d',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalNavigation: {
    flexDirection: "row",      // Arrange elements in a row
    alignItems: "center",      // Align vertically in the center
    justifyContent: "space-between", // Space out the nav buttons evenly
    width: "100%",              // Limit the width of the nav buttons section
    paddingHorizontal: 20,
  },
  navButtonWrapper: {
    paddingHorizontal: 15, // Spacing around the buttons
  },
  navButton: {
    fontSize: 24,
    fontWeight: "bold",
    color: "black",
  },
});