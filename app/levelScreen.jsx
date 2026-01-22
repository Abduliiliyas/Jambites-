import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { getLevels, generateLevels, clearQuestions } from "../database";
import { getResults } from "../simple_database";
import { Ionicons } from '@expo/vector-icons';
import AdBanner from "../components/AdBanner"; // Import AdBanner

export default function LevelScreen() {
  const [levels, setLevels] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [levelResults, setLevelResults] = useState({});
  const router = useRouter();

  const loadLevelResults = async () => {
    try {
      const results = await getResults();
      console.log("All results from DB:", results);
      
      const resultsByLevel = {};
      
      results.forEach(result => {
        console.log("Processing result:", result);
        
        if (result.questionId) {
          // Extract level number from questionId using regex
          const levelMatch = result.questionId.match(/(?:level\s*)?(\d+)/i);
          
          if (levelMatch) {
            const levelNumber = levelMatch[1]; // This will be "1", "2", etc.
            console.log(`Found level number: ${levelNumber} in questionId: ${result.questionId}`);
            
            if (!resultsByLevel[levelNumber]) {
              resultsByLevel[levelNumber] = result;
            }
          }
        }
      });
      
      console.log("Results by level:", resultsByLevel);
      setLevelResults(resultsByLevel);
    } catch (error) {
      console.error("Error loading level results:", error);
    }
  };

  const getPerformanceStyle = (performance) => {
    if (!performance) return { color: '#495057', icon: '✅' };
    const lower = performance.toLowerCase();
    
    if (lower.includes('failed') || lower.includes('fail') || lower.includes('need improvement')) {
      return { color: '#dc3545', icon: '❌' }; // Red for failed
    } else if (lower.includes('excellent') || lower.includes('excel')) {
      return { color: '#28a745', icon: '✅' }; // Green for excellent
    } else {
      return { color: '#007bff', icon: '✅' }; // Blue for everything else (good, average, etc.)
    }
  };

  const loadData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("userInfo");
      if (!savedUser) return;

      const parsedUser = JSON.parse(savedUser);
      const dept = parsedUser.department;
      setUserDepartment(dept);

      // Get user ID and activation status
      const savedUserId = await AsyncStorage.getItem("userId");
      const activationStatus = await AsyncStorage.getItem("isActivated");
      console.log(activationStatus);
      setUserId(savedUserId);
      setIsActivated(activationStatus === "true");

      // Fetch levels
      const result = await getLevels();
      console.log("Loaded levels:", result);
      setLevels(result);

      // Load level results after levels are set
      await loadLevelResults();
    } catch (err) {
      console.error("Error loading levels:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectLevel = async (levelRow, index) => {
    // If first level or activated, allow navigation
    if (index === 0 || isActivated) {
      try {
        const qids = JSON.parse(levelRow.qids);
        await AsyncStorage.setItem("selectedQuestionId", JSON.stringify(qids));
        console.log(levelRow);
        const level = JSON.parse(levelRow.level);
        await AsyncStorage.setItem("levelName", JSON.stringify(level));
        router.push("/instructionScreen");
      } catch (err) {
        console.error("Error saving level:", err);
      }
    } else {
      // Show premium modal for non-activated premium content
      setShowPremiumModal(true);
    }
  };

  const handleActivate = () => {
    if (userId) {
      router.push("subscription");
    } else {
      Linking.openURL('https://healthprof.com.ng/subscribe')
        .catch(err => console.error("Failed to open URL:", err));
    }
    setShowPremiumModal(false);
  };

  const handleCancel = () => {
    setShowPremiumModal(false);
  };

  // Function to render ad banner after every 5 items
  const renderItem = ({ item, index }) => {
    const levelName = JSON.parse(item.level); // This is "1", "2", etc.
    const result = levelResults[levelName]; // Now match by level number
    const performanceStyle = result ? getPerformanceStyle(result.performance) : { color: '#495057', icon: '✅' };

    console.log(`Rendering level: ${levelName}, has result:`, result);

    return (
      <View>
        <TouchableOpacity
          style={styles.levelItem}
          onPress={() => handleSelectLevel(item, index)}
        >
          <View style={styles.levelContent}>
            <View style={styles.levelMainInfo}>
              <Text style={styles.levelText}>
                Level {item.level}
              </Text>
              {index > 0 && !isActivated && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="lock-closed" size={14} color="#FFD700" />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>

            {result && (
              <View style={styles.resultContainer}>
                <Text style={[styles.resultText, { color: performanceStyle.color }]}>
                  Last attempt: {result.percentage}% {result.performance}, {result.correct} of {result.totalQuestions} {performanceStyle.icon}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Add AdBanner after every 5th item, but not after the last item AND only if not activated */}
        {!isActivated && (index + 1) % 5 === 0 && index !== levels.length - 1 && (
          <View style={styles.adContainer}>
            <AdBanner />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Available Levels {userDepartment ? `(${userDepartment})` : ""}
      </Text>

      {/* Debug Row */}
      {__DEV__ && (
        <View style={styles.compactRow}>
          <TouchableOpacity style={styles.smallTestButton} onPress={loadData}>
            <Text style={styles.smallTestButtonText}>Reload</Text>
          </TouchableOpacity>
          
          {isActivated && (
            <View style={styles.compactActivationBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#4CD964" />
              <Text style={styles.compactActivationText}>Premium</Text>
            </View>
          )}
        </View>
      )}

      {levels.length === 0 ? (
        <Text style={styles.noDataText}>
          {userDepartment
            ? `No levels found for ${userDepartment}.`
            : "Loading department..."}
        </Text>
      ) : (
        <FlatList
          data={levels}
          renderItem={renderItem}
          keyExtractor={(item) => `level_${item.id}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Premium Modal */}
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
              This level requires a premium subscription. Subscribe now to access all premium content.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.activateButton} onPress={handleActivate}>
                <Ionicons name="rocket" size={16} color="#FFF" />
                <Text style={styles.activateButtonText}>Activate Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 8,
  },
  smallTestButton: {
    backgroundColor: '#ff0909ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  smallTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  compactActivationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4CD964',
  },
  compactActivationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CD964',
    marginLeft: 6,
  },
  deleteButton: {
    padding: 12,
    marginBottom: 15,
    backgroundColor: "red",
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 20,
  },
  // Updated level item styles
  levelItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  levelContent: {
    flexDirection: 'column',
  },
  levelMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
    marginRight: 10,
  },
  resultContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff'
  },
  resultText: {
    fontSize: 12,
    fontWeight: '500'
  },
  // Fixed premium badge positioning
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FFD700",
    minWidth: 80, // Fixed width to prevent movement
    justifyContent: 'center',
  },
  premiumText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFD700",
    marginLeft: 4,
  },
  noDataText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
    marginVertical: 20,
  },
  // Ad Banner container
  adContainer: {
    marginVertical: 8,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  activateButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#007bff',
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  activateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});