import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import AdBanner from "../components/AdBanner"; // Import the AdBanner component

export default function InstructionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { questionId } = route.params;

  const [timeLimit, setTimeLimit] = useState("");
  const [isActivated, setIsActivated] = useState(false);

  // Check activation status
  useEffect(() => {
    const checkActivationStatus = async () => {
      try {
        const activationStatus = await AsyncStorage.getItem("isActivated");
        setIsActivated(activationStatus === "true");
      } catch (error) {
        console.log('Error checking activation status:', error);
        setIsActivated(false);
      }
    };

    checkActivationStatus();
  }, []);

  useEffect(() => {
    const setDefaultTime = async () => {
      const examType = await AsyncStorage.getItem("examType");
      if (examType && examType.includes("level")) {
        setTimeLimit("40");
      } else {
        setTimeLimit("120");
      }
    };
    setDefaultTime();
  }, [questionId]);

  const handleProceed = async () => {
    try {
      const finalTimeLimit =
        timeLimit || (questionId && questionId.includes("[") ? "10" : "30");
      await AsyncStorage.setItem("examTime", String(parseInt(finalTimeLimit, 10)));
      navigation.navigate("examScreen", { questionId });
    } catch (err) {
      console.error("Error saving exam info:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Instructions</Text>

        <View style={styles.instructions}>
          <Text style={styles.point}>• Complete all questions within the allotted time.</Text>
          <Text style={styles.point}>• You may skip any question and return to it later.</Text>
          <Text style={styles.point}>• Answered questions will be highlighted in green.</Text>
          <Text style={styles.point}>• The test will auto-submit when the time runs out.</Text>
          <Text style={styles.point}>• Progress will not be saved if you exit the test.</Text>
        </View>

        <Text style={styles.timeLabel}>You can increase or decrease the time</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={timeLimit}
          onChangeText={setTimeLimit}
          placeholder={questionId && questionId.includes("[") ? "10" : "30"}
        />
        <Text style={styles.minutes}>minutes</Text>

        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedText}>Proceed to Exam</Text>
        </TouchableOpacity>
      </View>

      {/* AdBanner at bottom - Only show if not activated */}
      {!isActivated && <AdBanner />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    justifyContent: "space-between" ,
    marginBottom: 30,
  },
  content: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 15,
    textAlign: "center",
    color: "#2c3e50"
  },
  instructions: { 
    marginBottom: 30,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff"
  },
  point: { 
    fontSize: 16, 
    marginBottom: 10,
    lineHeight: 22,
    color: "#495057"
  },
  timeLabel: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "red",
    textAlign: "center",
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: "#007bff",
    padding: 12,
    width: 100,
    borderRadius: 8,
    marginTop: 5,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    alignSelf: "center",
    backgroundColor: "#f8f9fa"
  },
  minutes: { 
    fontSize: 16, 
    marginTop: 8, 
    marginBottom: 30,
    textAlign: "center",
    color: "#6c757d"
  },
  proceedButton: {
    backgroundColor: "#007bff",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
});