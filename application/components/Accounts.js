import React, {useState} from "react";
import {View, TextInput, Button, Alert, Text, StyleSheet} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LoginScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const storedUser = await AsyncStorage.getItem(username);
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.password === password) {
                    Alert.alert("Login Successful", "Welcome back!");
                    navigation.goBack();
                }
                else {
                    Alert.alert("Login Failed", "Incorrect password.");
                }
            }
            else {
                Alert.alert("Login Failed", "User not found.");
            }
        }
        catch (e) {
            console.error(e);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <Button title="Login" onPress={handleLogin}/>
            <Button title="Register" onPress={() => navigation.navigate('Register')}/>
        </View>
    )
}

export const RegisterScreen = ({navigation}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async () => {
        const existingUser = await AsyncStorage.getItem(username);
        if(existingUser){
            Alert.alert("Registration Failed", "Username is already taken.");
        }
        else {
            await AsyncStorage.setItem(username, JSON.stringify({username, password}));
            Alert.alert("Registration Successful", "You can now log in.");
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
            <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword}/>
            <Button title="Register" onPress={handleRegister}/>
            <Button title="Go to login" onPress={() => navigation.navigate('Login')}/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', padding: 20},
    title: {fontSize: 24, marginBottom: 20, textAlign: 'center'},
    input: {height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingLeft: 8, borderRadius: 5},
});
