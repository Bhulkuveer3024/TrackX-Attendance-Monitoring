import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export default function RootLayout() {
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        // Listener for when notification is received while app is open
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });

        // Listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);
            // Route to student dashboard when notification tapped
            router.push('/(student)/dashboard');
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return (
        <>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="auto" />
        </>
    );
}