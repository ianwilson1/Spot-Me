import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

const MainMap = React.forwardRef((props, ref) => {
    return (
        <View style={styles.container}>
            <MapView 
                ref={ref}
                style={styles.map}
                setCamera={{
                    heading: 50,
                }}
                minZoomLevel={15}
                initialRegion={{
                    latitude: 36.81369124340123,
                    longitude: -119.7455163161234,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    }
});
  
export default MainMap;