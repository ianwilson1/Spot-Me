import React, { useState } from "react";
import {View, TextInput, Alert, Text, StyleSheet, TouchableOpacity} from "react-native";

export const LoginScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        let name = username;
        let passwd = password;

        let msgObj = {
            "op":"CreateAccount",
            "name":name,
            "passwd":passwd
        }

        if(sendMsg(JSON.stringify(msgObj))) {
            Alert.alert("Login successful");
        }
        else {
            Alert.alert("Login failed");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <TouchableOpacity style={styles.buttons} onPress={handleLogin}>
                <Text style={styles.text}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity title="Register" onPress={() => navigation.navigate('Register')}/>
        </View>
    )
}

export const RegisterScreen = ({navigation, sendMsg}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        let name = username;
        let passwd = password;

        let msgObj = {
            "op":"CreateAccount",
            "name":name,
            "passwd":passwd
        }

        if(sendMsg(JSON.stringify(msgObj))) {
            Alert.alert("Login successful");
        }
        else {
            Alert.alert("Login failed");
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

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center'},
    input: {height: 40, borderColor: 'black', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
    buttons: {height: 25, alignItems: 'center', backgroundColor: 'darkblue', padding: 2},
    text: {color: 'white'}
});
