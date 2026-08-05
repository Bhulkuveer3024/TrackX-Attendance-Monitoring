import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { getTodayAttendance, getWeeklyAttendance, logoutUser } from '../../services/api';

export default function StudentDashboard() {
    const [todayData, setTodayData] = useState(null);
    const [weeklyData, setWeeklyData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [today, weekly] = await Promise.all([
                getTodayAttendance(),
                getWeeklyAttendance()
            ]);
            setTodayData(today);
            setWeeklyData(weekly);
        } catch (error) {
            Alert.alert('Error', 'Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logoutUser();
        router.replace('/');
    };

    const getStatusColour = (status) => {
        if (status === 'compliant') return '#4CAF50';
        if (status === 'at_risk') return '#FF9800';
        return '#F44336';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    const progressPercentage = weeklyData ? 
        Math.min((weeklyData.total_hours / 20) * 100, 100) : 0;

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>TrackX</Text>
                <TouchableOpacity onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Today's Attendance */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
                {todayData && todayData.checkin_time_nzst ? (
                    <>
                        <View style={styles.row}>
                            <Text style={styles.label}>Checked in</Text>
                            <Text style={styles.value}>{todayData.checkin_time_nzst}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Checked out</Text>
                            <Text style={styles.value}>
                                {todayData.checkout_time_nzst || '--:--'}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Hours today</Text>
                            <Text style={styles.value}>{todayData.total_hours} hrs</Text>
                        </View>
                    </>
                ) : (
                    <Text style={styles.noData}>No check-in recorded today</Text>
                )}
            </View>

            {/* Weekly Progress */}
            {weeklyData && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weekly Campus Hours</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>
                            {weeklyData.total_hours} of 20 hours
                        </Text>
                        <Text style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColour(weeklyData.status) }
                        ]}>
                            {weeklyData.status.replace('_', ' ')}
                        </Text>
                    </View>
                    {/* Progress Bar */}
                    <View style={styles.progressBar}>
                        <View style={[
                            styles.progressFill,
                            {
                                width: `${progressPercentage}%`,
                                backgroundColor: getStatusColour(weeklyData.status)
                            }
                        ]} />
                    </View>
                    <Text style={styles.hoursRemaining}>
                        {Math.max(0, 20 - weeklyData.total_hours).toFixed(2)} hours remaining
                    </Text>
                </View>
            )}

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push('/(student)/qr')}
                >
                    <Text style={styles.actionButtonText}>Show My QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#2196F3', marginTop: 10 }]}
                    onPress={() => router.push('/(student)/history')}
                >
                    <Text style={styles.actionButtonText}>View History</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    logoutText: {
        color: '#F44336',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#16213E',
        margin: 15,
        borderRadius: 12,
        padding: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: '#999',
        fontSize: 14,
    },
    value: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    noData: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
    progressBar: {
        height: 10,
        backgroundColor: '#2A2A3E',
        borderRadius: 5,
        marginVertical: 10,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    hoursRemaining: {
        color: '#999',
        fontSize: 12,
        textAlign: 'right',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    actionButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 15,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});