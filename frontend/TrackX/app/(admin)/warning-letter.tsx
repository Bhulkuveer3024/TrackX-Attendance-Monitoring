import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function WarningLetterScreen() {
    const { studentName, studentId, totalHours, status } = useLocalSearchParams();
    const hoursRemaining = Math.max(0, 20 - parseFloat(totalHours)).toFixed(1);
    const today = new Date().toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backButton}> Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Warning Letter</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Letter */}
            <View style={styles.letterContainer}>
                {/* Institution Header */}
                <View style={styles.institutionHeader}>
                    <Text style={styles.institutionName}>TERTIARY COLLEGE</Text>
                    <Text style={styles.institutionAddress}>Auckland, New Zealand</Text>
                    <Text style={styles.institutionAddress}>attendance@tertiary.ac.nz</Text>
                </View>

                <View style={styles.divider} />

                {/* Date and Reference */}
                <Text style={styles.date}>{today}</Text>
                <Text style={styles.reference}>
                    Subject: Attendance Warning Notice — {studentId}
                </Text>

                <View style={styles.divider} />


                <Text style={styles.salutation}>Dear {studentName},</Text>

                <Text style={styles.paragraph}>
                    Our records indicate that your campus attendance for the current week is below the required threshold.
                </Text>


                <View style={styles.detailsBox}>
                    <Text style={styles.detailsTitle}>Current Attendance Details</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Student ID</Text>
                        <Text style={styles.detailValue}>{studentId}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hours Completed</Text>
                        <Text style={styles.detailValue}>{totalHours} hrs</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Required Hours</Text>
                        <Text style={styles.detailValue}>20 hrs per week</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hours Remaining</Text>
                        <Text style={[styles.detailValue, { color: '#F44336' }]}>
                            {hoursRemaining} hrs
                        </Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text style={[
                            styles.detailValue,
                            { color: status === 'at_risk' ? '#FF9800' : '#F44336' }
                        ]}>
                            {status === 'at_risk' ? 'At Risk' : 'Non Compliant'}
                        </Text>
                    </View>
                </View>

                <Text style={styles.paragraph}>
                    You are required to complete the remaining {hoursRemaining} hours of campus attendance before the end of this week. 
                </Text>

                <Text style={styles.paragraph}>
                    Please ensure you are checking in and out correctly using the TrackX attendance system when on campus. If you believe there is an error in your attendance records, please contact your academic administrator immediately.
                </Text>

                <Text style={styles.paragraph}>
                    We encourage you to attend campus and make use of all available support services. If you are facing any difficulties that are affecting your attendance, please reach out to your student advisor as soon as possible.
                </Text>


                <Text style={styles.closing}>Yours sincerely,</Text>
                <Text style={styles.signatory}>Attendance Administration</Text>
                <Text style={styles.signatory}>Tertiary College</Text>
                <Text style={styles.signatory}>Auckland, New Zealand</Text>

                <View style={styles.divider} />


                <Text style={styles.footer}>
                    This is a system-generated notice from TrackX Attendance System.
                </Text>
                <Text style={styles.footer}>
                    Generated on {today}
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
    letterContainer: {
        margin: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
    },
    institutionHeader: {
        alignItems: 'center',
        marginBottom: 10,
    },
    institutionName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A2E',
        letterSpacing: 2,
    },
    institutionAddress: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 15,
    },
    date: {
        fontSize: 13,
        color: '#333',
        marginBottom: 8,
    },
    reference: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    salutation: {
        fontSize: 14,
        color: '#333',
        marginBottom: 15,
        marginTop: 5,
    },
    paragraph: {
        fontSize: 13,
        color: '#333',
        lineHeight: 20,
        marginBottom: 15,
        textAlign: 'justify',
    },
    detailsBox: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#F44336',
    },
    detailsTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
    },
    detailValue: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    closing: {
        fontSize: 13,
        color: '#333',
        marginTop: 10,
        marginBottom: 5,
    },
    signatory: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    footer: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        marginTop: 5,
    },
});