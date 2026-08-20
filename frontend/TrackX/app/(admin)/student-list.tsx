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
import api from '../../services/api';

export default function StudentListScreen() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/admin/students/');
            setStudents(response.data.students);
        } catch (error) {
            Alert.alert('Error', 'Failed to load students');
        } finally {
            setLoading(false);
        }
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

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Student</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    All Students ({students.length})
                </Text>
                {students.map((student, index) => (
                    <View key={index} style={styles.studentRow}>
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {student.student_name}
                            </Text>
                            <Text style={styles.studentId}>
                                {student.student_id}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColour(student.status) }
                            ]}>
                                <Text style={styles.statusText}>
                                    {student.total_hours}/20 hrs
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.generateButton}
                            onPress={() => router.push({
                                pathname: '/(admin)/summary',
                                params: {
                                    studentId: student.student_id,
                                    studentName: student.student_name
                                }
                            })}
                        >
                            <Text style={styles.generateButtonText}>Generate</Text>
                        </TouchableOpacity>
                    </View>
                ))}
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
    studentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A3E',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    studentId: {
        color: '#999',
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 4,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    generateButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
});