import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import AdBanner from "../components/AdBanner"; // Import AdBanner
import InterstitialAdComponent from "../components/InterstitialAd"; // Import InterstitialAd

export default function QuizStartup() {
  const [userName, setUserName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);
  const [db, setDb] = useState(null);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [description, setDescription] = useState("");
  const [num_questions, setNumQ] = useState("");
  const [quiz, setQuiz] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [quizId, setQuizId] = useState("");
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Handle deep links and URL parameters
  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        // First, check for quizId in route params (if navigated from within app)
        if (route.params?.quizId) {
          const paramQuizId = route.params.quizId;
          console.log("Received quizId from params:", paramQuizId);
          setQuizId(paramQuizId);
          await AsyncStorage.setItem("quizId", paramQuizId);
          return;
        }

        // Check for quizId in AsyncStorage (set by deep link handler)
        const storedQuizId = await AsyncStorage.getItem("quizId");
        if (storedQuizId) {
          console.log("Found quizId in storage:", storedQuizId);
          setQuizId(storedQuizId);
          return;
        }

        // Handle URL parameters if app was opened from a web link
        if (Platform.OS === 'web') {
          const urlParams = new URLSearchParams(window.location.search);
          const urlQuizId = urlParams.get('quizId');
          if (urlQuizId) {
            console.log("Found quizId in URL params:", urlQuizId);
            setQuizId(urlQuizId);
            await AsyncStorage.setItem("quizId", urlQuizId);
            return;
          }
        }

        // Handle deep linking
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log("App opened with URL:", initialUrl);
          const extractedQuizId = extractQuizIdFromUrl(initialUrl);
          if (extractedQuizId) {
            console.log("Extracted quizId from deep link:", extractedQuizId);
            setQuizId(extractedQuizId);
            await AsyncStorage.setItem("quizId", extractedQuizId);
            return;
          }
        }

        console.log("No quizId found from any source");
        setQuiz(false);

      } catch (error) {
        console.error("Error handling deep link:", error);
        setQuiz(false);
      }
    };

    handleDeepLink();
  }, [route.params]);

  // Show interstitial ad when component mounts and quizId is available
  useEffect(() => {
    if (quizId) {
      // Show interstitial ad after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowInterstitial(true);
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [quizId]);

  // Extract quizId from various URL formats
  const extractQuizIdFromUrl = (url) => {
    try {
      console.log("Extracting quizId from URL:", url);
      
      // Handle healthprapp:// scheme
      if (url.startsWith('healthprapp://')) {
        const match = url.match(/healthprapp:\/\/healthprof\.com\.ng\/quizzes\/([^\/]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Handle https:// scheme
      if (url.startsWith('https://')) {
        const match = url.match(/https:\/\/healthprof\.com\.ng\/quizzes\/([^\/]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      // Handle URL parameters
      const urlObj = new URL(url);
      const quizIdParam = urlObj.searchParams.get('quizId');
      if (quizIdParam) {
        return quizIdParam;
      }
      
      return null;
    } catch (error) {
      console.error("Error extracting quizId from URL:", error);
      return null;
    }
  };

  const initDB = async () => {
    try {
      const database = await SQLite.openDatabaseAsync("healthprof.db");
      setDb(database);
      return database;
    } catch (error) {
      console.error("Error initializing database:", error);
      return null;
    }
  };

  // Load stored values and fetch quiz data
  useEffect(() => {
    const loadData = async () => {
      if (!quizId) return;

      const savedName = await AsyncStorage.getItem("userName");
      const savedSchool = await AsyncStorage.getItem("schoolName");
      
      if (savedName) setUserName(savedName);
      if (savedSchool) setSchoolName(savedSchool);
      
      const database = await initDB();
      if (database) {
        await fetchQuizzes(database);
      }
    };

    loadData();
  }, [quizId]);

  const loadFromDB = async (database) => {
    try {
      console.log("Loading quiz data from DB for quizId:", quizId);
      const rows = await database.getFirstAsync(
        `SELECT * FROM quizzes WHERE id = ?`, 
        [quizId]
      );
      
      if (rows) {
        setTimeLimit(rows.time_limit);
        setTitle(rows.title);
        setDescription(rows.description);
        setNumQ(rows.num_questions);
        
        const loadquestion = await database.getAllAsync(
          `SELECT * FROM quiz_questions WHERE quiz_id = ?`, 
          [quizId]
        );
        console.log("Loaded questions from DB:", loadquestion.length);
        setQuestions(loadquestion);
      } else {
        console.log("No quiz found in database for id:", quizId);
        setQuiz(false);
      }
    } catch (error) {
      console.error("Error loading from DB:", error);
      setQuiz(false);
    }
  };

  const saveQuizzesToDB = async (database, quizData) => {
    try {
      console.log("Saving quiz data to DB:", quizData);
      
      // First, save the quiz main data
      if (quizData.quiz) {
        await database.runAsync(
          `INSERT OR REPLACE INTO quizzes 
          (id, title, description, time_limit, num_questions) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            quizData.quiz.id,
            quizData.quiz.title,
            quizData.quiz.description,
            quizData.quiz.time_limit,
            quizData.quiz.num_questions
          ]
        );
      }

      // Then save questions
      if (quizData.questions && Array.isArray(quizData.questions)) {
        for (const q of quizData.questions) {
          await database.runAsync(
            `INSERT OR REPLACE INTO quiz_questions 
            (id, quiz_id, question, option1, option2, option3, option4, correct_option, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              q.id,
              quizData.quiz.id,
              q.question,
              q.option1,
              q.option2,
              q.option3,
              q.option4,
              q.correct_option,
              q.description || ""
            ]
          );
        }
        console.log(`Saved ${quizData.questions.length} questions to DB`);
      }
      
      // Now load the data from DB
      await loadFromDB(database);
    } catch (error) {
      console.error("Error saving quizzes to DB:", error);
      throw error;
    }
  };

  const fetchQuizzes = async (database) => {
    try {
      console.log("Fetching quizzes for quizId:", quizId);
      
      if (!quizId) {
        console.error("No quizId found");
        return;
      }

      // Check if quiz exists in database
      const checkdb = await database.getFirstAsync(
        `SELECT * FROM quiz_questions WHERE quiz_id = ?`, 
        [quizId]
      );
      
      if (!checkdb) {
        console.log("Quiz not found in local DB, fetching from API...");
        const response = await fetch(`https://healthprof.com.ng/quizzes/${quizId}/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("API response received:", data);
        
        await saveQuizzesToDB(database, data);
      } else {
        console.log('Quiz found in local DB, loading...');
        await loadFromDB(database);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuiz(false);
    }
  };

  // Save before navigation
  const handleStart = async () => {
    if (!userName) {
      alert("Please enter your name before starting.");
      return;
    }
    
    if (questions.length === 0) {
      alert("No questions available for this quiz.");
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem("userName", userName);
      await AsyncStorage.setItem("schoolName", schoolName);
      await AsyncStorage.setItem("selectedQuestionId", 'quiz');
      await AsyncStorage.setItem("examTime", String(parseInt(timeLimit, 10)));
      await AsyncStorage.setItem("title", title);
      
      console.log("Navigating to exam with questions:", questions.length);
      // Navigate to Quiz Screen (Exam page)
      navigation.navigate("examScreen", { quizQ: questions });
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Error starting quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle manual quiz ID entry for testing
  const handleManualQuizId = async () => {
    if (quizId) {
      await AsyncStorage.setItem("quizId", quizId);
      const database = await initDB();
      if (database) {
        await fetchQuizzes(database);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top Ad Banner */}
      <AdBanner />

      {/* Interstitial Ad - Shows on page load */}
      {showInterstitial && <InterstitialAdComponent />}

      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading Quiz...</Text>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!quizId ? (
          <View style={styles.notAvailable}>
            <Text style={styles.notText}>
              No Quiz ID Provided
            </Text>
            <Text style={styles.notSubText}>
              Please access the quiz through a valid link or enter a Quiz ID below:
            </Text>
            
            {/* Manual Quiz ID input for testing */}
            <TextInput
              style={styles.input}
              placeholder="Enter Quiz ID manually"
              value={quizId}
              onChangeText={setQuizId}
            />
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={handleManualQuizId}
            >
              <Text style={styles.manualButtonText}>Load Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : quiz ? (
          <View style={styles.card}>
            <Text style={styles.title}>{title || "Loading..."}</Text>
            <Text style={styles.desc}>{description || "Loading description..."}</Text>

            <View style={styles.infoBox}>
              <Text style={styles.info}>
                <Text style={styles.bold}>Quiz ID: </Text>
                {quizId}
              </Text>
              <Text style={styles.info}>
                <Text style={styles.bold}>Number of Questions: </Text>
                {num_questions || "Loading..."}
              </Text>
              <Text style={styles.info}>
                <Text style={styles.bold}>Time Allotted: </Text>
                {timeLimit ? `${timeLimit} minutes` : "Loading..."}
              </Text>
              <Text style={styles.info}>
                <Text style={styles.bold}>Questions Loaded: </Text>
                {questions.length}
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={userName}
                onChangeText={setUserName}
              />

              <TouchableOpacity 
                style={[
                  styles.startBtn, 
                  questions.length === 0 && styles.disabledBtn
                ]} 
                onPress={handleStart}
                disabled={questions.length === 0 || loading}
              >
                <Text style={styles.startBtnText}>
                  {questions.length === 0 ? "Loading Questions..." : "Start Quiz"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.notAvailable}>
            <Text style={styles.notText}>
              The quiz is not yet available or is currently being deleted.
            </Text>
            <Text style={styles.notSubText}>
              Please check back later or contact support.
            </Text>
          </View>
        )}
      </ScrollView>

      <Text style={styles.footer}>© Jambites</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginBottom:35
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    textAlign: "center",
    marginBottom: 15,
    color: "#555",
    lineHeight: 20,
  },
  infoBox: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 6,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
  bold: {
    fontWeight: "bold",
  },
  middleAdContainer: {
    marginVertical: 15,
    marginBottom: 20,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fafafa",
  },
  startBtn: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#6c757d",
  },
  startBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  manualButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  manualButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  notAvailable: {
    padding: 20,
    backgroundColor: "#ffe9e9",
    borderRadius: 8,
    width: "100%",
    maxWidth: 400,
  },
  notText: {
    color: "#c0392b",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  notSubText: {
    color: "#c0392b",
    textAlign: "center",
    fontSize: 14,
    marginBottom: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    color: "#007bff",
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    color: "#007bff",
    padding: 10,
    marginBottom:30,
  },
});