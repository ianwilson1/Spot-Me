import React, { useEffect, useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity, Modal, Image, PanResponder} from "react-native";
import { Checkbox, CheckBox} from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';


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
           <Text style={styles.title}>Your Permits</Text>
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TOTAL_HOURS = 12; // Example: Displaying 12 hours (e.g., 8 AM - 8 PM)

//feature 5.5 from system req doc
export const WeeklyScheduler = () => {
  const [blocks, setBlocks] = useState([]); // Stores the selected time blocks

  // Handles touch and drag
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      const dayIndex = Math.floor(locationX / 70); // Assuming each day width is ~70px
      const timeIndex = Math.floor(locationY / 40); // Assuming each hour height is ~40px

      if (dayIndex >= 0 && dayIndex < DAYS.length && timeIndex >= 0 && timeIndex < TOTAL_HOURS) {
        setBlocks((prevBlocks) => [
          ...prevBlocks,
          { day: dayIndex, start: timeIndex, end: timeIndex + 1 },
        ]);
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with days */}
      <SafeAreaView style={styles.header}>
        {DAYS.map((day, index) => (
          <Text key={index} style={styles.dayText}>{day}</Text>
        ))}
      </SafeAreaView>
      
      {/* Scheduler Grid */}
      <SafeAreaView style={styles.grid} {...panResponder.panHandlers}>
        {[...Array(TOTAL_HOURS)].map((_, hour) => (
          <SafeAreaView key={hour} style={styles.row}>
            {DAYS.map((_, day) => (
              <SafeAreaView key={day} style={styles.cell}>
                {blocks.some((b) => b.day === day && b.start <= hour && b.end > hour) && (
                  <SafeAreaView style={styles.selectedBlock} />
                )}
              </SafeAreaView>
            ))}
          </SafeAreaView>
        ))}
      </SafeAreaView>
    </SafeAreaView>
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
    cell: { width: 70, height: 40, borderWidth: 1, borderColor: "#ddd" },
    selectedBlock: { flex: 1, backgroundColor: "blue" },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 4,
        color: 'black',
        paddingRight: 30, // to ensure the text is never behind the icon
    },
});
