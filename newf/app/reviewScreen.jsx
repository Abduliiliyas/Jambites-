import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useRoute } from "@react-navigation/native";
import Markdown from 'react-native-markdown-display';

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEFAULT_API_KEY = "sk-532fc5b9d3ce464c8a7cecc8dd05d329";
const BACKEND_URL = "https://healthprof.com.ng/api"; // UPDATE WITH YOUR BACKEND URL

const { width, height } = Dimensions.get('window');

const SYSTEM_PROMPT = `You are an expert medical and healthcare education assistant. Your task is to explain exam questions in detail.

Provide analysis in this structure:
1. Question Analysis: What is being asked?
2. Options Breakdown: Explain each option (A, B, C, D)
3. Correct Answer: Why is this option correct?
4. Why Others Are Wrong: Explain misconceptions
5. Learning Points: Key takeaways

Use medical terminology appropriately. Be clear and educational.`;

const MINIMUM_AI_CHARS = 1000;

// Helper function to get result storage key
const getResultKey = (timestamp) => `exam_result_${timestamp}`;

// Helper function to format date
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Shuffle function for options
const shuffleArray = (array) => {
  if (!array) return [];
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ReviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // States for current exam review (from navigation params)
  const [currentExam, setCurrentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // States for saved exams history
  const [savedExams, setSavedExams] = useState([]);
  const [showExamHistory, setShowExamHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // States for AI assistance
  const [showExplanation, setShowExplanation] = useState({});
  const [aiExpanded, setAiExpanded] = useState({});
  const [aiResponses, setAiResponses] = useState({});
  const [loadingAI, setLoadingAI] = useState({});
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  
  // AI Limit state
  const [aiLimit, setAiLimit] = useState(0);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  // States for filtering and organization
  const [currentSubjectFilter, setCurrentSubjectFilter] = useState("All Subjects");
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  
  // Load current exam from navigation params
  useEffect(() => {
    if (route.params?.result) {
      const examResult = route.params.result;
      setCurrentExam(examResult);
      
      // Organize questions by subject for better display
      const organizedQuestions = organizeQuestionsBySubject(examResult.questions || []);
      setQuestions(organizedQuestions);
      
      // Extract unique subjects for filtering
      const uniqueSubjects = ["All Subjects", ...new Set(organizedQuestions.map(q => q.subject))];
      setSubjectsList(uniqueSubjects);
    }
  }, [route.params]);

  // Load saved exam history and check AI limit
  useEffect(() => {
    loadExamHistory();
    checkPremiumStatus();
  }, []);

  // Check premium status and AI limit
  const checkPremiumStatus = async () => {
    try {
      const isActivated = await AsyncStorage.getItem('isActivated');
      setIsPremiumUser(isActivated === 'true');
      
      // Load user info
      const savedUser = await AsyncStorage.getItem("userInfo");
      const user = savedUser ? JSON.parse(savedUser) : null;
      setUserInfo(user);
      
      if (user?.userId) {
        // Check AI limit from backend
        await checkAiLimit(user.userId, 0, false);
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
    }
  };

  // Check AI limit from backend
  const checkAiLimit = async (userId, usage = 0, showLoading = true) => {
    if (showLoading) {
      setIsCheckingLimit(true);
    }
    
    try {
      console.log(`Checking AI limit for user ${userId}, usage: ${usage}`);
      
      const response = await fetch(`${BACKEND_URL}/jcheck-subscription/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ai_usage: usage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI limit check response:", data);
      
      if (data.is_subscribed) {
        setAiLimit(data.aiLimit || 0);
        return {
          success: true,
          hasEnoughLimit: data.has_enough_limit || false,
          aiLimit: data.aiLimit || 0,
          message: data.message,
          deducted: data.deducted || false
        };
      } else {
        return {
          success: false,
          message: data.message || "Not subscribed or user not found"
        };
      }
    } catch (error) {
      console.error("Error checking AI limit:", error);
      return {
        success: false,
        message: "Failed to check subscription status."
      };
    } finally {
      if (showLoading) {
        setIsCheckingLimit(false);
      }
    }
  };

  // Calculate AI usage characters
  const calculateAiUsage = (prompt, aiResponse) => {
    const inputChars = SYSTEM_PROMPT.length + prompt.length;
    const outputChars = aiResponse.length;
    const totalChars = inputChars + outputChars;
    
    return {
      inputChars,
      outputChars,
      totalChars
    };
  };

  const loadExamHistory = async () => {
    try {
      setLoadingHistory(true);
      const keys = await AsyncStorage.getAllKeys();
      const resultKeys = keys.filter(key => key.startsWith('exam_result_'));
      
      const exams = [];
      for (const key of resultKeys) {
        try {
          const examData = await AsyncStorage.getItem(key);
          if (examData) {
            const exam = JSON.parse(examData);
            exams.push({
              key,
              timestamp: exam.timestamp || parseInt(key.replace('exam_result_', '')),
              ...exam
            });
          }
        } catch (error) {
          console.error(`Error parsing exam ${key}:`, error);
        }
      }
      
      // Sort by timestamp (newest first)
      exams.sort((a, b) => b.timestamp - a.timestamp);
      setSavedExams(exams);
    } catch (error) {
      console.error("Error loading exam history:", error);
      Alert.alert("Error", "Failed to load exam history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const organizeQuestionsBySubject = (questionsArray) => {
    if (!questionsArray || !Array.isArray(questionsArray)) return [];
    
    // If questions already have subject info from the exam, use it
    const questionsWithSubjects = questionsArray.map(q => ({
      ...q,
      subject: q.subject || "General"
    }));
    
    return questionsWithSubjects;
  };

  const [subjectsList, setSubjectsList] = useState(["All Subjects"]);

  const getCorrectOptionValue = (question) => {
    if (!question) return null;
    
    // Try different methods to find correct option
    if (question.correct_option) {
      const optMap = {
        option1: question.option1,
        option2: question.option2,
        option3: question.option3,
        option4: question.option4,
      };
      
      if (optMap[question.correct_option]) {
        return optMap[question.correct_option];
      }
      
      // Try letter mapping
      const letter = String(question.correct_option).toUpperCase();
      const letterMap = { A: "option1", B: "option2", C: "option3", D: "option4" };
      if (letterMap[letter]) {
        return optMap[letterMap[letter]];
      }
    }
    
    // If question has isCorrect field, find which option was correct
    if (question.correctAnswer) {
      return question.correctAnswer;
    }
    
    // Last resort: return the first option
    return question.option1 || "No correct option specified";
  };

  const getSelectedOptionValue = (question) => {
    if (!question) return null;
    
    if (question.selectedAnswer) {
      return question.selectedAnswer;
    }
    
    // Fallback to check option values
    const options = [question.option1, question.option2, question.option3, question.option4];
    const selectedOpt = options.find(opt => opt === question.userAnswer);
    return selectedOpt || "No answer selected";
  };

  const getOptionLetter = (optionValue, question) => {
    if (!optionValue || !question) return "";
    
    const options = [question.option1, question.option2, question.option3, question.option4];
    const index = options.indexOf(optionValue);
    return index >= 0 ? String.fromCharCode(65 + index) : "";
  };

  const handleToggleExplanation = (questionId) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleAiExplanation = (id) => {
    setAiExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkInternetConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected;
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  };

  const showPremiumAlert = () => {
    Alert.alert(
      "Premium Feature 🔒",
      "AI-powered question analysis is available to premium subscribers only.\n\nActivate your account to access this advanced learning feature.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Activate Account",
          onPress: () => navigation.navigate('subscription'),
          style: "default"
        }
      ]
    );
  };

  const showAiLimitAlert = (currentLimit) => {
    Alert.alert(
      "Insufficient AI Credits",
      `You have ${currentLimit.toLocaleString()} AI characters remaining.\n\nMinimum required for AI analysis: ${MINIMUM_AI_CHARS.toLocaleString()} characters\n\nPlease purchase more credits to continue using AI assistance.`,
      [
        { text: "OK", style: "cancel" },
        { 
          text: "Buy Credits", 
          onPress: () => navigation.navigate('subscription') 
        }
      ]
    );
  };

  const showLoginAlert = () => {
    Alert.alert(
      "Login Required",
      "You need to be logged in to use AI features.\n\nPlease log in or create an account.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Login", 
          onPress: () => navigation.navigate('login') 
        }
      ]
    );
  };

  const isValidApiKey = (apiKey) => {
    if (!apiKey) return false;
    
    const isGenericPlaceholder = apiKey.includes("YOUR_API_KEY") || 
                                 apiKey.includes("example") ||
                                 (apiKey.includes("sk-") && apiKey.length < 30);
    
    return !isGenericPlaceholder;
  };

  const generateQuestionPrompt = (questionData, correctValue, selectedValue) => {
    const options = [
      questionData.option1,
      questionData.option2,
      questionData.option3,
      questionData.option4
    ].filter(Boolean);

    const correctLetter = getOptionLetter(correctValue, questionData);
    const selectedLetter = getOptionLetter(selectedValue, questionData);
    
    let prompt = `Analyze this exam question:\n\n`;
    prompt += `QUESTION: ${questionData.question}\n\n`;
    
    if (options.length > 0) {
      prompt += `OPTIONS:\n`;
      options.forEach((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        prompt += `${letter}) ${opt}\n`;
      });
    }
    
    prompt += `\nCORRECT ANSWER: ${correctLetter}) ${correctValue}\n`;
    
    if (selectedValue && selectedValue !== correctValue) {
      prompt += `STUDENT'S ANSWER: ${selectedLetter}) ${selectedValue}\n`;
      prompt += `\nPlease explain why the student's answer was incorrect and provide learning insights.`;
    } else if (selectedValue === correctValue) {
      prompt += `\nThe student answered correctly. Please provide additional context and learning points.`;
    } else {
      prompt += `\nThe student did not answer this question. Please provide comprehensive explanation.`;
    }

    return prompt;
  };

  const handleAiButtonPress = async (questionId, questionData) => {
    // STEP 1: Check premium status
    if (!isPremiumUser) {
      showPremiumAlert();
      return;
    }

    // STEP 2: If AI response already exists, just toggle
    if (aiResponses[questionId]) {
      toggleAiExplanation(questionId);
      return;
    }

    // STEP 3: Check internet
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setShowNoInternet(true);
      setTimeout(() => setShowNoInternet(false), 3000);
      return;
    }

    // STEP 4: Check if user is logged in
    if (!userInfo?.userId) {
      showLoginAlert();
      return;
    }

    // STEP 5: Check if API key is valid
    if (!isValidApiKey(DEFAULT_API_KEY)) {
      setAiResponses(prev => ({
        ...prev,
        [questionId]: "AI feature requires a valid API key. Please contact support."
      }));
      setAiExpanded(prev => ({ ...prev, [questionId]: true }));
      return;
    }

    // STEP 6: Check AI limit
    const limitCheck = await checkAiLimit(userInfo.userId, 0, true);
    
    if (!limitCheck.success) {
      Alert.alert("Subscription Error", limitCheck.message || "Unable to verify subscription.");
      return;
    }
    
    if (!limitCheck.hasEnoughLimit) {
      showAiLimitAlert(limitCheck.aiLimit);
      return;
    }

    // STEP 7: All checks passed
    await fetchAiExplanation(questionId, questionData);
  };

  const fetchAiExplanation = async (questionId, questionData) => {
    setLoadingAI(prev => ({ ...prev, [questionId]: true }));
    
    try {
      const correctValue = getCorrectOptionValue(questionData);
      const selectedValue = getSelectedOptionValue(questionData);
      const prompt = generateQuestionPrompt(questionData, correctValue, selectedValue);
      
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEFAULT_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "No explanation available.";
      
      // Calculate characters used and deduct from limit
      const usage = calculateAiUsage(prompt, aiResponse);
      
      // Deduct AI usage from user's limit
      if (userInfo?.userId) {
        const deductionResult = await checkAiLimit(userInfo.userId, usage.totalChars, false);
        
        if (deductionResult.success && deductionResult.deducted) {
          setAiLimit(deductionResult.aiLimit);
          
          // Show brief usage notification
          Alert.alert(
            "AI Credits Used",
            `${usage.totalChars.toLocaleString()} characters deducted\nRemaining: ${deductionResult.aiLimit.toLocaleString()}`,
            [{ text: "OK" }]
          );
        } else if (!deductionResult.success) {
          Alert.alert(
            "Usage Error",
            deductionResult.message || "Failed to deduct AI credits."
          );
          return;
        }
      }
      
      // Save AI response
      setAiResponses(prev => ({ ...prev, [questionId]: aiResponse }));
      setAiExpanded(prev => ({ ...prev, [questionId]: true }));

    } catch (error) {
      console.error('AI Error:', error);
      setAiResponses(prev => ({
        ...prev,
        [questionId]: "Unable to fetch AI explanation. Please try again later. Error: " + error.message
      }));
      setAiExpanded(prev => ({ ...prev, [questionId]: true }));
    } finally {
      setLoadingAI(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const loadExamFromHistory = async (examKey) => {
    try {
      const examData = await AsyncStorage.getItem(examKey);
      if (examData) {
        const exam = JSON.parse(examData);
        setCurrentExam(exam);
        
        const organizedQuestions = organizeQuestionsBySubject(exam.questions || []);
        setQuestions(organizedQuestions);
        
        const uniqueSubjects = ["All Subjects", ...new Set(organizedQuestions.map(q => q.subject))];
        setSubjectsList(uniqueSubjects);
        setCurrentSubjectFilter("All Subjects");
        
        setShowExamHistory(false);
      }
    } catch (error) {
      console.error("Error loading exam from history:", error);
      Alert.alert("Error", "Failed to load exam");
    }
  };

  const deleteExamFromHistory = async (examKey) => {
    Alert.alert(
      "Delete Exam",
      "Are you sure you want to delete this exam from your history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(examKey);
              await loadExamHistory();
              Alert.alert("Success", "Exam deleted successfully");
            } catch (error) {
              console.error("Error deleting exam:", error);
              Alert.alert("Error", "Failed to delete exam");
            }
          }
        }
      ]
    );
  };

  const clearAllHistory = () => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all exam history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const resultKeys = keys.filter(key => key.startsWith('exam_result_'));
              
              for (const key of resultKeys) {
                await AsyncStorage.removeItem(key);
              }
              
              setSavedExams([]);
              setCurrentExam(null);
              setQuestions([]);
              Alert.alert("Success", "All exam history cleared");
            } catch (error) {
              console.error("Error clearing history:", error);
              Alert.alert("Error", "Failed to clear history");
            }
          }
        }
      ]
    );
  };

  const filterQuestionsBySubject = () => {
    if (!currentExam || !questions.length) return [];
    
    if (currentSubjectFilter === "All Subjects") {
      return questions;
    }
    
    return questions.filter(q => q.subject === currentSubjectFilter);
  };

  const renderExamHistoryModal = () => (
    <Modal
      visible={showExamHistory}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowExamHistory(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Exam History</Text>
            <TouchableOpacity onPress={() => setShowExamHistory(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {loadingHistory ? (
            <ActivityIndicator size="large" color="#007bff" style={styles.loadingIndicator} />
          ) : savedExams.length === 0 ? (
            <View style={styles.emptyHistoryContainer}>
              <Icon name="time-outline" size={50} color="#ccc" />
              <Text style={styles.emptyHistoryText}>No exam history found</Text>
            </View>
          ) : (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyCount}>
                  {savedExams.length} exam{savedExams.length !== 1 ? 's' : ''} saved
                </Text>
                <TouchableOpacity onPress={clearAllHistory} style={styles.clearAllButton}>
                  <Icon name="trash-outline" size={16} color="#dc3545" />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={savedExams}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.historyItem}
                    onPress={() => loadExamFromHistory(item.key)}
                    onLongPress={() => deleteExamFromHistory(item.key)}
                  >
                    <View style={styles.historyItemHeader}>
                      <Text style={styles.historyItemTitle}>
                        {item.department || "Multiple Subjects"}
                      </Text>
                      <Text style={styles.historyItemScore}>
                        {item.score || 0}/{item.totalQuestions || 0} ({item.percentage || 0}%)
                      </Text>
                    </View>
                    <Text style={styles.historyItemDate}>
                      {formatDate(item.timestamp)}
                    </Text>
                    <Text style={styles.historyItemType}>
                      {item.examType === "full" ? "Full Exam" : "Practice"} • Set: {item.questionId}
                    </Text>
                    <View style={styles.historyItemFooter}>
                      <Text style={styles.historyItemPerformance}>
                        Performance: {item.performance || "Unknown"}
                      </Text>
                      <Icon name="chevron-forward" size={16} color="#6c757d" />
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.historyList}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderSubjectsModal = () => (
    <Modal
      visible={showSubjectsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowSubjectsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by Subject</Text>
            <TouchableOpacity onPress={() => setShowSubjectsModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={subjectsList}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.subjectFilterItem,
                  currentSubjectFilter === item && styles.subjectFilterItemSelected
                ]}
                onPress={() => {
                  setCurrentSubjectFilter(item);
                  setShowSubjectsModal(false);
                }}
              >
                <Text style={[
                  styles.subjectFilterText,
                  currentSubjectFilter === item && styles.subjectFilterTextSelected
                ]}>
                  {item}
                </Text>
                {currentSubjectFilter === item && (
                  <Icon name="checkmark" size={20} color="#007bff" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.subjectFilterList}
          />
        </View>
      </View>
    </Modal>
  );

  const renderQuestionItem = ({ item, index }) => {
    const correctValue = getCorrectOptionValue(item);
    const selectedValue = getSelectedOptionValue(item);
    const isCorrect = selectedValue === correctValue;
    const questionId = item.id || `question_${index}`;
    const isAiLoading = loadingAI[questionId];
    const aiResponse = aiResponses[questionId];
    const isAiExpanded = aiExpanded[questionId];
    
    const options = [
      { letter: "A", value: item.option1 },
      { letter: "B", value: item.option2 },
      { letter: "C", value: item.option3 },
      { letter: "D", value: item.option4 }
    ].filter(opt => opt.value); // Remove empty options

    const correctLetter = getOptionLetter(correctValue, item);
    const selectedLetter = getOptionLetter(selectedValue, item);

    return (
      <View style={styles.questionCard}>
        {/* Subject badge */}
        {item.subject && item.subject !== "General" && (
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>{item.subject}</Text>
          </View>
        )}
        
        <View style={styles.questionSection}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionNumber}>{index + 1}.</Text>
            <Markdown style={markdownStyles}>
              {item.question || "No question text available"}
            </Markdown>
          </View>

          {/* Options */}
          {options.map((opt) => {
            const isCorrectOption = opt.value === correctValue;
            const isSelectedOption = opt.value === selectedValue;
            
            return (
              <View
                key={opt.letter}
                style={[
                  styles.option,
                  isCorrectOption && styles.correctOption,
                  isSelectedOption && !isCorrectOption && styles.wrongOption,
                  isSelectedOption && isCorrectOption && styles.correctSelectedOption
                ]}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionLetter}>{opt.letter})</Text>
                  <View style={styles.optionTextContainer}>
                    <Markdown style={markdownStyles}>
                      {opt.value || "No option text"}
                    </Markdown>
                  </View>
                  <View style={styles.optionIcons}>
                    {isCorrectOption && (
                      <Icon name="checkmark-circle" size={20} color="#28a745" />
                    )}
                    {isSelectedOption && !isCorrectOption && (
                      <Icon name="close-circle" size={20} color="#dc3545" />
                    )}
                  </View>
                </View>
                
                {/* Option status indicators */}
                <View style={styles.optionStatus}>
                  {isCorrectOption && (
                    <Text style={styles.correctOptionText}>Correct Answer</Text>
                  )}
                  {isSelectedOption && !isCorrectOption && (
                    <Text style={styles.wrongOptionText}>Your Answer</Text>
                  )}
                  {isSelectedOption && isCorrectOption && (
                    <Text style={styles.correctSelectedText}>Your Correct Answer</Text>
                  )}
                </View>
              </View>
            );
          })}

          {/* Manual Explanation Button */}
          <TouchableOpacity
            style={styles.showExplanationBtn}
            onPress={() => handleToggleExplanation(questionId)}
          >
            <Icon 
              name={showExplanation[questionId] ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.showExplanationText}>
              {showExplanation[questionId] ? "Hide Explanation" : "Show Explanation"}
            </Text>
          </TouchableOpacity>

          {showExplanation[questionId] && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationLabel}>Explanation:</Text>
              <Markdown style={markdownStyles}>
                {item.description || "No explanation available"}
              </Markdown>
            </View>
          )}

          {/* AI Assistance Button - Updated with AI limit */}
          <TouchableOpacity
            style={[
              styles.aiButton,
              !isPremiumUser && styles.aiButtonDisabled,
              (isAiLoading || isCheckingLimit) && styles.aiButtonLoading
            ]}
            onPress={() => handleAiButtonPress(questionId, item)}
            disabled={isAiLoading || isCheckingLimit}
          >
            <Icon 
              name="sparkles" 
              size={16} 
              color={isPremiumUser ? "#fff" : "#aaa"} 
            />
            <Text style={[
              styles.aiButtonText,
              !isPremiumUser && styles.aiButtonTextDisabled
            ]}>
              {isAiLoading ? "Loading AI..." : 
               aiResponse ? (isAiExpanded ? "Hide AI Analysis" : "Show AI Analysis") : 
               "Get AI Assistance"}
            </Text>
            {!isPremiumUser && (
              <Icon name="lock-closed" size={14} color="#FFD700" />
            )}
            {(isAiLoading || isCheckingLimit) && (
              <ActivityIndicator size="small" color="#fff" style={styles.loadingIndicator} />
            )}
            {/* Show AI limit on button for premium users */}
            {isPremiumUser && aiLimit > 0 && !isAiLoading && !isCheckingLimit && (
              <View style={styles.aiButtonLimit}>
                <Text style={styles.aiButtonLimitText}>{aiLimit.toLocaleString()}</Text>
              </View>
            )}
          </TouchableOpacity>

          {isAiExpanded && aiResponse && (
            <View style={styles.aiResponseContainer}>
              <View style={styles.aiHeader}>
                <Icon name="brain" size={18} color="#6f42c1" />
                <Text style={styles.aiHeaderText}>AI-Powered Assistance</Text>
              </View>
              <Markdown style={markdownStyles}>
                {aiResponse}
              </Markdown>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!currentExam && !showExamHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Exam Review</Text>
          <TouchableOpacity onPress={() => setShowExamHistory(true)}>
            <Icon name="time-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.noExamContainer}>
          <Icon name="document-text-outline" size={60} color="#ccc" />
          <Text style={styles.noExamText}>No exam selected for review</Text>
          <Text style={styles.noExamSubtext}>
            Please review an exam from your history or complete a new exam
          </Text>
          <TouchableOpacity 
            style={styles.viewHistoryButton}
            onPress={() => setShowExamHistory(true)}
          >
            <Icon name="time-outline" size={18} color="#fff" />
            <Text style={styles.viewHistoryButtonText}>View Exam History</Text>
          </TouchableOpacity>
        </View>
        
        {renderExamHistoryModal()}
      </SafeAreaView>
    );
  }

  const filteredQuestions = filterQuestionsBySubject();
  const subjectStats = {};
  
  if (currentExam?.subjectResults) {
    Object.entries(currentExam.subjectResults).forEach(([subject, stats]) => {
      subjectStats[subject] = stats;
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Review</Text>
        <TouchableOpacity onPress={() => setShowExamHistory(true)}>
          <Icon name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Exam Info Header - Updated with AI limit */}
      <View style={styles.examInfoCard}>
        <View style={styles.examInfoRow}>
          <Text style={styles.examTitle}>
            {currentExam?.department || "Multiple Subjects"}
          </Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.examScore}>
              {currentExam?.score || 0}/{currentExam?.totalQuestions || 0} 
              ({currentExam?.percentage || 0}%)
            </Text>
            {/* AI Limit Display */}
            {isPremiumUser && aiLimit > 0 && (
              <View style={styles.aiLimitBadge}>
                <Icon name="server-outline" size={12} color="#28a745" />
                <Text style={styles.aiLimitText}>{aiLimit.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.examInfoDetails}>
          <View style={styles.examInfoDetail}>
            <Icon name="calendar-outline" size={14} color="#6c757d" />
            <Text style={styles.examInfoText}>
              {currentExam?.timestamp ? formatDate(currentExam.timestamp) : "Unknown date"}
            </Text>
          </View>
          <View style={styles.examInfoDetail}>
            <Icon name="time-outline" size={14} color="#6c757d" />
            <Text style={styles.examInfoText}>{currentExam?.timeTaken || "0:00"}</Text>
          </View>
          <View style={styles.examInfoDetail}>
            <Icon name="stats-chart-outline" size={14} color="#6c757d" />
            <Text style={[
              styles.examPerformance,
              { color: getGradeColor(currentExam?.percentage) }
            ]}>
              {currentExam?.performance || "Unknown"}
            </Text>
          </View>
        </View>

        {/* Subject Filter */}
        <View style={styles.subjectFilterContainer}>
          <TouchableOpacity 
            style={styles.subjectFilterButton}
            onPress={() => setShowSubjectsModal(true)}
          >
            <Icon name="filter" size={16} color="#007bff" />
            <Text style={styles.subjectFilterButtonText}>
              {currentSubjectFilter}
            </Text>
            <Icon name="chevron-down" size={16} color="#007bff" />
          </TouchableOpacity>
          
          <Text style={styles.filteredCount}>
            Showing {filteredQuestions.length} of {questions.length} questions
          </Text>
        </View>

        {/* Subject Performance Summary */}
        {currentExam?.loadedSubjects && currentExam.loadedSubjects.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.subjectPerformanceScroll}
          >
            {currentExam.loadedSubjects.map((subject, idx) => {
              const stats = subjectStats[subject];
              if (!stats) return null;
              
              return (
                <View key={idx} style={styles.subjectPerformanceCard}>
                  <Text style={styles.subjectPerformanceName} numberOfLines={1}>
                    {subject.split(' ')[0]}
                  </Text>
                  <Text style={[
                    styles.subjectPerformanceScore,
                    { color: getGradeColor(stats.percentage) }
                  ]}>
                    {stats.percentage}%
                  </Text>
                  <Text style={styles.subjectPerformanceDetails}>
                    {stats.correct}/{stats.total}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Questions List */}
      <FlatList
        data={filteredQuestions}
        keyExtractor={(item, index) => item.id ? item.id.toString() : `question_${index}`}
        renderItem={renderQuestionItem}
        contentContainerStyle={styles.questionsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.noQuestionsContainer}>
            <Icon name="help-circle-outline" size={50} color="#ccc" />
            <Text style={styles.noQuestionsText}>No questions found</Text>
            <Text style={styles.noQuestionsSubtext}>
              Try changing the subject filter
            </Text>
          </View>
        }
      />

      {/* Modals */}
      {renderExamHistoryModal()}
      {renderSubjectsModal()}

      {/* No Internet Popup */}
      {showNoInternet && (
        <View style={styles.noInternetPopup}>
          <Icon name="wifi-off" size={20} color="#fff" />
          <Text style={styles.noInternetText}>No Internet Connection</Text>
        </View>
      )}

      {/* AI Limit Checking Indicator */}
      {isCheckingLimit && (
        <View style={styles.checkingLimitPopup}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.checkingLimitText}>Checking AI credits...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper function for grade color
const getGradeColor = (percentage) => {
  if (!percentage) return '#dc3545';
  const pct = Number(percentage);
  if (pct >= 80) return '#28a745';
  if (pct >= 70) return '#17a2b8';
  if (pct >= 60) return '#ffc107';
  if (pct >= 50) return '#fd7e14';
  return '#dc3545';
};

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#212529',
  },
  heading1: { fontSize: 20, fontWeight: 'bold', marginVertical: 8, color: '#333' },
  heading2: { fontSize: 18, fontWeight: 'bold', marginVertical: 6, color: '#333' },
  heading3: { fontSize: 16, fontWeight: 'bold', marginVertical: 4, color: '#333' },
  strong: { fontWeight: 'bold' },
  list_item: {
    marginBottom: 4,
    lineHeight: 20,
  },
  link: { color: '#007bff' },
  code_inline: { 
    backgroundColor: '#e6d9ff', 
    paddingHorizontal: 4, 
    borderRadius: 3, 
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' 
  },
  code_block: { 
    backgroundColor: '#e6d9ff', 
    padding: 10, 
    borderRadius: 6, 
    marginVertical: 6, 
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' 
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  noExamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noExamText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 20,
    marginBottom: 10,
  },
  noExamSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewHistoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  examInfoCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  examInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  examScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  aiLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
    gap: 3,
  },
  aiLimitText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
  },
  examInfoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  examInfoDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  examInfoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 5,
  },
  examPerformance: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  subjectFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  subjectFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    gap: 6,
  },
  subjectFilterButtonText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  filteredCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  subjectPerformanceScroll: {
    marginHorizontal: -5,
  },
  subjectPerformanceCard: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subjectPerformanceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 5,
    textAlign: 'center',
  },
  subjectPerformanceScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  subjectPerformanceDetails: {
    fontSize: 11,
    color: '#6c757d',
  },
  questionsList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  subjectBadge: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  subjectBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007bff',
  },
  questionSection: {
    padding: 15,
  },
  questionContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginRight: 5,
  },
  option: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  correctOption: {
    borderColor: '#28a745',
    backgroundColor: '#e8f5e9',
  },
  wrongOption: {
    borderColor: '#dc3545',
    backgroundColor: '#fde8e8',
  },
  correctSelectedOption: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginRight: 10,
    minWidth: 20,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionIcons: {
    marginLeft: 10,
  },
  optionStatus: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  correctOptionText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '600',
  },
  wrongOptionText: {
    fontSize: 11,
    color: '#dc3545',
    fontWeight: '600',
  },
  correctSelectedText: {
    fontSize: 11,
    color: '#155724',
    fontWeight: '600',
  },
  showExplanationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  showExplanationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  explanationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 5,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 8,
  },
  aiButtonDisabled: {
    backgroundColor: '#e9ecef',
    borderColor: '#dee2e6',
    borderWidth: 1,
  },
  aiButtonLoading: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  aiButtonTextDisabled: {
    color: '#6c757d',
  },
  aiButtonLimit: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  aiButtonLimitText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  aiResponseContainer: {
    marginTop: 10,
    backgroundColor: '#f3edff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d9c7ff',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6d9ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d9c7ff',
    gap: 8,
  },
  aiHeaderText: {
    color: '#6f42c1',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  historyCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clearAllText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  historyList: {
    paddingBottom: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  historyItemScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 10,
  },
  historyItemDate: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
  },
  historyItemType: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 10,
  },
  historyItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyItemPerformance: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  subjectFilterList: {
    paddingBottom: 20,
  },
  subjectFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  subjectFilterItemSelected: {
    backgroundColor: '#e7f3ff',
  },
  subjectFilterText: {
    fontSize: 16,
    color: '#495057',
  },
  subjectFilterTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  noQuestionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noQuestionsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 20,
    marginBottom: 10,
  },
  noQuestionsSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  noInternetPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 1000,
  },
  noInternetText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  checkingLimitPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(0, 123, 255, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 1000,
  },
  checkingLimitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});