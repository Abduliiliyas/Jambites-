import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ToastAndroid,
  Platform,
  BackHandler 
} from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import AdBanner from "../components/AdBanner"; // Import AdBanner
import InterstitialAdComponent from "../components/InterstitialAd"; // Import InterstitialAd

// Check if we're running on web
const isWeb = Platform.OS === 'web';

// Web-compatible storage manager
class StorageManager {
  constructor() {
    this.quizzesKey = 'healthprof_quizzes';
    this.quizQuestionsKey = 'healthprof_quiz_questions';
  }

  // Save quizzes to AsyncStorage (works on both web and native)
  async saveQuizzes(quizzes) {
    try {
      console.log("💾 Saving quizzes to storage:", quizzes.length);
      await AsyncStorage.setItem(this.quizzesKey, JSON.stringify(quizzes));
      console.log("✅ Quizzes saved to storage");
    } catch (error) {
      console.error("❌ Error saving quizzes to storage:", error);
      throw error;
    }
  }

  // Load quizzes from AsyncStorage
  async loadQuizzes() {
    try {
      console.log("📥 Loading quizzes from storage");
      const quizzesJson = await AsyncStorage.getItem(this.quizzesKey);
      const quizzes = quizzesJson ? JSON.parse(quizzesJson) : [];
      console.log("✅ Loaded quizzes from storage:", quizzes.length);
      return quizzes;
    } catch (error) {
      console.error("❌ Error loading quizzes from storage:", error);
      return [];
    }
  }

  // Save quiz questions
  async saveQuizQuestions(quizId, questions) {
    try {
      const key = `${this.quizQuestionsKey}_${quizId}`;
      await AsyncStorage.setItem(key, JSON.stringify(questions));
      console.log(`✅ Saved ${questions.length} questions for quiz ${quizId}`);
    } catch (error) {
      console.error("❌ Error saving quiz questions:", error);
      throw error;
    }
  }

  // Load quiz questions
  async loadQuizQuestions(quizId) {
    try {
      const key = `${this.quizQuestionsKey}_${quizId}`;
      const questionsJson = await AsyncStorage.getItem(key);
      return questionsJson ? JSON.parse(questionsJson) : [];
    } catch (error) {
      console.error("❌ Error loading quiz questions:", error);
      return [];
    }
  }

  // Clear all data
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const quizKeys = keys.filter(key => 
        key.startsWith(this.quizzesKey) || 
        key.startsWith(this.quizQuestionsKey)
      );
      await AsyncStorage.multiRemove(quizKeys);
      console.log("✅ Cleared all quiz data");
    } catch (error) {
      console.error("❌ Error clearing data:", error);
      throw error;
    }
  }
}

// Native SQLite database manager (only for native platforms)
class NativeDatabaseManager {
  constructor() {
    this.db = null;
    this.isInitializing = false;
  }

  async getDatabase() {
    if (this.db) {
      return this.db;
    }

    if (this.isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getDatabase();
    }

    this.isInitializing = true;
    
    try {
      console.log("🔄 Opening native database...");
      
      this.db = await SQLite.openDatabaseAsync('healthprof.db');
      console.log("✅ Native database opened successfully");
      
      await this.initializeTables();
      
      return this.db;
    } catch (error) {
      console.error("❌ Error opening native database:", error);
      this.db = null;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async initializeTables() {
    try {
      console.log("🔄 Initializing native database tables...");
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          num_questions INTEGER DEFAULT 0,
          time_limit INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id INTEGER PRIMARY KEY NOT NULL,
          quiz_id INTEGER NOT NULL,
          question TEXT NOT NULL,
          option1 TEXT,
          option2 TEXT,
          option3 TEXT,
          option4 TEXT,
          correct_option TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE
        );
      `);

      console.log("✅ Native database tables ready");
    } catch (error) {
      console.error("❌ Error initializing native tables:", error);
      throw error;
    }
  }

  async saveQuizzes(quizzes) {
    const db = await this.getDatabase();
    await db.execAsync('BEGIN TRANSACTION;');
    
    try {
      await db.runAsync("DELETE FROM quizzes;");
      
      for (const quiz of quizzes) {
        if (!quiz.id || !quiz.title) continue;
        
        await db.runAsync(
          `INSERT OR REPLACE INTO quizzes (id, title, description, num_questions, time_limit)
           VALUES (?, ?, ?, ?, ?);`,
          [
            parseInt(quiz.id) || 0,
            quiz.title || 'Untitled Quiz',
            quiz.description || '',
            parseInt(quiz.num_questions) || 0,
            parseInt(quiz.time_limit) || 0
          ]
        );
      }
      
      await db.execAsync('COMMIT;');
      console.log("✅ Quizzes saved to native database");
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  async loadQuizzes() {
    try {
      const db = await this.getDatabase();
      const rows = await db.getAllAsync("SELECT * FROM quizzes ORDER BY id");
      console.log("✅ Loaded quizzes from native database:", rows.length);
      return rows;
    } catch (error) {
      console.error("❌ Error loading from native database:", error);
      return [];
    }
  }

  async saveQuizQuestions(quizId, questions) {
    try {
      const db = await this.getDatabase();
      await db.execAsync('BEGIN TRANSACTION;');
      
      await db.runAsync(`DELETE FROM quiz_questions WHERE quiz_id = ?;`, [quizId]);

      for (const q of questions) {
        await db.runAsync(
          `INSERT INTO quiz_questions
           (id, quiz_id, question, option1, option2, option3, option4, correct_option, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            parseInt(q.id),
            parseInt(quizId),
            q.text || q.question || '',
            q.option1 || '',
            q.option2 || '',
            q.option3 || '',
            q.option4 || '',
            q.correct_option || '',
            q.description || '',
          ]
        );
      }
      
      await db.execAsync('COMMIT;');
      console.log(`✅ Saved ${questions.length} questions to native database for quiz ${quizId}`);
    } catch (error) {
      await db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  async closeDatabase() {
    if (this.db) {
      try {
        await this.db.closeAsync();
        console.log("✅ Native database closed");
      } catch (error) {
        console.error("❌ Error closing native database:", error);
      } finally {
        this.db = null;
      }
    }
  }
}

// Create appropriate manager based on platform
const storageManager = isWeb ? new StorageManager() : new NativeDatabaseManager();
const webStorageManager = new StorageManager(); // Always available for web fallback

export default function StartQuiz({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizId, setLoadingQuizId] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [storageError, setStorageError] = useState(null);
  const [usingWebStorage, setUsingWebStorage] = useState(isWeb);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const router = useRouter();

  // Handle back button press
  const handleBackPress = useCallback(() => {
    // Navigate to index screen
    router.push("/");
    // Return true to prevent default back behavior
    return true;
  }, [router]);

  // Show interstitial ad when component mounts
  useEffect(() => {
    // Show interstitial ad after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      setShowInterstitial(true);
    }, 1500); // 1.5 second delay

    return () => clearTimeout(timer);
  }, []);

  // Set up back button handler
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Add event listener for back button on native platforms
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress
      );

      // Clean up the event listener
      return () => backHandler.remove();
    }
  }, [handleBackPress]);

  // Enhanced internet connection check
  const checkInternetConnection = async () => {
    try {
      if (isWeb) {
        // For web, use navigator.onLine as fallback
        const online = navigator.onLine;
        console.log("🌐 Web connection status:", online);
        setIsConnected(online);
        return online;
      } else {
        // For native, use NetInfo with better error handling
        const netInfoState = await NetInfo.fetch();
        console.log("🌐 Native connection state:", {
          isConnected: netInfoState.isConnected,
          isInternetReachable: netInfoState.isInternetReachable,
          type: netInfoState.type
        });
        
        // Consider connected if either isConnected or isInternetReachable is true
        const connected = netInfoState.isConnected || netInfoState.isInternetReachable;
        setIsConnected(connected);
        return connected;
      }
    } catch (error) {
      console.error("❌ Error checking connection:", error);
      // Default to true to allow operations to proceed
      setIsConnected(true);
      return true;
    }
  };

  const showConnectionAlert = () => {
    const message = "No internet connection. Please connect to the internet and try again.";
    
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.LONG);
    } else {
      Alert.alert("Connection Required", message);
    }
  };

  // Save quizzes using appropriate storage
  const saveQuizzesToStorage = async (quizData) => {
    try {
      if (!isWeb) {
        // Try native storage first
        await storageManager.saveQuizzes(quizData);
      }
      // Always save to web storage as fallback
      await webStorageManager.saveQuizzes(quizData);
    } catch (error) {
      console.error("❌ Error saving quizzes:", error);
      // Fallback to web storage only
      await webStorageManager.saveQuizzes(quizData);
      setUsingWebStorage(true);
    }
  };

  // Load quizzes from storage with fallbacks
  const loadFromStorage = async () => {
    try {
      let loadedQuizzes = [];
      
      if (!isWeb) {
        try {
          loadedQuizzes = await storageManager.loadQuizzes();
          console.log("📱 Loaded from native storage:", loadedQuizzes.length);
        } catch (nativeError) {
          console.warn("⚠️ Native storage failed, falling back to web storage");
          setUsingWebStorage(true);
        }
      }
      
      // If native failed or we're on web, use web storage
      if (loadedQuizzes.length === 0) {
        loadedQuizzes = await webStorageManager.loadQuizzes();
        setUsingWebStorage(true);
        console.log("🌐 Loaded from web storage:", loadedQuizzes.length);
      }
      
      console.log("✅ Final loaded quizzes:", loadedQuizzes.length);
      setQuizzes(loadedQuizzes);
      setStorageError(null);
      
    } catch (error) {
      console.error("❌ Error loading from storage:", error);
      setQuizzes([]);
      setStorageError('Failed to load local data');
    }
  };

  // Enhanced fetch quizzes with better error handling
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setStorageError(null);
      
      console.log("🌐 Starting quiz fetch process...");
      
      // Always try to load from storage first for immediate display
      await loadFromStorage();
      
      // Check internet connection
      const connected = await checkInternetConnection();
      if (!connected) {
        console.log("🌐 No internet connection, using local storage only");
        setLoading(false);
        return;
      }

      console.log("🌐 Fetching quizzes from API");
      const response = await fetch("https://healthprof.com.ng/api/jquizzes/", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ API response received:", data.length, "quizzes");
      
      // Save to storage and update state
      await saveQuizzesToStorage(data);
      setQuizzes(data);
      
    } catch (error) {
      console.error("❌ Error fetching quizzes:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setStorageError('Network error. Using local data.');
      } else {
        setStorageError('Failed to load new quizzes. Using local data.');
      }
      
      // Don't clear quizzes - keep local data visible
    } finally {
      setLoading(false);
    }
  };

  // Enhanced fetch quiz detail
  const fetchQuizDetail = async (quizId) => {
    try {
      const connected = await checkInternetConnection();
      if (!connected) {
        showConnectionAlert();
        return;
      }

      setLoadingQuizId(quizId);
      console.log("📥 Fetching quiz details for ID:", quizId);

      const response = await fetch(`https://healthprof.com.ng/api/jquizzes/${quizId}/`, {
        timeout: 15000, // 15 second timeout for quiz details
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const quiz = await response.json();
      console.log("✅ Quiz details received:", quiz.title);

      // Save quiz data to storage
      try {
        if (!isWeb) {
          await storageManager.saveQuizQuestions(quiz.id, quiz.questions || []);
        }
        // Always save to web storage as fallback
        await webStorageManager.saveQuizQuestions(quiz.id, quiz.questions || []);
      } catch (storageError) {
        console.warn("⚠️ Could not save quiz questions to storage:", storageError);
      }

      await AsyncStorage.setItem("quizId", quizId.toString());
      await AsyncStorage.setItem("selectedQuizTime", quiz.time_limit.toString());
      await AsyncStorage.setItem("quizTitle", quiz.title);
      await AsyncStorage.setItem("quizDescription", quiz.description || '');

      // Navigate to quiz home
      router.push({
        pathname: "/quizHome",
        params: { 
          quizId: quizId.toString(),
          quizTitle: quiz.title,
          quizDescription: quiz.description || '',
          quizTimeLimit: quiz.time_limit.toString()
        },
      });

    } catch (error) {
      console.error("❌ Error fetching quiz detail:", error);
      
      if (error.message.includes('JSON')) {
        Alert.alert("Error", "Invalid quiz data received from server.");
      } else if (error.message.includes('HTTP')) {
        Alert.alert("Error", "Server error. Please try again.");
      } else {
        Alert.alert("Connection Error", "Failed to load quiz. Please check your connection and try again.");
      }
    } finally {
      setLoadingQuizId(null);
    }
  };

  const handleQuizPress = async (quizId) => {
    await fetchQuizDetail(quizId);
  };

  const retryConnection = async () => {
    try {
      setLoading(true);
      setStorageError(null);
      await fetchQuizzes();
    } catch (error) {
      console.error("❌ Failed to retry connection:", error);
      setStorageError('Failed to reload quizzes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    Alert.alert(
      "Clear All Data",
      "This will delete all locally stored quiz data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await webStorageManager.clearAll();
              if (!isWeb) {
                // For native, we'll reload from empty storage
                const db = await storageManager.getDatabase();
                await db.runAsync("DELETE FROM quizzes;");
                await db.runAsync("DELETE FROM quiz_questions;");
              }
              setQuizzes([]);
              setStorageError(null);
              await fetchQuizzes();
            } catch (error) {
              console.error("❌ Error clearing data:", error);
              setStorageError('Failed to clear data');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    let unsubscribe;
    
    const setupConnectionListener = async () => {
      if (!isWeb) {
        // For native platforms
        unsubscribe = NetInfo.addEventListener(state => {
          console.log("📡 NetInfo state changed:", {
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable
          });
          setIsConnected(state.isConnected || state.isInternetReachable);
        });
      } else {
        // For web
        const handleOnline = () => {
          console.log("📡 Web: Online");
          setIsConnected(true);
        };
        const handleOffline = () => {
          console.log("📡 Web: Offline");
          setIsConnected(false);
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        unsubscribe = () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    };

    setupConnectionListener();
    fetchQuizzes();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Custom render item to insert ads after every 4 items
  const renderItem = ({ item, index }) => {
    return (
      <View>
        <TouchableOpacity
          style={[
            styles.quizItem,
            loadingQuizId !== null && styles.disabledItem
          ]}
          onPress={() => handleQuizPress(item.id)}
          disabled={loadingQuizId !== null}
        >
          <View style={styles.quizContent}>
            <Text style={styles.quizTitle}>{item.title}</Text>
            <Text style={styles.quizDescription}>{item.description}</Text>
            <View style={styles.quizMeta}>
              <Text style={styles.quizMetaText}>📝 {item.num_questions} questions</Text>
              <Text style={styles.quizMetaText}>⏱️ {item.time_limit} minutes</Text>
            </View>
          </View>
          
          {loadingQuizId === item.id ? (
            <ActivityIndicator style={styles.itemLoading} color="#007AFF" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>

        {/* 🧩 Show banner ad after every 4 items */}
        {(index + 1) % 4 === 0 && (
          <View style={styles.middleAdContainer}>
            <AdBanner />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading quizzes...</Text>
      </View>
    );
  }

  if (storageError && quizzes.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{storageError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllData}>
          <Text style={styles.clearButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Interstitial Ad - Shows on page load */}
      {showInterstitial && <InterstitialAdComponent />}

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="wifi-off" size={16} color="#fff" />
          <Text style={styles.connectionText}>No internet connection - Using local data</Text>
        </View>
      )}
      
      {/* Back Button for Web (optional, for better UX) */}
      {isWeb && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      )}
      
      {quizzes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={48} color="#666" />
          <Text style={styles.noQuizzesText}>No quizzes available</Text>
          <Text style={styles.noQuizzesSubtext}>
            {isConnected ? 'Check your connection and retry' : 'Connect to internet to download quizzes'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryConnection}>
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {storageError && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning-outline" size={16} color="#FF9500" />
              <Text style={styles.warningText}>{storageError}</Text>
            </View>
          )}
          <FlatList
            data={quizzes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Bottom Ad Banner */}
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  storageInfo: {
    marginTop: 5,
    color: '#007AFF',
    fontSize: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#007AFF',
    marginLeft: 5,
    fontSize: 16,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderColor: '#FFEAA7',
    borderWidth: 1,
  },
  warningText: {
    color: '#856404',
    marginLeft: 5,
    fontSize: 14,
  },
  storageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  connectionText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  storageText: {
    color: '#007AFF',
    marginLeft: 5,
    fontSize: 14,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  quizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  quizContent: {
    flex: 1,
  },
  disabledItem: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: '#333',
  },
  quizDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quizMetaText: {
    fontSize: 12,
    color: '#888',
  },
  itemLoading: {
    marginLeft: 10,
  },
  noQuizzesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
  },
  noQuizzesSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // 🧩 Middle Ad Container Styles
  middleAdContainer: { 
    marginVertical: 10, 
    marginBottom: 12,
  },
});