import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotifications() {
    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    // User denied permission
    if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Android requires notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'TrackX Notifications',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            sound: true,
        });
    }

    return token;
}

export async function savePushToken(token) {
    if (!token) return;
    try {
        await api.post('/auth/push-token/', { token });
    } catch (error) {
        console.log('Failed to save push token:', error);
    }
}