import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { logoutUser } from "../../services/api";
import api from "../../services/api";


export default function LecturerDashboard() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchdata();
  }, []);

  const fetchdata = async () => {
    try {
      const response = await api.get("/lecturer/checkins/");
      setCheckins(response.data.checkins);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
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
        <Text style={styles.headerTitle}>TrackX</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Import Attendance</Text>
        <TouchableOpacity style={styles.importButton}>
          <Text style={styles.importButtonText}>Upload Teams CSV</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.card}>
        <Text style={styles.cardTitle}>Campus Scanner</Text>
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={() => router.push("/(lecturer)/scanner")}
        >
          <Text style={styles.importButtonText}> Start Scanning</Text>
        </TouchableOpacity>
      </View>


      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Today's Check-ins ({checkins.length})
        </Text>
        {checkins.length === 0 ? (
          <Text style={styles.noData}>No check-ins recorded today</Text>
        ) : (
          checkins.map((checkin, index) => (
            <View key={index} style={styles.listRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {checkin.student_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{checkin.student_name}</Text>
                <Text style={styles.listSub}>{checkin.checkin_time}</Text>
              </View>
              <Text style={styles.listHours}>{checkin.total_hours} hrs</Text>
            </View>
          ))
        )}
      </View>
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
    color: "#FFFFFF",
  },
  logoutText: {
    color: "#F44336",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#16213E",
    margin: 15,
    padding: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  importButton: {
    backgroundColor: "#2196F3",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  importButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noData: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  listSub: {
    color: "#999",
    fontSize: 12,
    marginTop: 2,
  },
  listHours: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  scannerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
},
});
