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
import * as DocumentPicker from "expo-document-picker";

export default function LecturerDashboard() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

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

  const handleImportCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setImporting(true);

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "text/csv",
      });

      const response = await api.post("/lecturer/import-csv/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setImportResults(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to import CSV file");
    } finally {
      setImporting(false);
    }
  };

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
        <TouchableOpacity
          style={styles.importButton}
          onPress={handleImportCSV}
          disabled={importing}
        >
          <Text style={styles.importButtonText}>
            {importing ? "Importing..." : "Upload Teams CSV"}
          </Text>
        </TouchableOpacity>
      </View>

      {importResults && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Import Results</Text>

          {/* Summary counts */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.summaryCount}>
                {importResults.summary.present}
              </Text>
              <Text style={styles.summaryLabel}>Present</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: "#FF9800" }]}>
              <Text style={styles.summaryCount}>
                {importResults.summary.discrepancy_campus_only +
                  importResults.summary.discrepancy_teams_only}
              </Text>
              <Text style={styles.summaryLabel}>Discrepancy</Text>
            </View>
            <View style={[styles.summaryBadge, { backgroundColor: "#F44336" }]}>
              <Text style={styles.summaryCount}>
                {importResults.summary.absent}
              </Text>
              <Text style={styles.summaryLabel}>Absent</Text>
            </View>
          </View>

          {/* Actionable students list */}
          <Text style={styles.sectionTitle}>Requires Attention</Text>
          {importResults.results
            .filter((r) => r.status !== "present")
            .slice(0, visibleCount)
            .map((student, index) => (
              <View key={index} style={styles.resultRow}>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{student.student_name}</Text>
                  <Text style={styles.listSub}>{student.action}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        student.status === "absent" ? "#F44336" : "#FF9800",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {student.status === "absent" ? "Absent" : "Discrepancy"}
                  </Text>
                </View>
              </View>
            ))}

          {importResults.results.filter((r) => r.status !== "present").length >
            visibleCount && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => setVisibleCount((prev) => prev + 5)}
            >
              <Text style={styles.viewMoreText}>
                View More (
                {importResults.results.filter((r) => r.status !== "present")
                  .length - visibleCount}{" "}
                remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
                <Text style={styles.listSub}>
                  {checkin.checkin_date} — {checkin.checkin_time}
                </Text>
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
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 10,
  },
  summaryBadge: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryCount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  summaryLabel: {
    color: "#fff",
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: "#999",
    fontSize: 13,
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  viewMoreButton: {
    padding: 12,
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A2A3E",
  },
  viewMoreText: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "500",
  },
});
