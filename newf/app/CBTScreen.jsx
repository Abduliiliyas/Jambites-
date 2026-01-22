import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getQuestions } from "../database";
import { Ionicons } from '@expo/vector-icons';
import { getResults } from "../simple_database";
import axios from 'axios';
import AdBanner from "../components/AdBanner";

// Replace with your actual API base URL
const API_BASE_URL = "https://healthprof.com.ng/api";

export default function CBTScreen() {
  const [questionIds, setQuestionIds] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [paperResults, setPaperResults] = useState({});
  const [studyMode, setStudyMode] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const router = useRouter();

 const checkSubscriptionStatus = async (userId) => {
  try {
    setCheckingSubscription(true);
    console.log("Checking activation for user:", userId);
    
    // Send userId as an object, not just the value
    const requestBody = {
      userId: userId
    };
    
    const FetchResponse = await fetch(`${API_BASE_URL}/jcreate-user/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody), // ✅ Now sending {userId: value}
    });
    
    // First, check if response is OK
    if (!FetchResponse.ok) {
      const errorText = await FetchResponse.text();
      console.error("Server error response:", errorText);
      throw new Error(`Server error: ${FetchResponse.status}`);
    }
    
    const response = await FetchResponse.json();
    console.log("Activation check full response:", response); // Log full response
    
    // Check if response structure is correct
    if (response && response.success) {
      // Access is_active directly from response
      let isActive = false;
      
      // Check different possible locations for is_active
      if (response.is_active !== undefined) {
        isActive = response.is_active;
      } else if (response.data?.is_active !== undefined) {
        isActive = response.data.is_active;
      }
      
      console.log("Activation status:", isActive, "from response:", response);
      
      // Save activation data to local storage
      await AsyncStorage.setItem('isActivated', isActive ? 'true' : 'false');
      await AsyncStorage.setItem('userId', userId.toString()); // Also save userId if needed
      
      setIsActivated(isActive);
      
      if (isActive) {
        Alert.alert(
          "Activation Successful", 
          "Your account has been activated! You now have access to all premium features."
        );
      } else {
        Alert.alert(
          "Not Activated", 
          "Your account is not activated. Please purchase an activation code."
        );
      }
      
      return isActive;
    } else {
      throw new Error(response.error || 'Invalid response from server');
    }
  } catch (error) {
    console.error("Activation check error:", error);
    
    // More detailed error message
    let errorMessage = "Failed to check activation status. Please try again.";
    
    if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
      errorMessage = "Network error. Please check your internet connection.";
    } else {
      errorMessage = error.message;
    }
    
    Alert.alert("Error", errorMessage);
    return false;
  } finally {
    setCheckingSubscription(false);
  }
};

  const loadPaperResults = async () => {
    try {
      const results = await getResults();
      const resultsByPaper = {};
      results.forEach(result => {
        if (result.questionId && !resultsByPaper[result.questionId]) {
          resultsByPaper[result.questionId] = result;
        }
      });
      setPaperResults(resultsByPaper);
    } catch (error) {
      console.error("Error loading paper results:", error);
    }
  };

  const checkStudyMode = async () => {
    try {
      const study = await AsyncStorage.getItem('study');
      const isStudyMode = study && study.includes('true');
      setStudyMode(isStudyMode);
      return isStudyMode;
    } catch (error) {
      console.error("Error checking study mode:", error);
      setStudyMode(false);
      return false;
    }
  };

  const loadData = async () => {
    try {
      const isStudyMode = await checkStudyMode();
      if (!isStudyMode) await loadPaperResults();

      const savedUser = await AsyncStorage.getItem("userInfo");
      if (!savedUser) return;

      const savedUserId = await AsyncStorage.getItem("userId");
      const activationStatus = await AsyncStorage.getItem("isActivated");
      setUserId(savedUserId);

      console.log("Loaded user ID:", savedUserId);
      console.log("Loaded activation status:", activationStatus);

      // Set activation status
      setIsActivated(activationStatus === "true");

      const rows = await getQuestions();
      if (!rows || rows.length === 0) {
        setQuestionIds([]);
        return;
      }

      //const filtered = rows.filter((q) => q.department === dept);
      const ids = [...new Set(rows.map((q) => q.questionId))];
      setQuestionIds(ids);
      console.log(ids)
    } catch (err) {
      console.error("Load data error:", err);
      setDbError(true);
      setDebugInfo(`Load error: ${err.message}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectQuestionId = async (questionId, index) => {
    setSelectedQuestionId(questionId);
    if (isActivated || index === 0) {
      await AsyncStorage.setItem("selectedQuestionId", questionId);
      // Instead of instructionScreen, now go to selectSubject screen
      router.push("/selectSubject");
    } else {
      setShowPremiumModal(true);
    }
  };

  const handleActivate = () => {
    router.push("subscription");
    setShowPremiumModal(false);
  };

  const handleCancel = () => {
    setShowPremiumModal(false);
  };

  const handleCheckActivation = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please make sure you're logged in.");
      return;
    }
    
    console.log("Checking activation for user ID:", userId);
    const isActive = await checkSubscriptionStatus(userId);
    
    // If activation is successful, reload data to reflect premium access
    if (isActive) {
      const rows = await getQuestions();
      if (rows && rows.length > 0) {
        const savedUser = await AsyncStorage.getItem("userInfo");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          const dept = parsedUser.department;
          //const filtered = rows.filter((q) => q.department === dept);
          const ids = [...new Set(rows.map((q) => q.questionId))];
          setQuestionIds(ids);
        }
      }
    }
  };

  const getPerformanceStyle = (performance) => {
    if (!performance) return { color: '#495057', icon: null };
    const lower = performance.toLowerCase();
    if (lower.includes('excellent')) return { color: '#28a745', icon: '✅' };
    if (lower.includes('good') || lower.includes('average')) return { color: '#007bff', icon: '✅' };
    if (lower.includes('failed') || lower.includes('need improvement')) return { color: '#dc3545', icon: '❌' };
    return { color: '#495057', icon: '✅' };
  };

  // Function to display activation status
  const renderActivationStatus = () => {
    if (!isActivated) {
      return (
        <Text style={styles.activationStatusText}>
          Status: <Text style={styles.activationInactive}>Not Activated</Text>
        </Text>
      );
    }
    
    return (
      <Text style={styles.activationStatusText}>
        Status: <Text style={styles.activationActive}>Activated</Text>
      </Text>
    );
  };

  // 🧩 Custom render item to insert ads after every 7 items
  const renderItem = ({ item, index }) => {
    const result = paperResults[item];
    const performanceStyle = result ? getPerformanceStyle(result.performance) : { color: '#495057', icon: null };
    
    // Add "JAMB " prefix to the display text
    const displayText = `JAMB ${item}`;

    return (
      <View>
        <TouchableOpacity
          style={styles.paperItem}
          onPress={() => handleSelectQuestionId(item, index)}
          disabled={dbError}
        >
          <View style={styles.paperContent}>
            <View style={styles.paperMainInfo}>
              <Text style={styles.paperText} numberOfLines={2}>{displayText}</Text>
              {!isActivated && index > 0 && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="lock-closed" size={14} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>

            {!studyMode && result && (
              <View style={styles.resultContainer}>
                <Text style={[styles.resultText, { color: performanceStyle.color }]}>
                  Last attempt: {result.percentage}% {result.performance} {result.correct} of {result.totalQuestions} {performanceStyle.icon}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* 🧩 Show banner ad after every 7 items if not activated */}
        {!isActivated && (index + 1) % 7 === 0 && (
          <View style={styles.middleAdContainer}>
            <AdBanner />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* Activation Status Display */}
      <View style={styles.activationStatusContainer}>
        {renderActivationStatus()}
      </View>

      {/* Check Activation Button - Only show if not activated */}
      {!isActivated && (
        <TouchableOpacity 
          style={[
            styles.checkActivationButton,
            checkingSubscription && styles.checkActivationButtonDisabled
          ]} 
          onPress={handleCheckActivation}
          disabled={checkingSubscription}
        >
          <Ionicons 
            name={checkingSubscription ? "refresh" : "key"} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.checkActivationButtonText}>
            {checkingSubscription ? "Checking..." : "Check Activation Status"}
          </Text>
        </TouchableOpacity>
      )}

      {studyMode && (
        <View style={styles.studyModeBanner}>
          <Ionicons name="book" size={16} color="#007bff" />
          <Text style={styles.studyModeText}>Study Mode - Results Hidden</Text>
        </View>
      )}

      {questionIds.length === 0 ? (
        <Text style={styles.noDataText}>
          {userDepartment
            ? `No questions available for ${userDepartment}.`
            : "Loading Question..."}
        </Text>
      ) : (
        <FlatList
          data={questionIds}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item}_${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 🧩 Bottom Banner Ad - Only show if not activated */}
      {!isActivated && (
        <View style={styles.bottomAdContainer}>
          <AdBanner />
        </View>
      )}

      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="lock-closed" size={48} color="#FFD700" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Premium Content</Text>
            <Text style={styles.modalMessage}>
              {isActivated 
                ? "This content requires activation. Please check your activation status."
                : "This question set requires activation. Activate your account to access all premium content."}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.activateButton} onPress={handleActivate}>
                <Ionicons name="key" size={16} color="#FFF" />
                <Text style={styles.activateButtonText}>
                  {isActivated ? "Check Status" : "Activate Now"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f9fa" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, textAlign: "center", color: "#2c3e50" },
  
  // Activation Status Styles
  activationStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  activationStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  activationActive: {
    color: '#28a745',
  },
  activationInactive: {
    color: '#dc3545',
  },
  
  // Check Activation Button Styles
  checkActivationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  checkActivationButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  checkActivationButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  
  studyModeBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 123, 255, 0.1)', 
    padding: 10, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#007bff', 
    marginBottom: 15, 
    justifyContent: 'center' 
  },
  studyModeText: { color: '#007bff', fontWeight: '600', marginLeft: 6, fontSize: 14 },
  listContainer: { paddingBottom: 20 },
  paperItem: { backgroundColor: "#fff", padding: 16, marginBottom: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e9ecef", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  paperContent: { flexDirection: 'column' },
  paperMainInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  paperText: { fontSize: 16, fontWeight: "600", color: "#2c3e50", flex: 1, marginRight: 10 },
  resultContainer: { backgroundColor: '#f8f9fa', padding: 8, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#007bff' },
  resultText: { fontSize: 12, fontWeight: '500' },
  premiumBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 215, 0, 0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#FFD700", minWidth: 80, justifyContent: 'center' },
  premiumText: { fontSize: 12, fontWeight: "bold", color: "#FFD700", marginLeft: 4 },
  noDataText: { textAlign: "center", color: "#6c757d", fontSize: 16, marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalIcon: { marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 },
  cancelButton: { flex: 1, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e9ecef' },
  cancelButtonText: { color: '#6c757d', fontWeight: '600' },
  activateButton: { flex: 1, padding: 16, backgroundColor: '#17a2b8', borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  activateButtonText: { color: '#fff', fontWeight: 'bold' },
  // 🧩 Ad styles
  middleAdContainer: { 
    marginVertical: 10, 
    marginBottom: 12,
  },
});