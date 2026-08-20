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
import { router, useLocalSearchParams } from 'expo-router';
import api from '../../services/api';

export default function AttendanceSummaryScreen() {
    const { studentId, studentName } = useLocalSearchParams();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/admin/summary/?student_id=${studentId}`);
            setRecords(response.data.records);
            setSummary(response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load attendance summary');
        } finally {
            setLoading(false);
        }
    };

    const calculatePercentage = (hours) => {
        return Math.min((hours / 20) * 100, 100).toFixed(1);
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}> Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Attendance Report</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Institution Header */}
            <View style={styles.institutionHeader}>
                <Text style={styles.institutionName}>Tertiary College</Text>
                <Text style={styles.institutionSubtitle}>Auckland, New Zealand</Text>
                <Text style={styles.reportTitle}>Student Attendance Summary Report</Text>
            </View>

            {/* Student Details */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Student Information</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{studentName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Student ID</Text>
                    <Text style={styles.infoValue}>{studentId}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Period</Text>
                    <Text style={styles.infoValue}>{summary?.period}</Text>
                </View>
            </View>

            {/* Weekly Records */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Weekly Attendance Records</Text>
                {records.length === 0 ? (
                    <Text style={styles.noData}>No attendance records found</Text>
                ) : (
                    records.map((record, index) => (
                        <View key={index} style={styles.recordRow}>
                            <Text style={styles.recordDate}>{record.date}</Text>
                            <Text style={styles.recordHours}>{record.total_hours} hrs</Text>
                            <Text style={styles.recordPercent}>
                                {calculatePercentage(record.total_hours)}%
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Summary Totals */}
            <View style={styles.totalCard}>
                <Text style={styles.cardTitle}>Summary</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Total Hours</Text>
                    <Text style={styles.infoValue}>{summary?.total_hours} hrs</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Average Daily Hours</Text>
                    <Text style={styles.infoValue}>
                        {records.length > 0 
                            ? (summary?.total_hours / records.length).toFixed(2) 
                            : '0'} hrs
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Overall Percentage</Text>
                    <Text style={styles.infoValue}>
                        {calculatePercentage(summary?.total_hours)}%
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Weekly Requirement</Text>
                    <Text style={styles.infoValue}>20 hours</Text>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Generated by TrackX Attendance System
                </Text>
                <Text style={styles.footerText}>
                    {new Date().toLocaleDateString('en-NZ')}
                </Text>
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    backButton: {
        color: '#4CAF50',
        fontSize: 16,
    },
    institutionHeader: {
        backgroundColor: '#16213E',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#4CAF50',
        marginBottom: 15,
    },
    institutionName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    institutionSubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    reportTitle: {
        fontSize: 16,
        color: '#4CAF50',
        marginTop: 10,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#16213E',
        margin: 15,
        marginBottom: 0,
        borderRadius: 12,
        padding: 20,
    },
    totalCard: {
        backgroundColor: '#1A2E1A',
        margin: 15,
        marginBottom: 0,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A3E',
    },
    infoLabel: {
        color: '#999',
        fontSize: 14,
    },
    infoValue: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    recordRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A3E',
    },
    recordDate: {
        color: '#999',
        fontSize: 13,
        flex: 2,
    },
    recordHours: {
        color: '#fff',
        fontSize: 13,
        flex: 1,
        textAlign: 'center',
    },
    recordPercent: {
        color: '#4CAF50',
        fontSize: 13,
        flex: 1,
        textAlign: 'right',
    },
    noData: {
        color: '#999',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        marginTop: 15,
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
});