import React, { useEffect, useRef, useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity, Platform} from "react-native";
import { Checkbox} from 'react-native-paper';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from 'react-native-gesture-handler'
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
export const WeeklyScheduler = () => {
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

        fetchUserPermits();
    }, []);

    const getBlockColor = (lot, congestion = 70) => {
        const requiredPermit = lotPermit[lot];
        const hasPermit = userPermits[requiredPermit] || false;
        if (!hasPermit) return 'red';
        return congestion > 85 ? 'yellow' : 'green';
    };

    const handlePressCell = (date) => {
        const start = new Date(date);
        const end = new Date(date.getTime() + 30 * 60000);
        end.setHours(end.getHours() + 1); // Default to 1 hour block
        setSelectedBlock({id: Date.now(), title: '', lot: '', start, end});
        setEventModalVisible(true);
      };

    const saveEvent = () => {
        const color = getBlockColor(selectedBlock.lot);

        const newEvents = [];

        if (isValidSelection(dayIndex, timeIndex)) {
            updateBlockSelection(dayIndex, startSelection.start, timeIndex);
        }
    },

    onPanResponderRelease: () => {
        setStartSelection(null);   // Reset after selection is complete
    }
});

// checks validity of selection
const isValidSelection = (day, time) => {
    return (
        day >= 0 && day < DAYS.length &&
        time >= 0 && time < TOTAL_INTERVALS &&
        !blocks.some(b => b.day === day && b.start <= time && b.end > time)
    );
};

// Updates blocks while dragging
const updateBlockSelection = (day, start, end) => {
    setBlocks((prevBlocks) => {
        let newBlocks = [...prevBlocks];

        const existingBlock = newBlocks.find(b => b.day === day && b.start === start);

        if (existingBlock) {
            existingBlock.end = Math.max(start, end) + 1;
        } else {
            newBlocks.push({day, start: Math.min(start, end), end: Math.max(start, end) + 1});
        }

        return [...newBlocks];
    });
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with days */}
      <View style={styles.header}>
        {DAYS.map((day, index) => (
          <Text key={index} style={styles.dayText}>{day}</Text>
        ))}
      </View>
      
      {/* Scheduler Grid */}
      <View style= {styles.touchWrapper} {...panResponder.panHandlers}>
        <View style={styles.grid}>
            {[...Array(TOTAL_INTERVALS)].map((_, hour) => (
                <View key={hour} style={styles.row}>
                {DAYS.map((_, day) => (
                    <View key={day} style={styles.cell}>
                        {blocks.some((b) => b.day === day && b.start <= hour && b.end > hour) && (
                        <View style={styles.selectedBlock} />
                        )}
                    </View>
                ))}
                </View>
            ))}
        </View>
      </View>
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
    //cell: { width: CELL_WIDTH, height: CELL_HEIGHT, borderWidth: 0.5, borderColor: "#ccc" },
    selectedBlock: { flex: 1, backgroundColor: "#002e6d" },
    touchWrapper: {flex: 1},
});
