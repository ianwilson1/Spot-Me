import React, { useContext, useEffect, useRef, useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity, Platform} from "react-native";
import { Checkbox} from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from 'react-native-big-calendar';
import Modal from "react-native-modal";
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

const storeUserSession = async (userData) => {
    try {
        await AsyncStorage.setItem('userSession', JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving users login credentials: ', error);
    }
};

const getUsername = async () => {
    try {
        const userSession = await AsyncStorage.getItem('userSession');
        if (userSession) {
            const parsedSession = JSON.parse(userSession);
            return parsedSession.username;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving username: ', error);
        return null;
    }
};

export const LoginScreen = ({navigation, sendMsg, setIsLoggedIn, isLoggedIn}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const msgObj = {
                "op": "Login",
                "name": username,
                "passwd": password
            };
            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if(serverResponse.status === "valid") {
                setIsLoggedIn(true);
                await storeUserSession({username});

                const storedPermits = await AsyncStorage.getItem('userPermits');
                if (storedPermits) {
                    console.log("User's saved permits loaded: ", JSON.parse(storedPermits));
                }
                Alert.alert("Login successful.");
                navigation.navigate("Main");
            }
            else if (serverResponse.status === "null_user") {
                Alert.alert("User not found!", "Please try again.");
            }
            else if (serverResponse.status === "invalid_pass") {
                Alert.alert("Invalid password!", "Please try again.");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }

        } catch (error) {
            Alert.alert("Unexpected error!", "Please try again.");
            console.error(error);
        }
    };

    const handleRegister = async () => {
        try{
            const msgObj = {
                "op": "CreateAccount",
                "name": username,
                "passwd": password
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "account_created") {
                Alert.alert("Registration successful");
                setIsLoggedIn(true);
                await storeUserSession({username});
                navigation.navigate("Main");
            } 
            else if (serverResponse.status === "name_used") {
                Alert.alert("Username in use!","Please use another name.");
            }
            else if (serverResponse.status === "invalid_pass") {
                Alert.alert("Password does not meet requirements.");
            }
            else if (serverResponse.status === "short_pass") {
                Alert.alert("Password requirements not met!", "Please make your password at least 8 characters.");
            }
            else if (serverResponse.status === "no_num") {
                Alert.alert("Password requirements not met!", "Please contain at least one number.");
            }
            else if (serverResponse.status === "no_caps") {
                Alert.alert("Password requirements not met!", "Please contain at least one capital letter.");
            }
            else if (serverResponse.status === "no_spec_chars") {
                Alert.alert("Password requirements not met!", "Please contain at least one special character (!@#$%^&*-_).");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }

        } catch (error){
            Alert.alert("Unexpected error!", "Please try again.");
            console.error(error);
        }
        };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Username" 
                value={username} 
                onChangeText={setUsername}
            />
            <TextInput 
                style={styles.input} 
                placeholder="Password" 
                value={password} 
                secureTextEntry onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.buttons} onPress={handleLogin}>
                <Text style={styles.text}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} onPress={handleRegister}>
                <Text style={styles.text}>Register</Text>
            </TouchableOpacity>
        </View>
    )
}

export const AccountMenuScreen = ({sendMsg, navigation, setIsLoggedIn, isLoggedIn}) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    //log out function from syst req
    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userSession');
            setIsLoggedIn(false);
            navigation.navigate("Main");
        } catch (error) {
            console.error('Error clearing user session: ', error);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const msgObj = {
                "op": "DeleteAccount",
                "name": username,
                "passwd": password
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "account_deleted") {
                await AsyncStorage.removeItem('userSession');
                setModalVisible(false);
                setIsLoggedIn(false);
                Alert.alert("Account deleted successfully");
                navigation.navigate("Main");
            } 
            else if (serverResponse.status === "null_user") {
                Alert.alert("User not found!", "Failed to find account. Please try again.");
            }
            else if (serverResponse.status === "invalid_pass") {
                Alert.alert("Invalid password!", "Please check your password and try again.");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }

        } catch (error){
            Alert.alert("Unexpected error!", "Please try again.");
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Account Menu</Text>
            <TouchableOpacity style={styles.buttons} onPress = {() => navigation.navigate("UpdateAccount")}>
                <Text style={styles.text}>Update Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} onPress = {()=> navigation.navigate("YourPermits")}>
                <Text style={styles.text}>
                    My Permits
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} onPress={() => navigation.navigate("WeeklyScheduler")}>
                <Text style={styles.text}>
                    Weekly Schedule
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} title="Logout" onPress={handleLogout}>
                <Text style={styles.text}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButtons} title="DelAct" onPress={() => setModalVisible(true)}>
                <Text style={styles.text}>
                    Delete Account
                </Text>
            </TouchableOpacity>
            <Modal 
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete account</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Username" 
                            value={username}
                            onChangeText={setUsername}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={handleDeleteAccount}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={[styles.button, styles.cancelButton]}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </Modal>
        </View>
    );
};

//feature 5.3 from system req doc
export const UpdateAccount = ({navigation}) => {

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Account</Text>
            <TouchableOpacity style={styles.buttons} onPress={() => navigation.navigate("UpdateUsername")}>
                <Text style={styles.text}>Update Username</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttons} onPress={() => navigation.navigate("UpdatePasswd")}>
                <Text style={styles.text}>Update Password</Text>
            </TouchableOpacity>
        </View>
    );
};

export const UpdateUsername = ({sendMsg, navigation}) => {

    const [currUsername, setCurrUsername] = useState('');
    const [currPasswd, setCurrPasswd] = useState('');
    const [newUsername, setNewUsername] = useState('');

    const handleUpdateUsername = async () => {
        if (!newUsername || !currPasswd){
            Alert.alert("Error, Current password and new username are required.");
            return;
        }
        try{
            const msgObj = {
                "op": "UpdateName",
                "name": currUsername,
                "passwd": currPasswd,
                "newName": newUsername,
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "updated_name") {
                Alert.alert("Success", "Username updated successfully!");
                navigation.navigate("AccountMenu");
            } 
            else if (serverResponse.status === "null_user") {
                Alert.alert("User not found!", "Failed to find account. Please try again.");
            }
            else if (serverResponse.status === "invalid_pass") {
                Alert.alert("Invalid password!", "Please check your password and try again.");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }

        }   catch (error) {
            Alert.alert("Unexpected error!", "Please try again.");
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Username</Text>
            <TextInput
                style={styles.input}
                placeholder="Current Username"
                value={currUsername}
                onChangeText={setCurrUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={currPasswd}
                onChangeText={setCurrPasswd}
            />
            <TextInput
                style={styles.input}
                placeholder="New Username"
                value={newUsername}
                onChangeText={setNewUsername}
            />
            <TouchableOpacity style={styles.buttons} onPress={handleUpdateUsername}>
                <Text style={styles.text}>Update Username</Text>
            </TouchableOpacity>
        </View>
    );
};

export const UpdatePasswd = ({sendMsg, navigation}) => {

    const [currUsername, setCurrUsername] = useState('');
    const [currPasswd, setCurrPasswd] = useState('');
    const [newPasswd, setNewPasswd] = useState('');

    const handleUpdatePasswd = async () => {
        if (!currUsername || !currPasswd){
            Alert.alert("Error, Current password and new username are required.");
            return;
        }
        try {
            const msgObj = {
                "op": "UpdatePass",
                "name": currUsername,
                "passwd": currPasswd,
                "newPass": newPasswd
            };
        
            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "pass_updated"){
                Alert.alert("Password updated successfully!");
                navigation.navigate("AccountMenu");
            } 
            else if (serverResponse.status === "null_user") {
                Alert.alert("User not found!", "Failed to find account. Please try again.");
            }
            else if (serverResponse.status === "invalid_pass") {
                Alert.alert("Invalid password!", "Please check your password and try again.");
            }
            else if (serverResponse.status === "same_pass") {
                Alert.alert("Same password!", "New password cannot be the same as old one.");
            }
            else if (serverResponse.status === "short_pass") {
                Alert.alert("Password requirements not met!", "Please make your password at least 8 characters.");
            }
            else if (serverResponse.status === "no_num") {
                Alert.alert("Password requirements not met!", "Please contain at least one number.");
            }
            else if (serverResponse.status === "no_caps") {
                Alert.alert("Password requirements not met!", "Please contain at least one capital letter.");
            }
            else if (serverResponse.status === "no_spec_chars") {
                Alert.alert("Password requirements not met!", "Please contain at least one special character (!@#$%^&*-_).");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }
        } catch (error) {
            Alert.alert("Error", "Could not connect to the server.");
            console.error(error);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Update Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={currUsername}
                onChangeText={setCurrUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Current Password"
                secureTextEntry
                value={currPasswd}
                onChangeText={setCurrPasswd}
            />
            <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPasswd}
                onChangeText={setNewPasswd}
            />
            <TouchableOpacity style={styles.buttons} onPress={handleUpdatePasswd}>
                <Text style={styles.text}>Update Password</Text>
            </TouchableOpacity>
        </View>
    );
};

//feature 5.4 from system req doc
export const YourPermits = ({navigation, sendMsg}) => {
    const [permits, setPermits] = useState({
        'green': false,
        'yellow': false,
        'black': false,
        'gold': false,
        'blue': false,
    });

    useEffect (() => {
        const fetchUserPermits = async () => {
            try {
                const username = await AsyncStorage.getItem('userSession');
                if (!username) return;

                const storedPermits = await AsyncStorage.getItem('userPermits');
                if (storedPermits) {
                    setPermits(JSON.parse(storedPermits));
                }
            } catch (error) {
                console.error('Error retrieving permits: ', error);
            }
        };

        fetchUserPermits();
    }, []);

    const handleCheckedItem = async (itemId) => {
        const updatedPermits = {...permits, [itemId]: !permits[itemId]};
        setPermits(updatedPermits);
        await savePermits(updatedPermits);
    };

    const savePermits = async (permits) => {
        try {
            await AsyncStorage.setItem('userPermits', JSON.stringify(permits));
            console.log('Permits saved locally:', permits);
        } catch (error) {
            console.error('Error saving permits:', error);
        }
    };

    const handleYourPermits = async () => {
        try{
            const username = await getUsername();
            if(!username){
                console.error("No user found in session");
                return;
            }
            
            const msgObj = {
                "op": "UpdatePermits",
                "name": String(username),
                "permits": Object.values(permits),
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "permits_updated"){
                await AsyncStorage.setItem('userPermits', JSON.stringify(permits));
                Alert.alert("Permit updated successfully!");
                navigation.navigate("AccountMenu");
            } 
            else if (serverResponse.status == "permits_unchanged") {
                Alert.alert("Permits not updated.", "Unchanged from previous permits.");
            }
            else {
                Alert.alert("Unexpected server error!", "Server response: " + serverResponse.status);
            }
            
        } catch(error) {
            Alert.alert("Could not connect to server.");
            console.error(error);
        }
    };


    return (
        <SafeAreaView style={styles.container}>
           <Text style={styles.title}>My Permits</Text>
           <View style={styles.checkBoxContainer}>
                <Checkbox.Item
                    status={permits['green'] ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckedItem('green')}
                    label="Student Permit"
                    position="leading"
                    color='#002e6d'
                /> 
                <Checkbox.Item
                    status={permits["yellow"] ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckedItem('yellow')}
                    label="Faculty Permit"
                    position="leading"
                    color='#002e6d'
                />
                <Checkbox.Item
                    status={permits["black"] ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckedItem('black')}
                    label="Motorcycle Permit"
                    position="leading"
                    color='#002e6d'
                />
                <Checkbox.Item
                    status={permits["gold"] ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckedItem('gold')}
                    label="Special Permit"
                    position="leading"
                    color='#002e6d'
                />
                <Checkbox.Item
                    status={permits["blue"] ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckedItem('blue')}
                    label="Handicap Permit"
                    position="leading"
                    color='#002e6d'
                />
          </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleYourPermits}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const lotPermit = {
    "P5": 'green',
    "P6": 'green'
};

const lots = Object.keys(lotPermit);

//feature 5.5 from system req doc
export const WeeklyScheduler = ({sendMsg, congestionData = {}}) => {
    const navigation = useNavigation();
    
    const [events, setEvents] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [eventModalVisible, setEventModalVisible] = useState(false);
    const [userPermits, setUserPermits] = useState({});
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [repeatWeekly, setRepeatWeekly] = useState(false);
    const [repeatUntil, setRepeatUntil] = useState(null);
    const [showRepeatUntilPicker, setShowRepeatUntilPicker] = useState(false);

    useEffect(() => {
        const fetchUserPermits = async () => {
            try {
                const storedPermits = await AsyncStorage.getItem('userPermits');
                if (storedPermits) {
                    setUserPermits(JSON.parse(storedPermits));
                }
            } catch (error) {
                console.error('Error retrieving permits: ', error);
            }
        };

        const loadEvents = async () => {
            try {
                const storedEvents = await AsyncStorage.getItem('weeklyEvents');
                if (storedEvents){
                    const parsed = JSON.parse(storedEvents);
                    parsed.forEach(e => {
                        e.start = new Date(e.start);
                        e.end = new Date(e.end);
                    });
                    setEvents(parsed);
                } 
            } catch (error) {
                console.error('Error retrieving events: ', error);
            }
        };
        fetchUserPermits();
        loadEvents(); 
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('weeklyEvents', JSON.stringify(events));
    }, [events]);

    const getBlockColor = (lot) => {
        const requiredPermit = lotPermit[lot];
        const hasPermit = userPermits[requiredPermit] || false;
        if (!hasPermit) return 'red';

        const congestion = congestionData[lot] ?? 0.7;
        return congestion > 0.85 ? 'yellow' : 'green';
    };

    const handlePressCell = (date) => {
        const start = new Date(date);
        const end = new Date(date.getTime() + 30 * 60000);
        end.setHours(end.getHours() + 1); // Default to 1 hour block
        setSelectedBlock({id: Date.now(), title: '', lot: '', start, end});
        setEventModalVisible(true);
      };

      const handlePressEvent = (event) => {
        setSelectedBlock(event);
        setEventModalVisible(true);
    };

    /*const isOverlapping = (newEvent, existingEvents) => {
        return existingEvents.some(event => {
          // Optional: skip comparing to itself (in case of editing)
          if (event.id === newEvent.id) return false;
      
          return (
            newEvent.start < event.end &&
            newEvent.end > event.start
          );
        });
      };*/
      

      const saveEvent = () => {
        const color = getBlockColor(selectedBlock.lot);
        const newEvents = [];
      
        if (!selectedBlock) return;
      
        // Function to check for overlap
        const isOverlapping = (newEvent, existingEvents) => {
          return existingEvents.some(event =>
            newEvent.start < event.end && newEvent.end > event.start
          );
        };
      
        if (repeatWeekly && repeatUntil) {
          let nextDate = new Date(selectedBlock.start);
          let nextEnd = new Date(selectedBlock.end);
          const endDate = new Date(repeatUntil);
      
          while (nextDate <= endDate) {
            const newEvent = {
              ...selectedBlock,
              id: Date.now() + Math.random(), // unique ID
              start: new Date(nextDate),
              end: new Date(nextEnd),
              color,
            };
      
            if (isOverlapping(newEvent, events)) {
              Alert.alert("Time Conflict", "One or more repeated events overlap with existing ones.");
              return;
            }
      
            newEvents.push(newEvent);
            nextDate.setDate(nextDate.getDate() + 7);
            nextEnd.setDate(nextEnd.getDate() + 7);
          }
        } else {
          const singleEvent = { ...selectedBlock, id: Date.now(), color };
          
          if (isOverlapping(singleEvent, events)) {
            Alert.alert("Time Conflict", "This event overlaps with an existing one.");
            return;
          }
      
          newEvents.push(singleEvent);
        }
      
        setEvents((prev) => [...prev, ...newEvents]);
        setEventModalVisible(false);
        setRepeatWeekly(false);
        setRepeatUntil(null);
      };
      

    const saveSchedule = async () => {
        try {
            const username = await getUsername();
            if (!username) {
                console.error("No user found in session");
                return;
            }
            const serializedSched = events.map(e => ({
                ...e,
                start: e.start instanceof Date ? e.start.toISOString() : e.start,
                end: e.end instanceof Date ? e.end.toISOString() : e.end,
              }));

            const msgObj = {
                "op": "SaveWeeklySchedule",
                "name": String(username),
                "newSched": serializedSched,
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.status === "schedule_updated") {
                Alert.alert("Schedule saved successfully!");
            } else {
                Alert.alert("Failed to save schedule.", "Server response: " + serverResponse.status);
            }
        } catch (error) {
            Alert.alert("Error", "Could not connect to the server.");
            console.error(error);
        }
    };

  return (
    <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ position: 'absolute', top: 60, left: 20,
        zIndex: 1,}}>
          <Ionicons name="arrow-back" size={24} color="black"/>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginLeft: 10}}>
            Weekly Scheduler
        </Text>
      </View>
      <Calendar
        events={events}
        height={1200}
        onPressCell={handlePressCell}
        onPressEvent={handlePressEvent}
        eventCellStyle={(event) => ({ backgroundColor: event.color || 'gray' })}
        ampm={true}
        minHour={6}
      />

<Modal visible={eventModalVisible} transparent animationType="slide">
  {selectedBlock && (
    <View style={{ backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Create Parking Schedule</Text>

      <TextInput
        placeholder="Event Title"
        value={selectedBlock.title}
        onChangeText={(text) => setSelectedBlock({ ...selectedBlock, title: text })}
        style={{ borderBottomWidth: 1, marginVertical: 10 }}
      />

      <TouchableOpacity onPress={() => setShowStartPicker(true)}>
        <Text>Start Time: {selectedBlock.start.toLocaleTimeString()}</Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={selectedBlock.start}
          mode="time"
          onChange={(e, date) => {
            setShowStartPicker(false);
            if (date) setSelectedBlock({ ...selectedBlock, start: date });
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowEndPicker(true)}>
        <Text>End Time: {selectedBlock.end.toLocaleTimeString()}</Text>
      </TouchableOpacity>
      {showEndPicker && (
        <DateTimePicker
          value={selectedBlock.end}
          mode="time"
          onChange={(e, date) => {
            setShowEndPicker(false);
            if (date) setSelectedBlock({ ...selectedBlock, end: date });
          }}
        />
      )}

<TouchableOpacity onPress={() => setRepeatWeekly(!repeatWeekly)}>
  <Text style={{ color: repeatWeekly ? 'green' : 'black' }}>
    Repeat Weekly: {repeatWeekly ? 'Yes' : 'No'}
  </Text>
</TouchableOpacity>

{repeatWeekly && (
  <>
    <TouchableOpacity onPress={() => setShowRepeatUntilPicker(true)}>
      <Text>
        Repeat Until: {repeatUntil ? repeatUntil.toDateString() : 'Select Date'}
      </Text>
    </TouchableOpacity>
    {showRepeatUntilPicker && (
      <DateTimePicker
        value={repeatUntil || new Date()}
        mode="date"
        display="default"
        onChange={(e, date) => {
          setShowRepeatUntilPicker(false);
          if (date) setRepeatUntil(date);
        }}
      />
    )}
  </>
)}

      <Text style={{ marginTop: 10 }}>Assign Lot:</Text>
      {lots.map((lot) => (
        <TouchableOpacity
          key={lot}
          onPress={() => setSelectedBlock({ ...selectedBlock, lot })}
        >
          <Text style={{ padding: 5, color: selectedBlock.lot === lot ? 'blue' : 'black' }}>{lot}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <TouchableOpacity onPress={() => setEventModalVisible(false)}>
          <Text style={{ color: 'gray' }}>Cancel</Text>
        </TouchableOpacity>
        {selectedBlock?.id && ( // Make sure the event has an ID before showing the delete button
    <TouchableOpacity
      onPress={() => {
        Alert.alert("Delete Event?", "Are you sure you want to delete this event?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setEvents((prev) => prev.filter((e) => e.id !== selectedBlock.id));
              setEventModalVisible(false); // Close the modal after deleting
            },
          },
        ]);
      }}
    >
      <Text style={{ color: 'red' }}>Delete</Text>
    </TouchableOpacity>
  )}
        <TouchableOpacity onPress={saveEvent}>
          <Text style={{ color: 'green' }}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  )}
</Modal>

    </View>
  );
};

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f6f6f6'},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center', fontFamily: 'Helvetica', marginTop: -100},
    input: {height: 40, borderColor: 'black', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
    buttons: {height: 50, alignItems: 'center', backgroundColor: '#002e6d', padding: 15, marginBottom: 20, borderRadius: 10},
    deleteButtons: {height: 50, alignItems: 'center', backgroundColor: '#db0032', padding: 15, marginBottom: 20, borderRadius: 10},
    text: {color: 'white', fontWeight: 'bold', fontFamily: 'Helvetica'},
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Helvetica',
        marginBottom: 20
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
        backgroundColor: '#002e6d',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: '#d4d4d4'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    label: {
        fontSize: 16,
        marginLeft: 8,
    },
    selectedText: {
        marginTop: 20,
        fontSize: 16,
        color: 'green',
    },
    checkBoxContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginVertical: 8,
        color: '#002e6d',
    },
    saveButton: {
        backgroundColor: '#002e6d',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#f6f6f6',
        fontSize: 16,
        fontWeight: 'bold',
    },
    header: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
    dayText: { fontWeight: "bold", fontSize: 16, width: 70, textAlign: "center" },
    grid: { flexDirection: "column" },
    row: { flexDirection: "row" },
    //cell: { width: CELL_WIDTH, height: CELL_HEIGHT, borderWidth: 0.5, borderColor: "#ccc" },
    selectedBlock: { flex: 1, backgroundColor: "#002e6d" },
    touchWrapper: {flex: 1},
});
