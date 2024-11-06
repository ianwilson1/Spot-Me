import React, {useEffect, useState} from "react";
import {View, TextInput, Button, Alert, Text, StyleSheet, TouchableOpacity} from "react-native";
import TcpSocket from "react-native-tcp-socket";



export const LoginScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        const client = TcpSocket.createConnection(
            {port: 15024, host: "http://34.105.119.88:15024"},
            () => {
                console.log("Connected to server");

                const loginData = JSON.stringify({
                    op: "logIn",
                    name: username,
                    passwd: password,
                });

                const header = String(loginData.length).padStart(64, ' ');
                client.write(header + loginData);
            }
        );

        client.on("data", (data) => {
            const response = JSON.parse(data.toString());
            if(response.success){
                Alert.alert("Login Successful!", "Welcome back!");
                navigation.goBack();
            }
            else{
                Alert.alert("Login Failed!", response.message || "Incorrect username or password.");
            }
            client.destroy();
        });

        client.on("error", (error) => {
            console.error("Connection error:", error);
            Alert.alert("Connection Failed!", "Could not connect to server.");
        });

        client.on("close", () => {
            console.log("Connection closed");
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <TouchableOpacity style={styles.buttons} onPress={handleLogin}>
                <Text>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity title="Register" onPress={() => navigation.navigate('Register')}/>
        </View>
    )
}

export const RegisterScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = () => {
        const client = TcpSocket.createConnection(
            {port: 15024, host: "http://34.105.119.88:15024"},
            () => {
                console.log("Connected to server");

                const registerData = JSON.stringify({
                    op: "CreateAccount",
                    name: username,
                    passwd: password,
                });
                const header = String(registerData.length).padStart(64,'');
                client.write(header + registerData);
            }
        );

        client.on("data", (data) => {
            const response = JSON.parse(data.toString());
            if(response.success){
                Alert.alert("Registration Successful!", response.message);
                navigation.goBack();
            }
            else{
                Alert.alert("Registration Failed!", response.message);
            }
            client.destroy();
        });

        client.on("error", (error) => {
            console.error("Connection error:", error);
            Alert.alert("Connection Failed!", "Could not connect to server.");
        });

        client.on("close", () => {
            console.log("Connection closed");
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <TouchableOpacity title="Register" onPress={handleRegister}/>
            <TouchableOpacity title="Go to login" onPress={() => navigation.navigate('Login')}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20, backgroundColor: "red"},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center'},
    input: {height: 40, borderColor: 'black', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
    buttons: {height: 20, alignItems: 'center', backgroundColor: 'blue', padding: 2},
});
