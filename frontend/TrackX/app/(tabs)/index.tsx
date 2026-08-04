import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { router } from 'expo-router';
import { loginUser } from '.././../services/api';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Basic validation
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const data = await loginUser(email, password);
            
            // Routing to correct dashboard based on user role
            if (data.role === 'student') {
                router.replace('/(student)/dashboard');
            } else if (data.role === 'lecturer') {
                router.replace('/(lecturer)/dashboard');
            } else if (data.role === 'admin') {
                router.replace('/(admin)/dashboard');
            }
        } catch (error) {
            // Handle different error responses from Django
            if (error.response?.status === 401) {
                Alert.alert('Error', error.response.data.error);
            } else if (error.response?.status === 403) {
                Alert.alert('Account Locked', error.response.data.error);
            } else {
                Alert.alert('Error', 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.innerContainer}>
                {/* App Title */}
                <Text style={styles.title}>TrackX</Text>
                <Text style={styles.subtitle}>Attendance Tracking System</Text>

                {/* Email Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {/* Password Input */}
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {/* Login Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c35',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 50,
    },
    input: {
        backgroundColor: '#34344e',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#3A3A5E',
    },
    button: {
        backgroundColor: '#47bc4b',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});