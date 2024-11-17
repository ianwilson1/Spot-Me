import React, { useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity} from "react-native";

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

export const AccountMenuScreen = ({navigation, setIsLoggedIn, isLoggedIn}) => {
    const handleLogout = () => {
        setIsLoggedIn(false);
        navigation.navigate("Main");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Account Menu</Text>
            <TouchableOpacity title="Logout" onPress={handleLogout}>
                <Text style={styles.container}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center'},
    input: {height: 40, borderColor: 'black', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
    buttons: {height: 25, alignItems: 'center', backgroundColor: 'darkblue', padding: 2},
    text: {color: 'white'}
});
