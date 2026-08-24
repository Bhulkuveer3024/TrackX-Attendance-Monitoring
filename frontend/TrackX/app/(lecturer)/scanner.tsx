import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import api from '../../services/api';

export default function ScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const cameraRef = useRef(null);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>
                    Camera permission is required to scan QR codes
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);

        const studentId = data;

        try {
            // Capture photo
            let photoData = null;
            if (cameraRef.current) {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    base64: true
                });
                photoData = photo;
            }

            // Try check-in first
            try {
                const checkinResponse = await api.post('/attendance/checkin/', {
                    student_id: studentId
                });

                const studentName = checkinResponse.data.student_name;
                const checkinTime = checkinResponse.data.checkin_time_nzst;

                Alert.alert(
                    'Checked In',
                    `${studentName} signed in at ${checkinTime}`,
                    [{ text: 'OK', onPress: () => {
                        setScanned(false);
                        router.back();
                    }}]
                );

            } catch (checkinError) {
                // If check-in fails try checkout
                if (checkinError.response?.status === 400) {
                    const checkoutResponse = await api.post('/attendance/checkout/', {
                        student_id: studentId
                    });

                    const studentName = checkoutResponse.data.student_name;
                    const checkoutTime = checkoutResponse.data.checkout_time_nzst;
                    const totalHours = checkoutResponse.data.total_hours;

                    Alert.alert(
                        'Checked Out',
                        `${studentName} checked out at ${checkoutTime}\nTotal: ${totalHours} hrs`,
                        [{ text: 'OK', onPress: () => {
                            setScanned(false);
                            router.back();
                        }}]
                    );
                } else {
                    throw checkinError;
                }
            }

        } catch (error) {
            if (error.response?.status === 404) {
                Alert.alert('Error', 'Student not found. Please check the QR code.');
            } else {
                Alert.alert('Error', 'Failed to process scan. Please try again.');
            }
            setScanned(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}> Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scan Student QR</Text>
                <View style={{ width: 60 }} />
            </View>

            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr']
                }}
            >
                {/* Scanning overlay */}
                <View style={styles.overlay}>
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.scanText}>
                        Point camera at student's QR code
                    </Text>
                </View>

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                )}
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#16213E',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        color: '#4CAF50',
        fontSize: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanArea: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#4CAF50',
        borderWidth: 3,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 10,
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        padding: 20,
        marginTop: 100,
    },
    permissionButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 15,
        margin: 20,
        alignItems: 'center',
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});