import React, { useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity, Button, Modal} from "react-native";

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

        if(serverResponse.success) {
            setIsLoggedIn(true);
            Alert.alert("Login successful");
            navigation.navigate("Main");
        }
        else {
            Alert.alert("Login failed", serverResponse.error || "Unknown error");
        }
        } catch (error) {
            Alert.alert("Error", "Could not connect to server.");
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
            <TouchableOpacity title="Register" onPress={() => navigation.navigate('Register')}/>
        </View>
    )
}

export const RegisterScreen = ({navigation, sendMsg, setIsLoggedIn, isLoggedIn}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        try{
            const msgObj = {
                "op": "CreateAccount",
                "name": username,
                "passwd": password
            };

            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.success) {
                Alert.alert("Registration successful");
                setIsLoggedIn(true);
                navigation.navigate("Main");
            } else {
                Alert.alert("Registration failed", serverResponse.error || "Unknown error");
            }
        } catch (error){
            Alert.alert("Error", "Could not connect to server.");
            console.error(error);
        }
        };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <TouchableOpacity title="Register" style={styles.buttons} onPress={handleRegister}>
            <Text style={styles.text}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity title="Go to login" onPress={() => navigation.navigate('Login')}/>
        </View>
    );
};

export const AccountMenuScreen = ({sendMsg, navigation, setIsLoggedIn, isLoggedIn}) => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);

    //log out function from syst req
    const handleLogout = () => {
        setIsLoggedIn(false);
        navigation.navigate("Main");
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

            if (serverResponse.success) {
                setModalVisible(false);
                setIsLoggedIn(false);
                Alert.alert("Account deleted successfully");
                navigation.navigate("Main");
            } else {
                Alert.alert("Operation failed", serverResponse.error || "Unknown error");
            }
        }   catch(error) {
            Alert.alert("Error", "Could not connect to server.");
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Account Menu</Text>
            <TouchableOpacity onPress = {() => navigation.navigate("UpdateAccount")}>
                <Text style={styles.container}>Update Account</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress = {() => navigation.navigate("YourPermits")}>
                <Text style={styles.container}>
                    My Permits
                </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("WeeklySchedule")}>
                <Text style={styles.container}>
                    Weekly Schedule
                </Text>
            </TouchableOpacity>
            <TouchableOpacity title="Logout" onPress={handleLogout}>
                <Text style={styles.container}>Log Out</Text>
            </TouchableOpacity>
            <TouchableOpacity title="DelAct" onPress={() => setModalVisible(true)}>
                <Text style={styles.container}>
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
                            placeholder="Username"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                        />
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
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
                                <Text style={styles.buttonText}>Cancle</Text>
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

            if (serverResponse.success) {
                Alert.alert("Success", "Username updated successfully!");
                navigation.navigate("AccountMenu");
            } else {
                Alert.alert("Update failed", serverResponse.error || "Unknown error");
            }
        } catch (error) {
            Alert.alert("Error", "Could not connect to the server.");
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
        try {
            const msgObj = {
                "op": "UpdatePass",
                "name": currUsername,
                "passwd": currPasswd,
                "newPass": newPasswd,
            };
        
            const response = await sendMsg(JSON.stringify(msgObj));
            const serverResponse = JSON.parse(response);

            if (serverResponse.success){
                Alert.alert("Password updated successfully!");
                navigation.navigate("AccountMenu");
            } else {
                Alert.alert("Update failed", serverResponse.error || "Unknown error");
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

};

//feature 5.5 from system req doc
export const WeeklySchedule = ({navigation, sendMsg}) => {

};

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center'},
    input: {height: 40, borderColor: 'black', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
    buttons: {height: 25, alignItems: 'center', backgroundColor: 'darkblue', padding: 2},
    text: {color: 'white'},
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
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
        fontWeight: 'bold',
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
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    cancelButton: {
        backgroundColor: 'red'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    }
});
