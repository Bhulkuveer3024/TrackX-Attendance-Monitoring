import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {platform} from 'react-native';
import api from './api';

// Function to register for push notifications
export async function registerForPushNotifications() {
    if (!Device.isDevice) return null;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    return token;
}

// Saving token to Django backend
export async function savePushToken(token) {
    if (!token) return;
    await api.post('/auth/push-token/', { token });
}