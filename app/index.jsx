import React, { useEffect, useState, useLayoutEffect, useCallback, useRef } from "react";
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
  Platform
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [latestVersion, setLatestVersion] = useState("");
  const [appLink, setappLink] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [isConnected, setIsConnected] = useState(true);

  // Web-specific clipboard function
  const copyToClipboardWeb = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Web clipboard error:', error);
      return false;
    }
  };

  // Check if platform is web
  const isWeb = Platform.OS === 'web';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
      swipeEnabled: false,
    });
  }, [navigation]);

  // ✅ ONLY HOME SCREEN BACK BUTTON EXIT LOGIC (SAFE & CLEAN)
  // Only use BackHandler on mobile platforms
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        // On web, we don't use BackHandler
        return;
      }

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
    }, [])
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

    // Network connectivity - different implementation for web
    if (Platform.OS === 'web') {
      // Web implementation
      const updateOnlineStatus = () => {
        setIsConnected(navigator.onLine);
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      // Initial check
      updateOnlineStatus();

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    } else {
      // Mobile implementation
      const unsubscribe = NetInfo.addEventListener(state => {
        setIsConnected(state.isConnected);
      });

      return () => unsubscribe();
    }
  }, []);

  const initializeDatabase = async () => {
    try {
      await getDatabase();
      await checkDatabaseStatus();
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  };

  const checkAppUpdate = async () => {
    try {
      if (!isConnected) return;
      
      // On web, we might not need to check for app updates in the same way
      // You could modify this to check for web app updates if needed
      if (Platform.OS === 'web') {
        // For web, you might check for service worker updates or manifest updates
        // For now, we'll skip the native app update check on web
        return;
      }
      
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
    if (Platform.OS === 'web') {
      // On web, we might want to show a different message or reload the page
      // For PWA updates, you could use service worker updates
      Alert.alert(
        "Web App Update",
        "To update this web app, please refresh your browser or clear cache.",
        [
          { text: "Refresh Now", onPress: () => window.location.reload() },
          { text: "Later" }
        ]
      );
      return;
    }
    
    // Mobile: Open app store link
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
        let success = false;
        
        if (Platform.OS === 'web') {
          // Web implementation
          success = await copyToClipboardWeb(user.userId.toString());
        } else {
          // Mobile implementation
          if (Clipboard && Clipboard.setString) {
            Clipboard.setString(user.userId.toString());
            success = true;
          }
        }
        
        if (success) {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        } else {
          // Fallback for all platforms
          if (Platform.OS === 'web') {
            // Show text in a prompt for web
            prompt("Copy User ID", user.userId.toString());
          } else {
            Alert.alert("Copy Manually", `User ID: ${user.userId}\n\nPlease manually copy this ID.`);
          }
        }
        
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        
        if (Platform.OS === 'web') {
          // Show text in a prompt for web
          prompt("Copy User ID", user.userId.toString());
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
        throw new Error("Network error. Please check your internet connection.");
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
      if (Platform.OS === 'web') {
        alert("Please enter your name");
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
      
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
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
      if (Platform.OS === 'web') {
        alert("Error: Failed to clear user information. Please try again.");
      } else {
        Alert.alert("Error", "Failed to clear user information. Please try again.");
      }
    }
  };

  // Web-specific styles for better web experience
  const webStyles = Platform.OS === 'web' ? {
    container: {
      maxWidth: 1200,
      marginHorizontal: 'auto',
      width: '100%',
    },
    modalContainer: {
      maxWidth: 500,
      marginHorizontal: 'auto',
    }
  } : {};

  return (
    <View style={[styles.container, webStyles.container]}>
      {/* Exit Toast - appears at the top (only on mobile) */}
      {showExitToast && Platform.OS !== 'web' && (
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

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
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
        </View>
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

      {/* User Registration Modal */}
      <Modal visible={showOverlay} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, webStyles.modalContainer]}>
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
          <View style={[styles.successModal, webStyles.modalContainer]}>
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
          <View style={[styles.updateModal, webStyles.modalContainer]}>
            <View style={styles.updateHeader}>
              <Ionicons name="cloud-download" size={40} color="#007AFF" />
              <Text style={styles.updateTitle}>
                {Platform.OS === 'web' ? 'Web App Update Available' : 'Update Available'}
              </Text>
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
                <Text style={styles.remindUpdateText}>
                  {Platform.OS === 'web' ? 'Not Now' : 'Remind Later'}
                </Text>
              </Pressable>
              
              <Pressable 
                style={[styles.updateButton, styles.updateNowButton]}
                onPress={handleUpdateNow}
              >
                {Platform.OS === 'web' ? (
                  <Ionicons name="refresh" size={20} color="#fff" />
                ) : (
                  <Ionicons name="logo-google-playstore" size={20} color="#fff" />
                )}
                <Text style={styles.updateNowText}>
                  {Platform.OS === 'web' ? 'Update Now' : 'Update Now'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmationModal, webStyles.modalContainer]}>
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
  container: {
    flex: 1,
    marginBottom: 35,
  },
  // Web-specific container styles
  webContainer: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 35,
  },
  contentContainer: {
    padding: 16,
  },
  // Exit Toast Styles (only for mobile)
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