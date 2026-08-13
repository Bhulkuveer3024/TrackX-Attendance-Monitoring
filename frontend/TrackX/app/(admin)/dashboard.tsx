import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { logoutUser } from "../../services/api";
import api from "../../services/api";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [overrideDate, setOverrideDate] = useState("");
  const [checkinTime, setCheckinTime] = useState("");
  const [checkoutTime, setCheckoutTime] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get("/admin/students/");
      setStudents(response.data.students);
    } catch (error) {
      Alert.alert("Error", "Failed to load student records");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
  };
  const handleOverride = async () => {
    if (!overrideDate) {
      Alert.alert("Error", "Please enter a date");
      return;
    }
    try {
      // Combine date and time into full datetime string
      const fullCheckin = checkinTime
        ? `${overrideDate} ${checkinTime}:00`
        : null;
      const fullCheckout = checkoutTime
        ? `${overrideDate} ${checkoutTime}:00`
        : null;

      await api.put("/admin/override/", {
        student_id: selectedStudent.student_id,
        date: overrideDate,
        checkin_time: fullCheckin,
        checkout_time: fullCheckout,
        notes: notes,
      });
      Alert.alert("Success", "Attendance record updated successfully");
      setModalVisible(false);
      setOverrideDate("");
      setCheckinTime("");
      setCheckoutTime("");
      setNotes("");
      fetchStudents();
    } catch (error) {
      Alert.alert("Error", "Failed to update attendance record");
    }
  };

  const getStatusColour = (status) => {
    if (status === "compliant") return "#4CAF50";
    if (status === "at_risk") return "#FF9800";
    return "#F44336";
  };

  const getStatusLabel = (status) => {
    if (status === "compliant") return "Compliant";
    if (status === "at_risk") return "At Risk";
    return "Non Compliant";
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
        <Text style={styles.headerTitle}>TrackX</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
              {students.filter((s) => s.status === "compliant").length}
            </Text>
            <Text style={styles.statLabel}>Compliant</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#FF9800" }]}>
              {students.filter((s) => s.status === "at_risk").length}
            </Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: "#F44336" }]}>
              {students.filter((s) => s.status === "non_compliant").length}
            </Text>
            <Text style={styles.statLabel}>Non Compliant</Text>
          </View>
        </View>
      </View>

      {/* Student Records */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Records</Text>
        {students.map((student, index) => (
          <View key={index} style={styles.studentRow}>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.student_name}</Text>
              <Text style={styles.studentHours}>
                {student.total_hours}/20 hrs
              </Text>
            </View>
            <View style={styles.studentActions}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColour(student.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(student.status)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSelectedStudent(student);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.resetButtonText}>Override</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Password Reset Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Override Attendance</Text>
            <Text style={styles.modalSubtitle}>
              {selectedStudent?.student_name}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={overrideDate}
              onChangeText={setOverrideDate}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Check-in time (HH:MM)"
              placeholderTextColor="#999"
              value={checkinTime}
              onChangeText={setCheckinTime}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Check-out time (HH:MM)"
              placeholderTextColor="#999"
              value={checkoutTime}
              onChangeText={setCheckoutTime}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Reason for override"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleOverride}
            >
              <Text style={styles.modalButtonText}>Save Override</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "#16213E",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
  },
  statsContainer: {
    padding: 15,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#16213E",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#16213E",
    margin: 15,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  studentHours: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  studentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#2A2A3E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3A3A5E",
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#16213E",
    borderRadius: 16,
    padding: 24,
    width: "80%",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#999",
    fontSize: 14,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#2A2A3E",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#3A3A5E",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalCancelButton: {
    alignItems: "center",
    padding: 8,
  },
  modalCancelText: {
    color: "#999",
    fontSize: 14,
  },
});
