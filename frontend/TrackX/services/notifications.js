import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

export async function registerForPushNotifications() {
    // expo-notifications not supported in Expo Go SDK 53+
    // Hence, will be implemented in development build
    console.log('Push notifications require a development build');
    return null;
}

export async function savePushToken(token) {
    if (!token) return;
    await api.post('/auth/push-token/', { token });
}