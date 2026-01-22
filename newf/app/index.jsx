import React, { useEffect, useState, useLayoutEffect, useCallback,useRef } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
  Linking,
  Dimensions,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import HomeBox from "../components/HomeBox";
import { getQuestions, getDatabase, clearQuestions, saveQuestions, checkDatabaseStatus } from "../database";
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const API_BASE_URL = "https://healthprof.com.ng";
const CURRENT_APP_VERSION = "1.0.0";
const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
const backPressRef = useRef(0);

  const [showExitToast, setShowExitToast] = useState(false);

  const [showOverlay, setShowOverlay] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for success modal
  const [successMessage, setSuccessMessage] = useState(""); // Success message state
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false); // New state for question loading
  const [questionsLoaded, setQuestionsLoaded] = useState(0); // Track loaded questions count
  const [totalQuestions, setTotalQuestions] = useState(0); // Track total questions
  const [copied, setCopied] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [appLink, setappLink] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isConnected, setIsConnected] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
      swipeEnabled: false,
    });
  }, [navigation]);

  // ✅ ONLY HOME SCREEN BACK BUTTON EXIT LOGIC (SAFE & CLEAN)
 
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (backPressRef.current === 0) {
          backPressRef.current = 1;
          setShowExitToast(true);

          // Reset the counter after 2 seconds
          const timer = setTimeout(() => {
            backPressRef.current = 0;
            setShowExitToast(false);
          }, 2000);

          return true; // Stop the app from exiting on the first press
        } else {
          // If backPressRef.current is 1, this is the second press
          BackHandler.exitApp();
          return true;
        }
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        subscription.remove();
        // Clean up: reset values when navigating away from Home
        backPressRef.current = 0;
        setShowExitToast(false);
      };
    }, []) // Dependency array is empty because we use backPressRef
  );
  useEffect(() => {
    const checkUser = async () => {
      const savedUser = await AsyncStorage.getItem("userInfo");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setShowOverlay(true);
      }
    };

    checkUser();
    initializeDatabase();
    checkAppUpdate();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const initializeDatabase = async () => {
    try {
      await getDatabase();
      await checkDatabaseStatus();
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  };

  const loadApiKey = async () => {
    try {
      const savedApiKey = await AsyncStorage.getItem("deepSeekApiKey");
      if (savedApiKey) {
        setDeepSeekApiKey(savedApiKey);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const checkAppUpdate = async () => {
    try {
      if (!isConnected) return;
      // Check if we've already shown update modal today
      const lastUpdateCheck = await AsyncStorage.getItem('lastUpdateCheck');
      const currentTime = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000; // 24 hours
      
      if (lastUpdateCheck && (currentTime - parseInt(lastUpdateCheck)) < oneDay) {
        return; // Already checked today
      }
      const response = await fetch(`${API_BASE_URL}/japp-version/`);
      if (response.ok) {
        const data = await response.json();
        const serverVersion = data.version;
        const requiresUpdate = data.requires_update;
        const app_link = data.app_link;
        const message = data.message || "A new version is available with exciting features and improvements!";
        await AsyncStorage.setItem('app_link', app_link);
        setLatestVersion(serverVersion);
        setUpdateMessage(message);
        setappLink(app_link)
        
        // Compare versions (simple string comparison for demo)
        if (requiresUpdate || serverVersion !== CURRENT_APP_VERSION) {
          setShowUpdateModal(true);
        }
        // Store last check time
        await AsyncStorage.setItem('lastUpdateCheck', currentTime.toString());
        await AsyncStorage.setItem('appVersion', CURRENT_APP_VERSION);
      }
    } catch (error) {
      console.error('Error checking app update:', error);
    }
  };

  const handleUpdateNow = () => {
    // Replace with your actual Play Store link
    const playStoreLink = appLink;
    Linking.openURL(playStoreLink).catch(err => {
      Alert.alert("Error", "Could not open Play Store");
    });
  };

  const handleRemindLater = async () => {
    setShowUpdateModal(false);
    // Set reminder for 1 day later
    const reminderTime = new Date().getTime();
    await AsyncStorage.setItem('lastUpdateCheck', reminderTime.toString());
  };

  // Function to copy user ID to clipboard
  const copyUserIdToClipboard = async () => {
    if (user?.userId) {
      try {
        if (typeof Clipboard !== 'undefined' && Clipboard.setString) {
          Clipboard.setString(user.userId.toString());
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(user.userId.toString());
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = user.userId.toString();
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
        
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Failed to copy automatically. Please manually copy:\n\nUser ID: ${user.userId}`);
        } else {
          Alert.alert("Copy Manually", `User ID: ${user.userId}\n\nPlease manually copy this ID.`);
        }
      }
    }
  };

  const createUserOnBackend = async (userName) => {
    try {
      setLoading(true);
      
      const requestBody = {
        name: userName,
      };
      
      const response = await fetch(`${API_BASE_URL}/api/jcreate-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('CORS')) {
        throw new Error("CORS/Network error. Please check backend configuration.");
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionsForDepartment = async () => {
    try {
      setLoadingQuestions(true);
      setQuestionsLoaded(0);
      setTotalQuestions(0);
      
      const response = await fetch(`${API_BASE_URL}/api/jquestions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const questions = await response.json();
      const questionCount = questions.questions?.length || 0;
      setTotalQuestions(questionCount);
      return questions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      throw error;
    }
  };

  const saveQuestionsToDatabase = async (questions) => {
    try {
      await clearQuestions();
      
      // Create a progress callback to update the UI
      const onProgress = (progress) => {
        setQuestionsLoaded(progress.loaded || 0);
      };
      
      const result = await saveQuestions(questions, onProgress);
      
      if (result.success) {
        return result;
      } else {
        throw new Error("Failed to save questions");
      }
    } catch (error) {
      console.error("Error saving questions to database:", error);
      throw error;
    } finally {
      setLoadingQuestions(false);
    }
  };

  const showSuccessAlert = (title, message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage("");
  };

  const saveUserInfo = async () => {
    if (!name) {
      if (typeof window !== 'undefined' && window.alert) {
        window.alert("Please enter your name");
      } else {
        Alert.alert("Please enter your name");
      }
      return;
    }

    try {
      setLoading(true);

      const userData = await createUserOnBackend(name);
      const localUserData = { 
        name, 
        userId: userData.userId,
      };
      
      // Save to local storage first
      await AsyncStorage.setItem("userInfo", JSON.stringify(localUserData));
      await AsyncStorage.setItem("userId", userData.userId.toString());
      await AsyncStorage.setItem("isActivated", userData.isActivated?.toString() || 'false');
      await AsyncStorage.setItem("subEndingDate",'false');
      await AsyncStorage.setItem("userName", name || '');
      
      // Set user state immediately
      setUser(localUserData);
      
      // Immediately switch to loading questions view
      setLoading(false);
      setLoadingQuestions(true);
      
      // Try to fetch questions but don't block success if it fails
      try {
        const questions = await fetchQuestionsForDepartment();
        const saveResult = await saveQuestionsToDatabase(questions);
        
        // Close the overlay BEFORE showing success
        setShowOverlay(false);
        
        // Small delay to ensure modal is closed
        setTimeout(() => {
          // Show success message with questions count
          if (saveResult.saved > 0) {
            showSuccessAlert(
              "Success!",
              `Account created successfully! ${saveResult.saved} questions loaded. You're ready to start practicing!`
            );
          } else {
            showSuccessAlert(
              "Success!",
              "Account created successfully! However, no questions were loaded. You can try loading questions later."
            );
          }
        }, 300);
        
      } catch (questionError) {
        console.warn("Questions not loaded, but account created:", questionError);
        // Close the overlay BEFORE showing success
        setShowOverlay(false);
        
        // Small delay to ensure modal is closed
        setTimeout(() => {
          showSuccessAlert(
            "Account Created",
            "Your account was created successfully! However, there was an issue loading questions. You can try loading questions later from the app settings."
          );
        }, 300);
      }
      
    } catch (error) {
      console.error("Error saving user info:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = "Failed to create account. Please try again.";
      
      // More specific error handling
      if (error.message.includes('CORS') || error.message.includes('Network request failed')) {
        errorMessage = "Network connection issue. Please check your internet and try again.";
      } else if (error.message.includes('403')) {
        errorMessage = "Access denied. Please contact support.";
      } else if (error.message.includes('timeout')) {
        errorMessage = "Request timeout. Please try again.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      }
      
      // Check if user was actually created despite the error
      try {
        const savedUser = await AsyncStorage.getItem("userInfo");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.userId) {
            errorMessage = "Account created but there was an issue loading questions. You can try loading questions later.";
            setUser(parsedUser);
            setShowOverlay(false);
            
            setTimeout(() => {
              showSuccessAlert("Account Created", errorMessage);
            }, 300);
            
            setLoading(false);
            setLoadingQuestions(false);
            return;
          }
        }
      } catch (storageError) {
        console.error("Error checking storage:", storageError);
      }
      
      setLoading(false);
      setLoadingQuestions(false);
      
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert("Error", errorMessage);
      }
    }
  };

  const showClearConfirmation = () => {
    setShowConfirmation(true);
  };

  const cancelClear = () => {
    setShowConfirmation(false);
  };

  const clearUserInfo = async () => {
    try {
      await clearQuestions();
      
      await AsyncStorage.removeItem("userInfo");
      await AsyncStorage.removeItem("userId");
      await AsyncStorage.removeItem("isActivated");
      setUser(null);
      setShowOverlay(true);
      setShowConfirmation(false);
      
      showSuccessAlert("Success", "User information cleared successfully.");
    } catch (error) {
      console.error("Error clearing user info:", error);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert("Error: Failed to clear user information. Please try again.");
      } else {
        Alert.alert("Error", "Failed to clear user information. Please try again.");
      }
    }
  };

  const handleHealthGPTPress = () => {
    router.push("/HealthGPTScreen");
  };

  return (
    <View style={{ flex: 1, marginBottom: 35, }}>
      {/* Exit Toast - appears at the top */}
      {showExitToast && (
        <View style={styles.exitToast}>
          <Ionicons name="information-circle" size={18} color="#fff" />
          <Text style={styles.exitToastText}>Press back again to exit</Text>
        </View>
      )}

      {/* Welcome header */}
      {user && (
        <View style={styles.header}>
          <Text style={styles.head}>JAMBITES</Text>
          
          {/* User name and Live Chat icon in the same row */}
          <View style={styles.userRow}>
            <Text style={styles.welcome}>Welcome, {user.name}</Text>
          </View>
          
          {/* User ID and Clear Info in the same row */}
          <View style={styles.userInfoRow}>
            <View style={styles.userIdContainer}>
              <Text style={styles.userId}>User ID: {user.userId}</Text>
              <Pressable onPress={copyUserIdToClipboard} style={styles.clipboardButton}>
                {copied ? (
                  <Ionicons name="checkmark" size={16} color="#28a745" />
                ) : (
                  <Ionicons name="copy-outline" size={16} color="#666" />
                )}
              </Pressable>
            </View>
            
            <Pressable style={styles.clearBtn} onPress={showClearConfirmation}>
              <Text style={styles.clearText}>Clear Info</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#fff",marginBottom: 35 }}>
        <HomeBox
          title="Jamb CBT Practice"
          description="Great tool to practice from the previous past questions, To have insight about how to approach your upcoming jamb CBT exam"
          image={require("../assets/images/practice.jpg")}
          color="rgba(92, 184, 92, 0.5)"
          onPress={() => router.push("/CBT")}
        />

        <HomeBox
          title="Study Jamb Past questions"
          description="Study past questions and answers see Explanation of all pass questions for future research, get AI Assistance on each question"
          image={require("../assets/images/obj.png")}
          color="rgba(92, 184, 92, 0.5)"
          onPress={() => {
            AsyncStorage.setItem('study', 'true');
            AsyncStorage.setItem('examType', '');
            router.push("/CBTScreen");
          }}
        />

        <HomeBox
          title="Jamb Quiz Practice"
          description="Get free daily quiz with jamb pass questions to engage in a daily practice"
          image={require("../assets/images/essay.jpeg")}
          color="rgba(92, 184, 92, 0.5)"
          onPress={() => router.push("/startQuiz")}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <Pressable style={styles.navItem} onPress={() => router.push("/")}>
          <Ionicons name="home" size={18} color="rgba(92, 184, 92, 0.5)" />
          <Text style={styles.navText}>Home</Text>
        </Pressable>
        
        <Pressable style={styles.navItem} onPress={() => router.push("/syllabus")}>
          <Ionicons name="document-text" size={18} color="#666" />
          <Text style={styles.navText}>Syllabus</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/lessons")}>
          <Ionicons name="newspaper" size={18} color="#666" />
          <Text style={styles.navText}>Lessons</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications" size={18} color="#666" />
          <Text style={styles.navText}>News</Text>
        </Pressable>
      </View>

      {/* User Registration Modal - Improved Design */}
      <Modal visible={showOverlay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Welcome to Jambites!</Text>
              
              {/* Loading indicator for creating account */}
              {loading && !loadingQuestions && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Creating account...</Text>
                </View>
              )}
              
              {/* Loading indicator for loading questions */}
              {loadingQuestions && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#28a745" />
                  <Text style={styles.loadingText}>Loading questions...</Text>
                  {totalQuestions > 0 ? (
                    <>
                      <Text style={styles.progressText}>
                        {questionsLoaded} of {totalQuestions} questions loaded
                      </Text>
                      {questionsLoaded > 0 && questionsLoaded < totalQuestions && (
                        <Text style={styles.progressPercentage}>
                          {Math.round((questionsLoaded / totalQuestions) * 100)}% complete
                        </Text>
                      )}
                      {questionsLoaded >= totalQuestions && totalQuestions > 0 && (
                        <Text style={styles.completionText}>
                          ✓ All questions loaded successfully!
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.progressText}>
                      Fetching questions data...
                    </Text>
                  )}
                </View>
              )}
              
              {/* Only show input and button when not loading */}
              {!loading && !loadingQuestions && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your full name"
                      value={name}
                      onChangeText={setName}
                      editable={!loading}
                    />
                  </View>

                  <Pressable 
                    style={[styles.saveBtn, loading && styles.disabledButton]} 
                    onPress={saveUserInfo}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveText}>Save & Create Account</Text>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={50} color="#28a745" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
            <Pressable style={styles.successButton} onPress={closeSuccessModal}>
              <Text style={styles.successButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Update Available Modal */}
      <Modal visible={showUpdateModal} transparent animationType="slide">
        <View style={styles.updateOverlay}>
          <View style={styles.updateModal}>
            <View style={styles.updateHeader}>
              <Ionicons name="cloud-download" size={40} color="#007AFF" />
              <Text style={styles.updateTitle}>Update Available</Text>
              <Text style={styles.updateSubtitle}>Version {latestVersion}</Text>
            </View>

            <View style={styles.updateContent}>
              <Text style={styles.updateMessage}>{updateMessage}</Text>
              
              <View style={styles.versionInfo}>
                <Text style={styles.versionCurrent}>Current: v{CURRENT_APP_VERSION}</Text>
                <Text style={styles.versionLatest}>Latest: v{latestVersion}</Text>
              </View>
            </View>

            <View style={styles.updateButtons}>
              <Pressable 
                style={[styles.updateButton, styles.remindUpdateButton]}
                onPress={handleRemindLater}
              >
                <Text style={styles.remindUpdateText}>Remind Later</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.updateButton, styles.updateNowButton]}
                onPress={handleUpdateNow}
              >
                <Ionicons name="logo-google-playstore" size={20} color="#fff" />
                <Text style={styles.updateNowText}>Update Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmationTitle}>Clear User Information</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to clear your user information? This will log you out and remove all your data.
            </Text>
            <View style={styles.confirmationButtons}>
              <Pressable style={[styles.confirmationButton, styles.cancelButton]} onPress={cancelClear}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.confirmationButton, styles.clearButton]} onPress={clearUserInfo}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Exit Toast Styles
  exitToast: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(220,53,69,0.95)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  exitToastText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "600",
  },
  header: {
    padding: 14,
    backgroundColor: 'rgb(255, 238, 204)',
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  head: {
    marginTop: 25,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: 'center',
  },
  // New user row style for name and live chat
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcome: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  liveChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveChatText: {
    fontSize: 12,
    color: "#000",
    fontWeight: "600",
    marginLeft: 4,
  },
  schoolDeptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userId: {
    fontSize: 12,
    color: "#999",
    fontStyle: 'italic',
    marginRight: 6,
  },
  clipboardButton: {
    padding: 4,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#dc3545",
    borderRadius: 5,
  },
  clearText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  
  // Improved Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    height: "50%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    padding: 24,
    justifyContent: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  institutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hintButton: {
    padding: 4,
  },

  deptButton: {
    padding: 10,
    marginBottom: 6,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    minWidth: '100%',
  },
  deptButtonSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  deptButtonText: {
    color: "#495057",
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  deptButtonTextSelected: {
    color: "#fff",
  },
  saveBtn: {
    padding: 14,
    backgroundColor: "#28a745",
    borderRadius: 8,
    alignItems: "center",
    minWidth: '100%',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    marginBottom:50
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  loadingText: {
    marginTop: 8,
    color: '#2c3e50',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressText: {
    marginTop: 8,
    color: '#28a745',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressPercentage: {
    marginTop: 4,
    color: '#6c757d',
    fontSize: 12,
    fontStyle: 'italic',
  },
  completionText: {
    marginTop: 8,
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomNavigation: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginBottom: 15
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  
  // Success Modal Styles
  successModal: {
    width: "85%",
    maxWidth: 350,
    padding: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    color: '#28a745',
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  
  // Update Modal Styles
  updateOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    marginBottom:25
  },
  updateModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: "40%",
  },
  updateHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  updateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 12,
  },
  updateSubtitle: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 4,
  },
  updateContent: {
    marginBottom: 24,
  },
  updateMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  versionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  versionCurrent: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  versionLatest: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
  },
  updateButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  updateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  remindUpdateButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  updateNowButton: {
    backgroundColor: "#007AFF",
  },
  remindUpdateText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 16,
  },
  updateNowText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // Existing styles for other modals
  hintModal: {
    width: "85%",
    maxWidth: 350,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#2c3e50',
  },
  hintText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  hintCloseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  hintCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmationModal: {
    width: "85%",
    maxWidth: 350,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: 'center',
    color: '#2c3e50',
  },
  confirmationMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  confirmationButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});