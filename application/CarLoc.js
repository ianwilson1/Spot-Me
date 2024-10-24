import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export const saveParkedLocation = async (setParkedLocation) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Location permission denied');
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    const locationToSave = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };

    await AsyncStorage.setItem('parkedLocation', JSON.stringify(locationToSave));
    setParkedLocation(locationToSave);
    alert('Location saved!');
  } catch (error) {
    console.error('Error saving location', error);
  }
};

export const loadParkedLocation = async (setParkedLocation) => {
  try {
    const savedLocation = await AsyncStorage.getItem('parkedLocation');
    if (savedLocation) {
      setParkedLocation(JSON.parse(savedLocation));
    }
  } catch (error) {
    console.error('Failed to load parked location', error);
  }
};

export const forgetParkedLocation = async (setParkedLocation) => {
  try {
    await AsyncStorage.removeItem('parkedLocation');
    setParkedLocation(null);
    alert('Location forgotten');
  } catch (error) {
    console.error('Error forgetting location', error);
  }
};
