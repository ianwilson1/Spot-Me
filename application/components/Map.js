import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

const MainMap = () => {
    return (
        <View style={styles.container}>
            <MapView 
                style={styles.map}
                initialRegion={{
                    latitude: 37.78825,
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        height: 400,
        width: 400,
        justifyContent: 'center',
        alignItems: 'center'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    }
});
  
export default MainMap;