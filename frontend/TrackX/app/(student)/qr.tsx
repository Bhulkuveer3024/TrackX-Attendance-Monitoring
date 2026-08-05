import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import api from "../../services/api";

export default function QRScreen() {
  const [qrBase64, setQrBase64] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const response = await fetch("http://10.0.2.2:8000/api/attendance/qr/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrBase64(reader.result);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert("Error", "Failed to generate QR code");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}> Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>
          Show this QR code to the campus scanner when entering or leaving
        </Text>

        <View style={styles.qrContainer}>
          {qrBase64 && (
            <Image
              source={{ uri: qrBase64 }}
              style={styles.qrImage}
              contentFit="contain"
            />
          )}
        </View>
      </View>
    </View>
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    color: "#4CAF50",
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  instruction: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  qrContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 5,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  note: {
    color: "#999",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
  },
});
