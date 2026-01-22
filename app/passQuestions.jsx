import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getQuestions } from "../database";
import Icon from "react-native-vector-icons/Ionicons";
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Markdown from 'react-native-markdown-display';

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
// Default API key for all users - REPLACE WITH YOUR ACTUAL API KEY
const DEFAULT_API_KEY = "sk-532fc5b9d3ce464c8a7cecc8dd05d329";
// Backend URL for subscription check - UPDATE THIS WITH YOUR BACKEND
const BACKEND_URL = "https://healthprof.com.ng/api";

// Loading messages sequence for AI assistance
const AI_LOADING_MESSAGES = [
  "Analyzing question...",
  "Evaluating answer options...",
  "Researching concepts...",
  "Preparing detailed explanation...",
  "Almost ready with analysis..."
];

// System prompt for detailed explanation
const SYSTEM_PROMPT = `You are an expert medical and healthcare education assistant. Your task is to explain exam questions in detail.

Provide analysis in this structure:
1. Question Analysis: What is being asked?
2. Options Breakdown: Explain each option (A, B, C, D)
3. Correct Answer: Why is this option correct?
4. Why Others Are Wrong: Explain misconceptions
5. Learning Points: Key takeaways

Use medical terminology appropriately. Be clear and educational.`;

const MINIMUM_AI_CHARS = 1000; // Minimum characters required for AI request

const shuffleArray = (array) => {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function PassQuestionScreen() {
  const [questions, setQuestions] = useState([]);
  const [questionId, setQuestionId] = useState(null);
  const [departments, setDepartments] = useState([]);
  // State for explanation visibility
  const [showExplanation, setShowExplanation] = useState({});
  // State for AI assistance
  const [aiExpanded, setAiExpanded] = useState({});
  const [aiResponses, setAiResponses] = useState({});
  const [loading, setLoading] = useState({});
  const [showNoInternet, setShowNoInternet] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const navigation = useNavigation();
  
  // AI Loading message state
  const [currentAiLoadingMessages, setCurrentAiLoadingMessages] = useState({});
  const [aiLoadingMessageIndices, setAiLoadingMessageIndices] = useState({});
  const aiLoadingIntervalsRef = useRef({});

  // User info and AI limit state
  const [userInfo, setUserInfo] = useState(null);
  const [aiLimit, setAiLimit] = useState(0);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const [aiUsageHistory, setAiUsageHistory] = useState({}); // Track usage per question

  // Refresh AI limit when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Re-check premium status when screen comes into focus
      checkPremiumStatus();
    }, [])
  );

  // Check premium status from AsyncStorage
  const checkPremiumStatus = async () => {
    try {
      const isActivated = await AsyncStorage.getItem('isActivated');
      console.log("Premium status from AsyncStorage:", isActivated);
      
      // Fix: Check if isActivated is the string "true"
      setIsPremiumUser(isActivated === 'true');
      
      // Also check if user has an account
      const savedUser = await AsyncStorage.getItem("userInfo");
      const user = savedUser ? JSON.parse(savedUser) : null;
      setUserInfo(user);
      
      if (user?.userId) {
        // If user is logged in, check their AI limit from backend
        await checkAiLimit(user.userId, 0, false);
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // First, check premium status
        await checkPremiumStatus();
        
        // Load multiple selected subjects from AsyncStorage
        const savedSubjects = await AsyncStorage.getItem("selectedSubjects");
        const selectedSubjects = savedSubjects ? JSON.parse(savedSubjects) : [];
        
        console.log("Selected subjects from storage:", selectedSubjects);
        
        // If no subjects selected, fallback to user's department
        if (selectedSubjects.length === 0) {
          const savedUser = await AsyncStorage.getItem("userInfo");
          const user = savedUser ? JSON.parse(savedUser) : null;
          selectedSubjects.push(user?.department || "Exam");
        }
        
        setDepartments(selectedSubjects);

        const storedQuestionId = await AsyncStorage.getItem("selectedQuestionId");
        setQuestionId(storedQuestionId);
        
        const rows = await getQuestions();
        
        console.log("Total questions in database:", rows.length);
        
        if (!storedQuestionId || rows.length === 0) {
          Alert.alert("Error", "No questions found");
          setIsLoading(false);
          return;
        }

        // Filter questions for all selected departments/subjects
        let allFilteredQuestions = [];
        
        console.log("Filtering questions for subjects:", selectedSubjects);
        
        selectedSubjects.forEach(subject => {
          // Try multiple matching strategies
          let filtered = [];
          
          // Strategy 1: Exact match with trim
          filtered = rows.filter(
            (q) => {
              const match = String(q.department).trim() === String(subject).trim() && 
                          String(q.questionId) === String(storedQuestionId);
              return match;
            }
          );
          
          // Strategy 2: Case-insensitive exact match
          if (filtered.length === 0) {
            filtered = rows.filter(
              (q) => {
                const match = String(q.department).trim().toLowerCase() === String(subject).trim().toLowerCase() && 
                            String(q.questionId) === String(storedQuestionId);
                return match;
              }
            );
          }
          
          // Strategy 3: Remove special characters and compare
          if (filtered.length === 0) {
            const cleanSubject = subject.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
            filtered = rows.filter(
              (q) => {
                const cleanDept = String(q.department).replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
                const match = cleanDept === cleanSubject && 
                            String(q.questionId) === String(storedQuestionId);
                return match;
              }
            );
          }
          
          // Strategy 4: Partial match (contains)
          if (filtered.length === 0) {
            const subjectLower = String(subject).toLowerCase().trim();
            filtered = rows.filter(
              (q) => {
                const deptLower = String(q.department).toLowerCase().trim();
                const match = deptLower.includes(subjectLower) && 
                            String(q.questionId) === String(storedQuestionId);
                return match;
              }
            );
          }
          
          console.log(`Found ${filtered.length} questions for subject: ${subject}`);
          allFilteredQuestions = [...allFilteredQuestions, ...filtered];
        });
        
        console.log("Total filtered questions from all subjects:", allFilteredQuestions.length);
        
        if (allFilteredQuestions.length === 0) {
          Alert.alert(
            "No Questions Found", 
            `No questions found for the selected subjects.\n\nSelected: ${selectedSubjects.join(", ")}\nQuestion Set: ${storedQuestionId}`,
            [{ text: "OK", onPress: () => navigation.goBack() }]
          );
          setIsLoading(false);
          return;
        }

        // Load ALL questions
        const questionsWithOptions = allFilteredQuestions.map(q => {
          const optionValues = [q.option1, q.option2, q.option3, q.option4];
          const shuffledValues = shuffleArray(optionValues);
          return { 
            ...q, 
            shuffledOptions: shuffledValues,
            subject: q.department
          };
        });

        const shuffledQs = shuffleArray(questionsWithOptions);
        setQuestions(shuffledQs);
        setTotalQuestions(shuffledQs.length);
      
      } catch (err) {
        console.error("Error loading questions:", err);
        Alert.alert("Error", "Failed to load questions: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Cleanup intervals on unmount
    return () => {
      Object.values(aiLoadingIntervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  // Check AI limit from backend
  const checkAiLimit = async (userId, usage = 0, showLoading = true) => {
    if (showLoading) {
      setIsCheckingLimit(true);
    }
    
    try {
      console.log(`Checking AI limit for user ${userId}, usage: ${usage}`);
      
      // First check internet connection
      const isConnected = await checkInternetConnection();
      if (!isConnected) {
        return {
          success: false,
          message: "No internet connection. Please check your connection and try again."
        };
      }
      
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
        const errorText = await response.text();
        console.error('Backend error:', errorText);
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
          deducted: data.deducted || false,
          usageDeducted: data.usage_deducted || 0
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
        message: "Failed to check subscription status. Please check your internet connection."
      };
    } finally {
      if (showLoading) {
        setIsCheckingLimit(false);
      }
    }
  };

  // Calculate total characters for AI request
  const calculateAiUsage = (prompt, aiResponse) => {
    // Calculate input characters: system prompt + user prompt
    const inputChars = SYSTEM_PROMPT.length + prompt.length;
    
    // Calculate output characters: AI response length
    const outputChars = aiResponse.length;
    
    // Total usage = input + output
    const totalChars = inputChars + outputChars;
    
    console.log(`AI Usage Calculation:
      System Prompt: ${SYSTEM_PROMPT.length} chars
      User Prompt: ${prompt.length} chars
      Input Total: ${inputChars} chars
      Output: ${outputChars} chars
      Total Usage: ${totalChars} chars`);
    
    return {
      inputChars,
      outputChars,
      totalChars
    };
  };

  // Start cycling AI loading messages for specific question
  const startAiLoadingMessages = (questionIndex) => {
    setCurrentAiLoadingMessages(prev => ({
      ...prev,
      [questionIndex]: AI_LOADING_MESSAGES[0]
    }));
    setAiLoadingMessageIndices(prev => ({
      ...prev,
      [questionIndex]: 0
    }));
    
    aiLoadingIntervalsRef.current[questionIndex] = setInterval(() => {
      setAiLoadingMessageIndices(prevIndices => {
        const currentIndex = prevIndices[questionIndex];
        const nextIndex = (currentIndex + 1) % AI_LOADING_MESSAGES.length;
        
        setCurrentAiLoadingMessages(prevMessages => ({
          ...prevMessages,
          [questionIndex]: AI_LOADING_MESSAGES[nextIndex]
        }));
        
        return {
          ...prevIndices,
          [questionIndex]: nextIndex
        };
      });
    }, 1500);
  };

  // Stop AI loading messages for specific question
  const stopAiLoadingMessages = (questionIndex) => {
    if (aiLoadingIntervalsRef.current[questionIndex]) {
      clearInterval(aiLoadingIntervalsRef.current[questionIndex]);
      delete aiLoadingIntervalsRef.current[questionIndex];
    }
    
    setCurrentAiLoadingMessages(prev => {
      const updated = { ...prev };
      delete updated[questionIndex];
      return updated;
    });
    
    setAiLoadingMessageIndices(prev => {
      const updated = { ...prev };
      delete updated[questionIndex];
      return updated;
    });
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

  const showAiLimitAlert = (currentLimit, requiredLimit = MINIMUM_AI_CHARS) => {
    Alert.alert(
      "Insufficient AI Credits",
      `You have ${currentLimit.toLocaleString()} AI characters remaining.\n\nMinimum required for AI analysis: ${requiredLimit.toLocaleString()} characters\n\nPlease purchase more credits to continue using AI assistance.`,
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

  const getCorrectOptionValue = (q) => {
    if (!q) return null;
    const optMap = {
      option1: q.option1,
      option2: q.option2,
      option3: q.option3,
      option4: q.option4,
    };
    const co = q.correct_option;
    if (!co) return null;
    if (optMap[co]) return optMap[co];
    const letter = String(co).toUpperCase();
    if (["A", "B", "C", "D"].includes(letter)) {
      const mapLetter = { A: "option1", B: "option2", C: "option3", D: "option4" };
      return optMap[mapLetter[letter]];
    }
    for (const k of Object.keys(optMap)) {
      if (optMap[k] === co) return co;
    }
    return q.option1;
  };

  const handleToggleExplanation = (questionId) => {
    setShowExplanation(prevState => ({
      ...prevState,
      [questionId]: !prevState[questionId]
    }));
  };

  const toggleAiExplanation = (questionIndex) => {
    setAiExpanded((prev) => ({ 
      ...prev, 
      [questionIndex]: !prev[questionIndex] 
    }));
  };

  const generateQuestionPrompt = (questionData, correctValue) => {
    const correctLetter = questionData.shuffledOptions.findIndex(opt => opt === correctValue);
    const letterMap = ['A', 'B', 'C', 'D'];
    
    return `Analyze this medical question:

SUBJECT: ${questionData.subject}

QUESTION: ${questionData.question}

OPTIONS:
A) ${questionData.shuffledOptions[0]}
B) ${questionData.shuffledOptions[1]}
C) ${questionData.shuffledOptions[2]}
D) ${questionData.shuffledOptions[3]}

CORRECT ANSWER: ${letterMap[correctLetter]}) ${correctValue}

Provide detailed explanation.`;
  };

  const isValidApiKey = (apiKey) => {
    if (!apiKey) return false;
    
    const isGenericPlaceholder = apiKey.includes("YOUR_API_KEY") || 
                                 apiKey.includes("example") ||
                                 (apiKey.includes("sk-") && apiKey.length < 30);
    
    return !isGenericPlaceholder;
  };

  const handleAiButtonPress = async (questionIndex, questionData) => {
    // STEP 1: Check internet connection FIRST
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setShowNoInternet(true);
      setTimeout(() => setShowNoInternet(false), 3000);
      return;
    }

    // STEP 2: Check if user has premium subscription (from AsyncStorage)
    if (!isPremiumUser) {
      showPremiumAlert();
      return;
    }

    // STEP 3: If AI response already exists, just toggle expansion
    if (aiResponses[questionIndex]) {
      toggleAiExplanation(questionIndex);
      return;
    }

    // STEP 4: Check if user is logged in
    if (!userInfo?.userId) {
      showLoginAlert();
      return;
    }

    // STEP 5: Check if API key is valid
    if (!isValidApiKey(DEFAULT_API_KEY)) {
      setAiResponses((prev) => ({
        ...prev,
        [questionIndex]: "AI feature requires a valid API key. Please contact support to set up the service."
      }));
      setAiExpanded((prev) => ({ ...prev, [questionIndex]: true }));
      return;
    }

    // STEP 6: Check AI limit - first just check without deducting
    const limitCheck = await checkAiLimit(userInfo.userId, 0, true);
    
    if (!limitCheck.success) {
      Alert.alert("Subscription Error", limitCheck.message || "Unable to verify subscription.");
      return;
    }
    
    if (!limitCheck.hasEnoughLimit) {
      showAiLimitAlert(limitCheck.aiLimit);
      return;
    }

    // STEP 7: All checks passed - Start AI analysis
    startAiLoadingMessages(questionIndex);
    await fetchAiExplanation(questionIndex, questionData);
  };

  const fetchAiExplanation = async (questionIndex, questionData) => {
    setLoading((prev) => ({ ...prev, [questionIndex]: true }));
    
    try {
      const correctValue = getCorrectOptionValue(questionData);
      const prompt = generateQuestionPrompt(questionData, correctValue);
      
      console.log("Sending request to DeepSeek API...");
      
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
      
      console.log("AI Response received, length:", aiResponse.length);
      
      // Calculate total characters used (input + output)
      const usage = calculateAiUsage(prompt, aiResponse);
      
      console.log(`Total characters to deduct: ${usage.totalChars}`);
      
      // Deduct AI usage from user's limit
      if (userInfo?.userId) {
        const deductionResult = await checkAiLimit(userInfo.userId, usage.totalChars, false);
        
        console.log("Deduction result:", deductionResult);
        
        if (deductionResult.success && deductionResult.deducted) {
          setAiLimit(deductionResult.aiLimit);
          
          // Store usage history for this question
          setAiUsageHistory(prev => ({
            ...prev,
            [questionIndex]: {
              inputChars: usage.inputChars,
              outputChars: usage.outputChars,
              totalChars: usage.totalChars,
              deducted: deductionResult.usageDeducted
            }
          }));
          
          // Show usage notification
          Alert.alert(
            "AI Usage Deducted ✅",
            `AI analysis used ${usage.totalChars.toLocaleString()} characters.\n\n📥 Input: ${usage.inputChars.toLocaleString()} chars\n📤 Output: ${usage.outputChars.toLocaleString()} chars\n\n💰 Remaining balance: ${deductionResult.aiLimit.toLocaleString()} characters`,
            [{ text: "OK" }]
          );
        } else if (deductionResult.success && !deductionResult.deducted) {
          // This shouldn't happen if we checked limit earlier, but handle it
          Alert.alert(
            "Credit Issue",
            deductionResult.message || "Unable to deduct credits. Please try again."
          );
          return;
        } else {
          // If deduction failed, show error
          Alert.alert(
            "Usage Error",
            deductionResult.message || "Failed to deduct AI credits. Please try again."
          );
          return;
        }
      }
      
      // Save AI response
      setAiResponses((prev) => ({
        ...prev,
        [questionIndex]: aiResponse
      }));
      
      setAiExpanded((prev) => ({ ...prev, [questionIndex]: true }));
      stopAiLoadingMessages(questionIndex);

    } catch (error) {
      console.error('AI Error:', error);
      setAiResponses((prev) => ({
        ...prev,
        [questionIndex]: "Unable to fetch AI explanation. Please try again later. Error: " + error.message
      }));
      setAiExpanded((prev) => ({ ...prev, [questionIndex]: true }));
      stopAiLoadingMessages(questionIndex);
    } finally {
      setLoading((prev) => ({ ...prev, [questionIndex]: false }));
    }
  };

  const getSubjectSummary = () => {
    if (departments.length === 0) return "Study Mode";
    if (departments.length === 1) return departments[0];
    if (departments.length === 2) return departments.join(" & ");
    if (departments.length === 3) return departments.slice(0, 2).join(", ") + " & " + departments[2];
    return `${departments.length} Subjects`;
  };
  
  const getQuestionDistribution = () => {
    const distribution = {};
    questions.forEach(q => {
      const subject = q.subject;
      distribution[subject] = (distribution[subject] || 0) + 1;
    });
    return distribution;
  };
  
  const renderHeader = () => {
    const questionDistribution = getQuestionDistribution();
    const distributionText = Object.entries(questionDistribution)
      .map(([subject, count]) => `${subject}: ${count}`)
      .join(" • ");
    
    return (
      <View style={styles.topHeader}>
        <View style={styles.headerTopRow}>
          <Text style={styles.topHeaderTitle}>STUDY MODE - {getSubjectSummary().toUpperCase()}</Text>
          {isPremiumUser && aiLimit > 0 && (
            <View style={styles.headerAiLimit}>
              <Icon name="server-outline" size={14} color="#28a745" />
              <Text style={styles.headerAiLimitText}>{aiLimit.toLocaleString()}</Text>
            </View>
          )}
        </View>
        <Text style={styles.topHeaderId}>Set: {questionId} • {totalQuestions} Questions</Text>
        {Object.keys(questionDistribution).length > 0 && (
          <View style={styles.distributionContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.distributionScroll}
            >
              <Text style={styles.distributionText}>{distributionText}</Text>
            </ScrollView>
          </View>
        )}
        {/* Show premium status and AI limit */}
        <View style={styles.premiumStatusContainer}>
          <Icon 
            name={isPremiumUser ? "shield-checkmark" : "lock-closed"} 
            size={14} 
            color={isPremiumUser ? "#28a745" : "#6c757d"} 
          />
          <Text style={[
            styles.premiumStatusText,
            { color: isPremiumUser ? "#28a745" : "#6c757d" }
          ]}>
            {isPremiumUser ? `Premium • ${aiLimit.toLocaleString()} chars` : "Free User"}
          </Text>
        </View>
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }
  
  if (questions.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <Icon name="alert-circle-outline" size={60} color="#6c757d" />
        <Text style={styles.noQuestionsText}>No questions found</Text>
        <Text style={styles.noQuestionsSubtext}>
          Could not find questions for: {departments.join(", ")}
        </Text>
        <Text style={styles.noQuestionsSubtext}>
          Question Set ID: {questionId}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderQuestion = ({ item, index }) => {
    const correctOptionValue = getCorrectOptionValue(item);
    const isAiLoading = loading[index];
    const aiResponse = aiResponses[index];
    const isAiExpanded = aiExpanded[index];
    const currentAiLoadingMessage = currentAiLoadingMessages[index];
    const questionUsage = aiUsageHistory[index];
    
    const options = ['A', 'B', 'C', 'D'].map((letter, i) => ({
      letter,
      value: item.shuffledOptions[i],
    }));

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Q{index + 1}</Text>
          <View style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>{item.subject}</Text>
          </View>
          {/* Show usage for this question if available */}
          {questionUsage && (
            <View style={styles.usageBadge}>
              <Icon name="pricetag-outline" size={12} color="#6c757d" />
              <Text style={styles.usageBadgeText}>{questionUsage.totalChars}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.questionSection}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {item.question}
            </Text>
          </View>

          {options.map((opt) => (
            <View
              key={opt.letter}
              style={[
                styles.option,
                opt.value === correctOptionValue && styles.correctOption,
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLetter}>{opt.letter})</Text>
                <Text style={styles.optionValue}>{opt.value}</Text>
                {opt.value === correctOptionValue && (
                  <Icon name="checkmark-circle" size={20} color="green" style={styles.checkmarkIcon} />
                )}
              </View>
            </View>
          ))}

          {/* Manual Explanation Button */}
          <TouchableOpacity
            style={styles.showExplanationBtn}
            onPress={() => handleToggleExplanation(item.id)}
          >
            <Icon 
              name={showExplanation[item.id] ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.showExplanationText}>
              {showExplanation[item.id] ? "Hide Explanation" : "Show Explanation"}
            </Text>
          </TouchableOpacity>

          {showExplanation[item.id] && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationText}>
                <Text style={{fontWeight: 'bold'}}>Explanation:</Text> {item.description}
              </Text>
            </View>
          )}

          {/* AI Assistance Button */}
          <TouchableOpacity
            style={[
              styles.aiButton,
              !isPremiumUser && styles.aiButtonDisabled,
              (isCheckingLimit || isAiLoading) && styles.aiButtonLoading
            ]}
            onPress={() => handleAiButtonPress(index, item)}
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
              {isAiLoading ? (currentAiLoadingMessage || "Loading AI...") : 
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

          {/* AI Loading Message Display */}
          {isAiLoading && (
            <View style={styles.aiLoadingMessageContainer}>
              <View style={styles.aiLoadingMessage}>
                <ActivityIndicator size="small" color="#6f42c1" style={styles.aiLoadingSpinner} />
                <View style={styles.aiLoadingTextContainer}>
                  <Text style={styles.aiLoadingMessageText}>
                    {currentAiLoadingMessage}
                  </Text>
                  <View style={styles.aiLoadingDots}>
                    <View style={[styles.aiLoadingDot, styles.aiDot1]} />
                    <View style={[styles.aiLoadingDot, styles.aiDot2]} />
                    <View style={[styles.aiLoadingDot, styles.aiDot3]} />
                  </View>
                </View>
              </View>
            </View>
          )}

          {isAiExpanded && aiResponse && !isAiLoading && (
            <View style={styles.aiResponseContainer}>
              <View style={styles.aiHeader}>
                <Icon name="brain" size={18} color="#6f42c1" />
                <Text style={styles.aiHeaderText}>AI-Powered Analysis</Text>
                {questionUsage && (
                  <View style={styles.aiUsageInfo}>
                    <Icon name="stats-chart-outline" size={12} color="#6c757d" />
                    <Text style={styles.aiUsageInfoText}>
                      Used: {questionUsage.totalChars} chars
                    </Text>
                  </View>
                )}
              </View>
              <Markdown style={markdownStyles}>
                {aiResponse}
              </Markdown>
              {/* Show detailed usage info */}
              {questionUsage && (
                <View style={styles.usageDetails}>
                  <Text style={styles.usageDetailsText}>
                    📥 Input: {questionUsage.inputChars} chars • 
                    📤 Output: {questionUsage.outputChars} chars • 
                    💰 Total: {questionUsage.totalChars} chars
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {renderHeader()}
      
      <FlatList
        data={questions}
        keyExtractor={(item, index) => `${item.id}_${index}_${item.subject}`}
        renderItem={renderQuestion}
        contentContainerStyle={{ paddingBottom: 20 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

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
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#495057', 
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  heading1: { fontSize: 18, fontWeight: 'bold', marginVertical: 8, color: '#333' },
  heading2: { fontSize: 16, fontWeight: 'bold', marginVertical: 6, color: '#333' },
  heading3: { fontSize: 14, fontWeight: 'bold', marginVertical: 4, color: '#333' },
  strong: { fontWeight: 'bold' },
  list_item: {
    marginBottom: 4,
    lineHeight: 20,
  },
  link: { color: '#007bff' },
  code_inline: { backgroundColor: '#e6d9ff', paddingHorizontal: 4, borderRadius: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  code_block: { backgroundColor: '#e6d9ff', padding: 10, borderRadius: 6, marginVertical: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  noQuestionsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 20,
    marginBottom: 10,
  },
  noQuestionsSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  topHeader: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
    flex: 1,
  },
  headerAiLimit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  headerAiLimitText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '600',
  },
  premiumStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 5,
  },
  premiumStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  topHeaderId: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  distributionContainer: {
    width: '100%',
    marginTop: 8,
  },
  distributionScroll: {
    maxHeight: 30,
  },
  distributionText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    paddingHorizontal: 5,
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
  },
  subjectBadge: {
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  subjectBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  usageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
    gap: 3,
  },
  usageBadgeText: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '600',
  },
  questionSection: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
  },
  questionContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  option: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  correctOption: {
    borderColor: "green",
    backgroundColor: "#e8f5e9",
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 5,
  },
  optionValue: {
    flex: 1,
    fontSize: 15,
    marginRight: 10,
  },
  checkmarkIcon: {
    marginLeft: 'auto',
  },
  showExplanationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  showExplanationText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  explanationContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  explanationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6f42c1',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
    gap: 8,
  },
  aiButtonDisabled: {
    backgroundColor: "#e9ecef",
    borderColor: "#dee2e6",
    borderWidth: 1,
  },
  aiButtonLoading: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  aiButtonTextDisabled: {
    color: "#6c757d",
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
  loadingIndicator: {
    marginLeft: 8,
  },
  // AI Loading Message Styles
  aiLoadingMessageContainer: {
    marginTop: 10,
  },
  aiLoadingMessage: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9c7ff',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiLoadingSpinner: {
    marginRight: 10,
  },
  aiLoadingTextContainer: {
    flex: 1,
  },
  aiLoadingMessageText: {
    fontSize: 13,
    color: '#6f42c1',
    fontWeight: '500',
    marginBottom: 4,
  },
  aiLoadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 2,
  },
  aiLoadingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6f42c1',
    marginHorizontal: 2,
  },
  aiDot1: {
    opacity: 0.4,
  },
  aiDot2: {
    opacity: 0.6,
    marginLeft: 4,
  },
  aiDot3: {
    opacity: 0.8,
    marginLeft: 4,
  },
  // AI Response Styles
  aiResponseContainer: {
    marginTop: 10,
    backgroundColor: '#f3edff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#d9c7ff',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6d9ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d9c7ff',
    gap: 8,
  },
  aiHeaderText: {
    color: '#6f42c1',
    fontWeight: '600',
    fontSize: 14,
    flex: 1,
  },
  aiUsageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111, 66, 193, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  aiUsageInfoText: {
    color: '#6c757d',
    fontSize: 10,
    fontWeight: '600',
  },
  usageDetails: {
    backgroundColor: 'rgba(111, 66, 193, 0.05)',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#d9c7ff',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  usageDetailsText: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  noInternetPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(220, 53, 69, 0.9)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    zIndex: 1000,
  },
  noInternetText: {
    color: "#fff",
    fontWeight: "600",
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