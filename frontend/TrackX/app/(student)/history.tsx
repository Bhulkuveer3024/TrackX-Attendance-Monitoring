import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { getAttendanceHistory } from '../../services/api';

export default function HistoryScreen() {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getAttendanceHistory();
            setHistoryData(data.weeks);
        } catch (error) {
            Alert.alert('Error', 'Failed to load attendance history');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColour = (status) => {
        if (status === 'compliant') return '#4CAF50';
        if (status === 'at_risk') return '#FF9800';
        return '#F44336';
    };

    const getStatusLabel = (status) => {
        if (status === 'compliant') return 'Compliant';
        if (status === 'at_risk') return 'At Risk';
        return 'Non Compliant';
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}> Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <View style={{ width: 60 }} />
            </View>

            {historyData.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No attendance history found</Text>
                </View>
            ) : (
                historyData.map((week, index) => (
                    <View key={index} style={styles.weekCard}>
                        <View style={styles.weekHeader}>
                            <Text style={styles.weekTitle}>
                                Week of {week.week_starting}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColour(week.status) }
                            ]}>
                                <Text style={styles.statusText}>
                                    {getStatusLabel(week.status)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.hoursRow}>
                            <Text style={styles.hoursLabel}>Total Hours</Text>
                            <Text style={styles.hoursValue}>
                                {week.total_hours} / 20 hrs
                            </Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min((week.total_hours / 20) * 100, 100)}%`,
                                    backgroundColor: getStatusColour(week.status)
                                }
                            ]} />
                        </View>

                        {/* Individual Records */}
                        {week.records.map((record, recordIndex) => (
                            <View key={recordIndex} style={styles.recordRow}>
                                <Text style={styles.recordDate}>{record.date}</Text>
                                <Text style={styles.recordHours}>
                                    {record.total_hours} hrs
                                </Text>
                            </View>
                        ))}
                    </View>
                ))
            )}
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        color: '#4CAF50',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
    weekCard: {
        backgroundColor: '#16213E',
        margin: 15,
        borderRadius: 12,
        padding: 20,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    weekTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    hoursRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    hoursLabel: {
        color: '#999',
        fontSize: 14,
    },
    hoursValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#2A2A3E',
        borderRadius: 4,
        marginBottom: 15,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    recordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#2A2A3E',
    },
    recordDate: {
        color: '#999',
        fontSize: 13,
    },
    recordHours: {
        color: '#fff',
        fontSize: 13,
    },
});