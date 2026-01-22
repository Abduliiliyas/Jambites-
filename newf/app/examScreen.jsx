// examScreen.jsx
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Modal,
  ToastAndroid,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getQuestions } from "../database";
import { saveResult } from "../simple_database";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRoute } from '@react-navigation/native';
import Markdown from "react-native-markdown-display";

const { width } = Dimensions.get('window');

const shuffleArray = (array) => {
  if (!array) return [];
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const CustomAlertModal = ({
  isVisible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmStyle,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={!!isVisible}
      onRequestClose={onCancel}
    >
      <View style={modalStyles.centeredView}>
        <View style={modalStyles.modalView}>
          <Text style={modalStyles.modalTitle}>{title}</Text>
          <Text style={modalStyles.modalText}>{message}</Text>
          <View style={modalStyles.modalButtons}>
            {cancelText ? (
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={modalStyles.cancelTextStyle}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[modalStyles.button, confirmStyle]}
              onPress={onConfirm}
            >
              <Text style={modalStyles.textStyle}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ExamScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [questionsBySubject, setQuestionsBySubject] = useState({});
  const [currentSubject, setCurrentSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examTime, setExamTime] = useState(0);
  const [questionId, setQuestionId] = useState(null);
  const [examType, setExamType] = useState("");
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("Loading questions...");
  const [answeredCounts, setAnsweredCounts] = useState({});
  const [totalQuestionsBySubject, setTotalQuestionsBySubject] = useState({});
  const [autoSwitching, setAutoSwitching] = useState(false);
  const [loadedSubjects, setLoadedSubjects] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [timerStarted, setTimerStarted] = useState(false);

  const timerRef = useRef(null);
  const backHandlerRef = useRef(null);
  const initialLoadRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
      swipeEnabled: false,
    });
  }, [navigation]);

  const parseExamTime = (saved) => {
    if (!saved) return 30;
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed === "number") return parsed;
      if (typeof parsed === "object" && parsed.timeLimit) return Number(parsed.timeLimit) || 30;
      if (typeof parsed === "string") return Number(parsed) || 30;
    } catch {
      const n = Number(saved);
      return isFinite(n) ? n : 30;
    }
    return 30;
  };

  const isEnglishSubject = useCallback((subjectName) => {
    const englishKeywords = ['english', 'english language', 'eng'];
    return englishKeywords.some(keyword => 
      subjectName.toLowerCase().includes(keyword)
    );
  }, []);

  // Load exam data
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadExamData = async () => {
      try {
        setLoading(true);
        setLoadingProgress("Loading exam settings...");
        
        // Check if we're in quiz mode by looking for quizQ in route params
        const quizQuestions = route.params?.quizQ;
        
        if (quizQuestions && Array.isArray(quizQuestions)) {
          // QUIZ MODE: Load quiz questions from route params
          console.log("🎯 QUIZ MODE: Loading quiz questions from route params");
          setIsQuizMode(true);
          
          const savedTime = await AsyncStorage.getItem("examTime");
          const examTimeMinutes = parseExamTime(savedTime);
          setExamTime(examTimeMinutes);
          setTimeLeft(examTimeMinutes * 60);
          
          // Get quiz title from storage
          const title = await AsyncStorage.getItem("title") || "Quiz";
          setQuizTitle(title);
          
          // For quiz mode, we have a single "subject" which is the quiz
          const quizSubject = "Quiz";
          setSubjects([quizSubject]);
          setQuestionId('quiz');
          setExamType("quiz");
          
          // Process quiz questions
          await loadQuizQuestions(quizQuestions, quizSubject);
          
        } else {
          // NORMAL MODE: Load regular exam questions
          console.log("📚 NORMAL MODE: Loading regular exam questions");
          setIsQuizMode(false);
          
          const savedExamType = await AsyncStorage.getItem("examType");
          const savedTime = await AsyncStorage.getItem("examTime");
          const examTimeMinutes = parseExamTime(savedTime);
          setExamTime(examTimeMinutes);
          setTimeLeft(examTimeMinutes * 60);
          setExamType(savedExamType || "partial");
          
          const selectedSubjectsStr = await AsyncStorage.getItem("selectedSubjects");
          const storedQuestionId = await AsyncStorage.getItem("selectedQuestionId");
          
          if (!selectedSubjectsStr) {
            Alert.alert("Error", "No subjects selected");
            navigation.goBack();
            return;
          }
          
          const selectedSubjects = JSON.parse(selectedSubjectsStr);
          console.log("📚 Selected subjects:", selectedSubjects);
          console.log("🔢 Question ID:", storedQuestionId);
          
          setSubjects(selectedSubjects);
          setQuestionId(storedQuestionId);
          
          // Load questions for all selected subjects
          await loadAllQuestions(selectedSubjects, storedQuestionId, savedExamType);
        }
        
      } catch (err) {
        console.error("Error loading exam:", err);
        Alert.alert("Error", "Failed to load exam data");
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
    
    backHandlerRef.current = BackHandler.addEventListener("hardwareBackPress", handleQuitConfirm);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (backHandlerRef.current) {
        backHandlerRef.current.remove();
        backHandlerRef.current = null;
      }
      initialLoadRef.current = false;
    };
  }, [navigation, route.params]);

  // Start timer when examTime is set
  useEffect(() => {
    if (examTime > 0 && !timerStarted) {
      startTimer(examTime * 60);
      setTimerStarted(true);
    }
  }, [examTime, timerStarted]);

  // NEW: Function to load quiz questions
  const loadQuizQuestions = async (quizQuestions, quizSubject) => {
    try {
      setLoadingProgress("Setting up your quiz...");
      
      console.log("🎯 Loading quiz questions:", quizQuestions.length);
      
      // Transform quiz questions to match our question format
      const transformedQuestions = quizQuestions.map((q, index) => ({
        id: q.id || `quiz_q_${index}`,
        questionId: 'quiz',
        department: quizSubject,
        subject: quizSubject,
        question: q.question,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4,
        correct_option: q.correct_option,
        isEnglish: false,
        description: q.description || ""
      }));
      
      const allQuestionsArray = transformedQuestions;
      const questionsBySubjectObj = {};
      const answeredCountsObj = {};
      const totalQuestionsBySubjectObj = {};
      const loadedSubjectsList = [quizSubject];
      
      // For quiz mode, we only have one subject
      questionsBySubjectObj[quizSubject] = transformedQuestions;
      answeredCountsObj[quizSubject] = 0;
      totalQuestionsBySubjectObj[quizSubject] = transformedQuestions.length;
      
      setAllQuestions(allQuestionsArray);
      setQuestionsBySubject(questionsBySubjectObj);
      setAnsweredCounts(answeredCountsObj);
      setTotalQuestionsBySubject(totalQuestionsBySubjectObj);
      setLoadedSubjects(loadedSubjectsList);
      setCurrentSubject(quizSubject);
      
      // Shuffle options for the first question
      if (transformedQuestions.length > 0) {
        shuffleOptionsForQuestion(transformedQuestions[0]);
      }
      
      console.log(`✅ Quiz loaded: ${transformedQuestions.length} questions`);
      
    } catch (err) {
      console.error("Error loading quiz questions:", err);
      Alert.alert("Error", "Failed to load quiz questions");
      throw err;
    }
  };

  const loadAllQuestions = async (selectedSubjects, storedQuestionId, examType) => {
    try {
      setLoadingProgress("Setting up your exam...");
      const rows = await getQuestions();
      
      console.log("=== DATABASE DEBUG INFO ===");
      console.log("Total questions in database:", rows.length);
      
      if (rows.length === 0) {
        console.error("Database is empty!");
        Alert.alert("Error", "No questions found in database");
        return;
      }
      
      // Show sample data
      console.log("Sample of questions (first 5):");
      rows.slice(0, 5).forEach((q, i) => {
        console.log(`  ${i+1}. ID: ${q.id}, QID: "${q.questionId}", Dept: "${q.department}", Q: ${q.question?.substring(0, 30)}...`);
      });
      
      // Get all unique departments and questionIds
      const allDepartments = [...new Set(rows.map(q => q.department).filter(Boolean))];
      const allQuestionIds = [...new Set(rows.map(q => q.questionId).filter(Boolean))];
      
      console.log("Unique departments:", allDepartments);
      console.log("Unique question IDs:", allQuestionIds);
      
      const allQuestionsArray = [];
      const questionsBySubjectObj = {};
      const answeredCountsObj = {};
      const totalQuestionsBySubjectObj = {};
      const loadedSubjectsList = [];
      
      selectedSubjects.forEach((subject) => {
        console.log(`\n🔍 Searching for subject: "${subject}"`);
        
        // Try multiple matching strategies
        let filtered = [];
        
        // Strategy 1: Exact department match with questionId
        filtered = rows.filter(
          q => q.department === subject && String(q.questionId) === String(storedQuestionId)
        );
        
        console.log(`  Exact match: ${filtered.length} questions`);
        
        // Strategy 2: Case-insensitive department match
        if (filtered.length === 0) {
          filtered = rows.filter(
            q => q.department?.toLowerCase() === subject.toLowerCase() && 
                 String(q.questionId) === String(storedQuestionId)
          );
          console.log(`  Case-insensitive match: ${filtered.length} questions`);
        }
        
        // Strategy 3: Partial department match
        if (filtered.length === 0) {
          filtered = rows.filter(
            q => q.department?.toLowerCase().includes(subject.toLowerCase()) && 
                 String(q.questionId) === String(storedQuestionId)
          );
          console.log(`  Partial match: ${filtered.length} questions`);
        }
        
        // Strategy 4: Find any matching department first, then filter by questionId
        if (filtered.length === 0) {
          const matchingDepts = allDepartments.filter(dept => 
            dept?.toLowerCase().includes(subject.toLowerCase()) ||
            subject.toLowerCase().includes(dept?.toLowerCase())
          );
          
          console.log(`  Similar departments found: ${matchingDepts.join(', ')}`);
          
          matchingDepts.forEach(dept => {
            const deptQuestions = rows.filter(
              q => q.department === dept && String(q.questionId) === String(storedQuestionId)
            );
            if (deptQuestions.length > 0) {
              console.log(`  Found ${deptQuestions.length} questions in department "${dept}"`);
              filtered.push(...deptQuestions);
            }
          });
        }
        
        // Strategy 5: Try without questionId filter if still no results
        if (filtered.length === 0) {
          console.log("  Trying without questionId filter...");
          filtered = rows.filter(
            q => q.department === subject
          );
          
          if (filtered.length > 0) {
            console.log(`  Found ${filtered.length} questions without questionId filter`);
            const availableQuestionIds = [...new Set(filtered.map(q => q.questionId))];
            console.log(`  Available questionIds: ${availableQuestionIds.join(', ')}`);
            
            // Use questions with the most common questionId
            const questionIdCounts = {};
            filtered.forEach(q => {
              const qid = String(q.questionId);
              questionIdCounts[qid] = (questionIdCounts[qid] || 0) + 1;
            });
            
            const mostCommonQuestionId = Object.keys(questionIdCounts).reduce((a, b) => 
              questionIdCounts[a] > questionIdCounts[b] ? a : b
            );
            
            console.log(`  Most common questionId: ${mostCommonQuestionId}`);
            
            filtered = filtered.filter(q => String(q.questionId) === mostCommonQuestionId);
            console.log(`  Using ${filtered.length} questions with questionId ${mostCommonQuestionId}`);
          }
        }
        
        let questionsToUse = [];
        
        if (filtered.length > 0) {
          if (examType === "full") {
            if (isEnglishSubject(subject)) {
              const shuffled = shuffleArray(filtered);
              questionsToUse = shuffled.slice(0, Math.min(60, shuffled.length));
              console.log(`  Using ${questionsToUse.length} English questions (full exam)`);
            } else {
              const shuffled = shuffleArray(filtered);
              questionsToUse = shuffled.slice(0, Math.min(40, shuffled.length));
              console.log(`  Using ${questionsToUse.length} questions (full exam)`);
            }
          } else {
            if (isEnglishSubject(subject)) {
              const shuffled = shuffleArray(filtered);
              questionsToUse = shuffled.slice(0, Math.min(20, shuffled.length));
              console.log(`  Using ${questionsToUse.length} English questions (practice)`);
            } else {
              const shuffled = shuffleArray(filtered);
              questionsToUse = shuffled.slice(0, Math.min(10, shuffled.length));
              console.log(`  Using ${questionsToUse.length} questions (practice)`);
            }
          }
          
          const questionsWithSubject = questionsToUse.map(q => ({
            ...q,
            subject: subject,
            isEnglish: isEnglishSubject(subject)
          }));
          
          allQuestionsArray.push(...questionsWithSubject);
          questionsBySubjectObj[subject] = questionsWithSubject;
          answeredCountsObj[subject] = 0;
          totalQuestionsBySubjectObj[subject] = questionsWithSubject.length;
          loadedSubjectsList.push(subject);
          
          console.log(`  ✅ Successfully loaded ${questionsWithSubject.length} questions for "${subject}"`);
        } else {
          console.warn(`  ❌ No questions found for "${subject}"`);
          console.log(`  Trying to find what's available...`);
          
          // Show what departments and questionIds are available
          const availableForSubject = rows.filter(q => 
            q.department?.toLowerCase().includes(subject.toLowerCase()) ||
            subject.toLowerCase().includes(q.department?.toLowerCase())
          );
          
          if (availableForSubject.length > 0) {
            const availableDepts = [...new Set(availableForSubject.map(q => q.department))];
            const availableQIds = [...new Set(availableForSubject.map(q => q.questionId))];
            console.log(`  Found in similar departments: ${availableDepts.join(', ')}`);
            console.log(`  Available questionIds: ${availableQIds.join(', ')}`);
          } else {
            console.log(`  No similar departments found for "${subject}"`);
          }
          
          questionsBySubjectObj[subject] = [];
          answeredCountsObj[subject] = 0;
          totalQuestionsBySubjectObj[subject] = 0;
        }
      });
      
      console.log("\n=== LOADING SUMMARY ===");
      console.log("Loaded subjects with questions:", loadedSubjectsList);
      console.log("Total questions loaded:", allQuestionsArray.length);
      
      Object.keys(questionsBySubjectObj).forEach(key => {
        console.log(`  "${key}": ${questionsBySubjectObj[key].length} questions`);
      });
      
      setAllQuestions(allQuestionsArray);
      setQuestionsBySubject(questionsBySubjectObj);
      setAnsweredCounts(answeredCountsObj);
      setTotalQuestionsBySubject(totalQuestionsBySubjectObj);
      setLoadedSubjects(loadedSubjectsList);
      
      // Set current subject to first subject that has questions
      if (loadedSubjectsList.length > 0) {
        const firstSubjectWithQuestions = loadedSubjectsList[0];
        setCurrentSubject(firstSubjectWithQuestions);
        const firstSubjectQuestions = questionsBySubjectObj[firstSubjectWithQuestions] || [];
        if (firstSubjectQuestions.length > 0) {
          shuffleOptionsForQuestion(firstSubjectQuestions[0]);
        }
        console.log(`🎯 Current subject set to: "${firstSubjectWithQuestions}"`);
      } else {
        console.error("❌ No subjects have questions!");
        
        // Show helpful error
        Alert.alert(
          "No Questions Found", 
          `No questions found for the selected subjects with question ID: ${storedQuestionId}\n\n` +
          `Please check:\n` +
          `1. The subject names match exactly\n` +
          `2. Questions exist for this question ID\n` +
          `3. The database has been populated with questions`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
      
    } catch (err) {
      console.error("Error loading questions:", err);
      Alert.alert("Error", "Failed to load questions from database");
      throw err;
    }
  };

  // Update answered counts whenever answers change
  useEffect(() => {
    if (currentSubject && questionsBySubject[currentSubject]) {
      const answeredCount = questionsBySubject[currentSubject].filter(
        q => answers[q.id]
      ).length;
      
      setAnsweredCounts(prev => ({
        ...prev,
        [currentSubject]: answeredCount
      }));
    }
  }, [answers, currentSubject, questionsBySubject]);

  // When current subject or question index changes, shuffle options for the new question
  useEffect(() => {
    if (currentSubject && questionsBySubject[currentSubject]) {
      const currentSubjectQuestions = questionsBySubject[currentSubject] || [];
      const currentQ = currentSubjectQuestions[currentQuestionIndex];
      if (currentQ) {
        shuffleOptionsForQuestion(currentQ);
      }
    }
  }, [currentSubject, currentQuestionIndex, questionsBySubject]);

  // Auto-switch to next subject if current subject has no questions
  useEffect(() => {
    const findNextSubjectWithQuestions = () => {
      if (!currentSubject || !loadedSubjects.length || autoSwitching) return;
      
      const currentSubjectQuestions = questionsBySubject[currentSubject] || [];
      if (currentSubjectQuestions.length === 0 && loadedSubjects.length > 0) {
        setAutoSwitching(true);
        
        const currentIndex = loadedSubjects.indexOf(currentSubject);
        let nextIndex = currentIndex;
        
        // Find next subject with questions
        for (let i = 1; i <= loadedSubjects.length; i++) {
          nextIndex = (currentIndex + i) % loadedSubjects.length;
          const nextSubject = loadedSubjects[nextIndex];
          const nextSubjectQuestions = questionsBySubject[nextSubject] || [];
          if (nextSubjectQuestions.length > 0) {
            setCurrentSubject(nextSubject);
            setCurrentQuestionIndex(0);
            break;
          }
        }
        
        setTimeout(() => {
          setAutoSwitching(false);
        }, 100);
      }
    };

    findNextSubjectWithQuestions();
  }, [currentSubject, loadedSubjects, questionsBySubject, autoSwitching]);

  const getCurrentSubjectIndex = useCallback(() => {
    return loadedSubjects.indexOf(currentSubject);
  }, [currentSubject, loadedSubjects]);

  const getCurrentSubjectQuestions = useCallback(() => {
    return questionsBySubject[currentSubject] || [];
  }, [currentSubject, questionsBySubject]);

  const formatTime = useCallback((sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, []);

  const formatMinutes = useCallback((sec) => `${Math.floor(sec / 60)} min ${sec % 60}s`, []);

  const shuffleOptionsForQuestion = useCallback((question) => {
    if (!question) return;
    const optKeys = ["option1", "option2", "option3", "option4"];
    const opts = optKeys.map((k) => ({ key: k, value: question[k] }));
    const shuffled = shuffleArray(opts).map((o, i) => ({
      letter: String.fromCharCode(65 + i),
      key: o.key,
      value: o.value,
    }));
    setShuffledOptions(shuffled);
  }, []);

  const handleSelect = useCallback((qid, optionValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: optionValue }));
  }, []);

  const switchSubject = useCallback((subjectName) => {
    if (subjectName === currentSubject || !loadedSubjects.includes(subjectName)) return;
    
    setCurrentSubject(subjectName);
    setCurrentQuestionIndex(0);
    
    const subjectQuestions = questionsBySubject[subjectName] || [];
    if (subjectQuestions.length > 0) {
      shuffleOptionsForQuestion(subjectQuestions[0]);
    }
  }, [currentSubject, loadedSubjects, questionsBySubject, shuffleOptionsForQuestion]);

  const goToNextSubject = useCallback(() => {
    const currentIndex = loadedSubjects.indexOf(currentSubject);
    if (currentIndex < loadedSubjects.length - 1) {
      const nextSubject = loadedSubjects[currentIndex + 1];
      switchSubject(nextSubject);
    }
  }, [currentSubject, loadedSubjects, switchSubject]);

  const goToPreviousSubject = useCallback(() => {
    const currentIndex = loadedSubjects.indexOf(currentSubject);
    if (currentIndex > 0) {
      const prevSubject = loadedSubjects[currentIndex - 1];
      switchSubject(prevSubject);
    }
  }, [currentSubject, loadedSubjects, switchSubject]);

  const confirmSubmit = useCallback(() => setShowSubmitModal(true), []);

  const handleQuitConfirm = useCallback(() => {
    setShowQuitModal(true);
    return true;
  }, []);

  const handleQuit = useCallback(() => {
    setShowQuitModal(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (backHandlerRef.current) {
      backHandlerRef.current.remove();
      backHandlerRef.current = null;
    }
    
    // Navigate back appropriately based on mode
    if (isQuizMode) {
      navigation.navigate("startQuiz");
    } else {
      navigation.navigate("CBT");
    }
  }, [navigation, isQuizMode]);

  const handleCancelQuit = useCallback(() => setShowQuitModal(false), []);

  const getCorrectOptionValue = useCallback((q) => {
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
  }, []);

  const startTimer = useCallback((seconds) => {
    console.log("🕒 Starting timer with", seconds, "seconds");
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Set initial time
    setTimeLeft(seconds);

    // Start the timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        console.log("🕒 Timer tick:", prev, "seconds left");
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          autoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const autoSubmit = useCallback(() => {
    console.log("⏰ Time's up! Auto-submitting...");
    if (Platform.OS === "android") {
      ToastAndroid.show("⏰ Time up!", ToastAndroid.LONG);
    } else {
      Alert.alert("⏰ Time up!");
    }
    setShowTimeUpModal(true);
    
    // Auto-submit after showing the modal
    setTimeout(() => {
      handleSubmit();
    }, 2000);
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log("📤 Submitting exam...");
    setShowSubmitModal(false);
    setShowTimeUpModal(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (backHandlerRef.current) {
      backHandlerRef.current.remove();
      backHandlerRef.current = null;
    }
    
    try {
      await finalizeSubmission(answers);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      Alert.alert("Error", "Failed to submit exam. Please try again.");
    }
  }, [answers, isQuizMode]);

  const finalizeSubmission = useCallback(async (finalAnswers) => {
    console.log("📊 Finalizing submission...");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (backHandlerRef.current) {
      backHandlerRef.current.remove();
      backHandlerRef.current = null;
    }

    const totalQuestions = allQuestions.length;
    const answered = Object.keys(finalAnswers).length;
    let totalCorrect = 0;

    // Calculate results by subject
    const subjectResults = {};
    const subjectAnalysis = {};

    loadedSubjects.forEach(subject => {
      const subjectQuestions = questionsBySubject[subject] || [];
      const totalForSubject = subjectQuestions.length;
      let correctForSubject = 0;
      let answeredForSubject = 0;

      if (subjectQuestions.length > 0) {
        subjectQuestions.forEach(q => {
          const correctValue = getCorrectOptionValue(q);
          if (finalAnswers[q.id]) {
            answeredForSubject++;
            if (finalAnswers[q.id] === correctValue) {
              correctForSubject++;
              totalCorrect++;
            }
          }
        });

        const percentageForSubject = totalForSubject > 0 ? 
          ((correctForSubject / totalForSubject) * 100).toFixed(2) : "0.00";
        
        const accuracy = totalForSubject > 0 ? 
          ((correctForSubject / totalForSubject) * 100).toFixed(1) : 0;
        
        const attemptRate = totalForSubject > 0 ? 
          ((answeredForSubject / totalForSubject) * 100).toFixed(1) : 0;

        // Determine subject performance
        let subjectPerformance = "Poor";
        const pct = Number(percentageForSubject);
        if (pct >= 80) subjectPerformance = "Excellent";
        else if (pct >= 70) subjectPerformance = "Very Good";
        else if (pct >= 60) subjectPerformance = "Good";
        else if (pct >= 50) subjectPerformance = "Average";
        else if (pct >= 40) subjectPerformance = "Below Average";

        // Analyze strengths and weaknesses
        let analysis = "";
        if (pct >= 80) {
          analysis = "Excellent performance! You have mastered this subject.";
        } else if (pct >= 70) {
          analysis = "Very good performance. Keep practicing to reach excellence.";
        } else if (pct >= 60) {
          analysis = "Good performance. Focus on weaker areas to improve.";
        } else if (pct >= 50) {
          analysis = "Average performance. Needs more focused study and practice.";
        } else if (pct >= 40) {
          analysis = "Below average. Consider revising the fundamentals.";
        } else {
          analysis = "Needs significant improvement. Review basic concepts thoroughly.";
        }

        // Determine if this is a strength or weakness
        const isStrength = pct >= 70;
        const isWeakness = pct < 50;

        subjectResults[subject] = {
          total: totalForSubject,
          answered: answeredForSubject,
          correct: correctForSubject,
          percentage: percentageForSubject,
          performance: subjectPerformance,
          accuracy: accuracy,
          attemptRate: attemptRate,
          analysis: analysis,
          isStrength: isStrength,
          isWeakness: isWeakness,
          score: correctForSubject
        };

        subjectAnalysis[subject] = {
          totalQuestions: totalForSubject,
          attempted: answeredForSubject,
          correctAnswers: correctForSubject,
          wrongAnswers: answeredForSubject - correctForSubject,
          skipped: totalForSubject - answeredForSubject,
          accuracy: `${accuracy}%`,
          attemptRate: `${attemptRate}%`,
          performance: subjectPerformance,
          recommendation: analysis
        };
      }
    });

    const percentage = totalQuestions > 0 ? 
      ((totalCorrect / totalQuestions) * 100).toFixed(2) : "0.00";

    let overallPerformance = "Failed. Need Improvement!!";
    const pct = Number(percentage);
    if (pct >= 80) overallPerformance = "Excellent";
    else if (pct >= 70) overallPerformance = "Very Good";
    else if (pct >= 60) overallPerformance = "Good";
    else if (pct >= 50) overallPerformance = "Average";
    else if (pct >= 40) overallPerformance = "Below Average";

    const timeTakenSeconds = examTime * 60 - timeLeft;
    const answeredQuestions = allQuestions.map((q) => ({
      ...q,
      selectedAnswer: finalAnswers[q.id] || null,
      isCorrect: finalAnswers[q.id] === getCorrectOptionValue(q)
    }));

    // Calculate overall statistics
    const overallStats = {
      totalQuestions: totalQuestions,
      attemptedQuestions: answered,
      correctAnswers: totalCorrect,
      wrongAnswers: answered - totalCorrect,
      skippedQuestions: totalQuestions - answered,
      overallAccuracy: `${percentage}%`,
      timePerQuestion: timeTakenSeconds > 0 ? 
        (timeTakenSeconds / totalQuestions).toFixed(1) : 0,
      speed: timeTakenSeconds > 0 ? 
        (answered / (timeTakenSeconds / 60)).toFixed(1) : 0
    };

    // Identify strengths and weaknesses
    const strengths = Object.entries(subjectResults)
      .filter(([_, result]) => result.isStrength)
      .map(([subject, _]) => subject);

    const weaknesses = Object.entries(subjectResults)
      .filter(([_, result]) => result.isWeakness)
      .map(([subject, _]) => subject);

    // Calculate average scores
    const subjectPercentages = Object.values(subjectResults).map(r => Number(r.percentage));
    const averageSubjectScore = subjectPercentages.length > 0 ?
      (subjectPercentages.reduce((a, b) => a + b, 0) / subjectPercentages.length).toFixed(1) : 0;

    // Determine overall recommendation
    let overallRecommendation = "";
    if (pct >= 80) {
      overallRecommendation = "Outstanding performance! You are well prepared.";
    } else if (pct >= 70) {
      overallRecommendation = "Very good overall performance. Focus on maintaining consistency.";
    } else if (pct >= 60) {
      overallRecommendation = "Good performance. Work on identified weaknesses to improve.";
    } else if (pct >= 50) {
      overallRecommendation = "Average performance. Needs balanced improvement across all subjects.";
    } else if (pct >= 40) {
      overallRecommendation = "Below average. Requires focused study and more practice sessions.";
    } else {
      overallRecommendation = "Needs significant improvement. Consider starting with basics and regular practice.";
    }

    // Generate study plan suggestions
    const studyPlan = [];
    if (weaknesses.length > 0) {
      studyPlan.push(`Focus on: ${weaknesses.join(', ')}`);
    }
    if (timeTakenSeconds / totalQuestions > 60) {
      studyPlan.push("Improve time management - aim for faster response times");
    }
    if (Number(percentage) < 70) {
      studyPlan.push("Practice more questions to improve accuracy");
    }

    try {
      // For quiz mode, we might want to save results differently
      if (isQuizMode) {
        await saveResult(
          quizTitle,
          'quiz',
          totalQuestions,
          answered,
          totalCorrect,
          percentage,
          overallPerformance,
          timeTakenSeconds,
          answeredQuestions
        );
      } else {
        await saveResult(
          subjects.join(", "),
          questionId,
          totalQuestions,
          answered,
          totalCorrect,
          percentage,
          overallPerformance,
          timeTakenSeconds,
          answeredQuestions
        );
      }

      navigation.replace("resultScreen", {
        result: {
          department: isQuizMode ? quizTitle : subjects.join(", "),
          questionId: isQuizMode ? 'quiz' : questionId,
          totalQuestions,
          answered,
          score: totalCorrect,
          percentage,
          performance: overallPerformance,
          timeTaken: formatMinutes(timeTakenSeconds),
          timestamp: Date.now(),
          questions: answeredQuestions,
          
          subjectResults: subjectResults,
          subjectAnalysis: subjectAnalysis,
          overallStats: overallStats,
          strengths: strengths,
          weaknesses: weaknesses,
          averageSubjectScore: averageSubjectScore,
          overallRecommendation: overallRecommendation,
          studyPlan: studyPlan,
          timeTakenSeconds: timeTakenSeconds,
          examType: isQuizMode ? "quiz" : examType,
          loadedSubjects: loadedSubjects,
          isQuizMode: isQuizMode,
          quizTitle: isQuizMode ? quizTitle : null,
          
          detailedStats: {
            totalTimeSpent: timeTakenSeconds,
            averageTimePerQuestion: overallStats.timePerQuestion,
            questionsPerMinute: overallStats.speed,
            accuracyBySubject: Object.entries(subjectResults).reduce((acc, [subject, result]) => {
              acc[subject] = result.accuracy + '%';
              return acc;
            }, {}),
            attemptRateBySubject: Object.entries(subjectResults).reduce((acc, [subject, result]) => {
              acc[subject] = result.attemptRate + '%';
              return acc;
            }, {})
          }
        },
      });
    } catch (err) {
      console.error("❌ Error saving result:", err);
      Alert.alert("Error", "Failed to save results. Please try again.");
    }
  }, [allQuestions, examTime, timeLeft, subjects, questionId, navigation, formatMinutes, getCorrectOptionValue, loadedSubjects, questionsBySubject, examType, isQuizMode, quizTitle]);
  
  const goToQuestion = useCallback((index) => {
    setCurrentQuestionIndex(index);
  }, []);

  const goToNextQuestion = useCallback(() => {
    const currentQuestions = getCurrentSubjectQuestions();
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    } else {
      goToNextSubject();
    }
  }, [currentQuestionIndex, getCurrentSubjectQuestions, goToQuestion, goToNextSubject]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    } else {
      goToPreviousSubject();
    }
  }, [currentQuestionIndex, goToQuestion, goToPreviousSubject]);

  const showDebugInfo = () => {
    console.log("\n=== DEBUG INFORMATION ===");
    console.log("Mode:", isQuizMode ? "QUIZ MODE" : "NORMAL MODE");
    console.log("Current subject:", currentSubject);
    console.log("All selected subjects:", subjects);
    console.log("Loaded subjects (with questions):", loadedSubjects);
    console.log("Current question index:", currentQuestionIndex);
    console.log("Total answers:", Object.keys(answers).length);
    console.log("Time left:", timeLeft, "seconds");
    console.log("Exam time:", examTime, "minutes");
    console.log("Timer started:", timerStarted);
    
    console.log("\nQuestions by subject:");
    subjects.forEach(subject => {
      const questions = questionsBySubject[subject] || [];
      console.log(`  "${subject}": ${questions.length} questions`);
      if (questions.length > 0) {
        console.log(`    Sample IDs: ${questions.slice(0, 3).map(q => q.id).join(', ')}`);
      }
    });
    
    console.log("\nAnswered counts:");
    subjects.forEach(subject => {
      console.log(`  "${subject}": ${answeredCounts[subject] || 0}/${totalQuestionsBySubject[subject] || 0}`);
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{loadingProgress}</Text>
      </View>
    );
  }

  if (!questionId || subjects.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No subjects selected. Please go back and select subjects.</Text>
      </View>
    );
  }

  if (loadedSubjects.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading questions...</Text>
        <Text style={styles.debugText}>Check console for detailed debug information</Text>
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={showDebugInfo}
        >
          <Text style={styles.debugButtonText}>Show Debug Info</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (autoSwitching) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>Switching to next subject with questions...</Text>
      </View>
    );
  }

  const currentSubjectQuestions = getCurrentSubjectQuestions();
  const currentQ = currentSubjectQuestions[currentQuestionIndex];
  const answeredForCurrentSubject = answeredCounts[currentSubject] || 0;
  const totalQuestionsForCurrentSubject = totalQuestionsBySubject[currentSubject] || 0;
  
  if (!currentQ || currentSubjectQuestions.length === 0) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingText}>No questions available for {currentSubject}. Auto-switching...</Text>
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={goToNextSubject}
        >
          <Text style={styles.switchButtonText}>Switch Subject Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      {/* Debug Button */}
      {debugMode && (
        <TouchableOpacity 
          style={styles.debugButtonTop}
          onPress={showDebugInfo}
        >
          <Text style={styles.debugButtonText}>DEBUG</Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.examTitle}>
            {isQuizMode ? quizTitle : (examType === "full" ? "JAMB FULL EXAM" : "JAMB PRACTICE")}
          </Text>
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={styles.examSubtitle}>
          {isQuizMode ? "Online Quiz" : `Set: ${questionId}`}
        </Text>
      </View>

      {/* Compact Subject Switcher - Only show subjects that have questions */}
      {!isQuizMode && (
        <View style={styles.subjectSwitcher}>
          {loadedSubjects.map((subject, index) => {
            const isCurrent = subject === currentSubject;
            const answered = answeredCounts[subject] || 0;
            const total = totalQuestionsBySubject[subject] || 0;
            const isComplete = answered === total && total > 0;
            const subjectAbbreviation = subject.split(' ')[0] || subject;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.subjectTab,
                  isCurrent && styles.currentSubjectTab,
                  isComplete && styles.completedSubjectTab
                ]}
                onPress={() => switchSubject(subject)}
              >
                <Text
                  style={[
                    styles.subjectTabText,
                    isCurrent && styles.currentSubjectTabText,
                    isComplete && styles.completedSubjectTabText
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subjectAbbreviation}
                </Text>
                <Text style={styles.subjectTabProgress}>
                  {answered}/{total}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Quit / Submit Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.quitBtn} onPress={handleQuitConfirm}>
          <Icon name="exit-outline" size={16} color="#fff" />
          <Text style={styles.quitText}>Quit</Text>
        </TouchableOpacity>
        
        <View style={styles.subjectInfo}>
          <Text style={styles.currentSubjectName} numberOfLines={1} ellipsizeMode="tail">
            {isQuizMode ? "Quiz Questions" : currentSubject}
          </Text>
          <Text style={styles.questionProgress}>
            Q{currentQuestionIndex + 1}/{totalQuestionsForCurrentSubject}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.submitBtn} onPress={confirmSubmit}>
          <Icon name="checkmark-circle-outline" size={16} color="#fff" />
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CustomAlertModal
        isVisible={showSubmitModal}
        title="Confirm Submission"
        message="Are you sure you want to submit your test? You won't be able to change your answers afterwards."
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitModal(false)}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        confirmStyle={modalStyles.submitButton}
      />

      <CustomAlertModal
        isVisible={showQuitModal}
        title="Quit Exam"
        message="Are you sure you want to quit the exam? Your progress will be lost."
        onConfirm={handleQuit}
        onCancel={handleCancelQuit}
        confirmText="Yes, Quit"
        cancelText="Cancel"
        confirmStyle={modalStyles.quitButton}
      />
      
      <CustomAlertModal
        isVisible={showTimeUpModal}
        title="⏰ Time Up!"
        message="The exam time has ended. Please submit your answers."
        onConfirm={handleSubmit}
        onCancel={() => {}}
        confirmText="Submit"
        cancelText=""
        confirmStyle={modalStyles.submitButton}
      />

      {/* Question with Markdown */}
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
          <Text style={styles.questionStatus}>
            {answeredForCurrentSubject} of {totalQuestionsForCurrentSubject} answered
          </Text>
        </View>
        <View style={styles.markdownContainer}>
          <Markdown style={markdownStyles}>
            {currentQ.question}
          </Markdown>
        </View>
      </View>

      {/* Options with Markdown */}
      <View style={styles.optionsContainer}>
        {shuffledOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.option,
              answers[currentQ.id] === opt.value && styles.selectedOption
            ]}
            onPress={() => handleSelect(currentQ.id, opt.value)}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionLetterBox}>
                <Text style={styles.optionLetter}>{opt.letter}</Text>
              </View>
            </View>
            <View style={styles.optionRight}>
              <Markdown style={markdownStyles}>
                {opt.value}
              </Markdown>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Navigation Buttons */}
      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navBtn, styles.prevBtn, (currentQuestionIndex === 0 && getCurrentSubjectIndex() === 0) && styles.disabledNavBtn]}
          disabled={currentQuestionIndex === 0 && getCurrentSubjectIndex() === 0}
          onPress={goToPreviousQuestion}
        >
          <Icon name="arrow-back" size={18} color={currentQuestionIndex === 0 && getCurrentSubjectIndex() === 0 ? "#999" : "#fff"} />
          <Text style={[
            styles.navBtnText,
            (currentQuestionIndex === 0 && getCurrentSubjectIndex() === 0) && styles.disabledNavBtnText
          ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.nextBtn]}
          onPress={goToNextQuestion}
        >
          <Text style={styles.navBtnText}>
            {currentQuestionIndex === totalQuestionsForCurrentSubject - 1 && 
             getCurrentSubjectIndex() === loadedSubjects.length - 1 ? "Finish" : "Next"}
          </Text>
          <Icon name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Question Numbers Grid for Current Subject */}
      <View style={styles.questionNumbersContainer}>
        <Text style={styles.questionNumbersTitle}>
          {isQuizMode ? "Quiz Questions:" : `Questions for ${currentSubject}:`}
        </Text>
        <View style={styles.questionNumbersGrid}>
          {currentSubjectQuestions.map((q, index) => {
            const isCurrent = index === currentQuestionIndex;
            const isAnswered = answers[q.id];
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.qNumber,
                  isCurrent && styles.currentQ,
                  isAnswered && styles.answeredQ,
                ]}
                onPress={() => goToQuestion(index)}
              >
                <Text style={[
                  styles.qNumberText,
                  isCurrent && styles.currentQText,
                  isAnswered && styles.answeredQText
                ]}>
                  {index + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Subject Navigation - Only show in normal mode with multiple subjects */}
      {!isQuizMode && loadedSubjects.length > 1 && (
        <View style={styles.subjectNavigation}>
          {getCurrentSubjectIndex() > 0 && (
            <TouchableOpacity 
              style={styles.subjectNavBtn} 
              onPress={goToPreviousSubject}
            >
              <Icon name="chevron-back" size={14} color="#007bff" />
              <Text style={styles.subjectNavText} numberOfLines={1} ellipsizeMode="tail">
                {loadedSubjects[getCurrentSubjectIndex() - 1].split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.subjectNavIndicator}>
            <Text style={styles.subjectNavIndicatorText}>
              {getCurrentSubjectIndex() + 1}/{loadedSubjects.length}
            </Text>
          </View>
          
          {getCurrentSubjectIndex() < loadedSubjects.length - 1 && (
            <TouchableOpacity 
              style={styles.subjectNavBtn} 
              onPress={goToNextSubject}
            >
              <Text style={styles.subjectNavText} numberOfLines={1} ellipsizeMode="tail">
                {loadedSubjects[getCurrentSubjectIndex() + 1].split(' ')[0]}
              </Text>
              <Icon name="chevron-forward" size={14} color="#007bff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 35
  },
  scrollContent: {
    paddingBottom: 30,
  },
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  debugText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  debugButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#6c757d',
    borderRadius: 5,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  debugButtonTop: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 3,
    zIndex: 1000,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginTop: 30
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  examSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
  },
  timer: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28a745',
  },
  subjectSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    justifyContent: 'space-around',
  },
  subjectTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    maxWidth: 90,
  },
  currentSubjectTab: {
    backgroundColor: '#007bff',
  },
  completedSubjectTab: {
    backgroundColor: '#28a745',
  },
  subjectTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  currentSubjectTabText: {
    color: '#fff',
  },
  completedSubjectTabText: {
    color: '#fff',
  },
  subjectTabProgress: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    gap: 5,
    minWidth: 70,
    justifyContent: 'center',
  },
  quitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  subjectInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  currentSubjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0056b3',
    textAlign: 'center',
  },
  questionProgress: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#28a745",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    gap: 5,
    minWidth: 70,
    justifyContent: 'center',
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  questionContainer: {
    padding: 15,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  questionStatus: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  markdownContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedOption: {
    borderColor: "#007bff",
    backgroundColor: "#e7f3ff",
  },
  optionLeft: {
    marginRight: 12,
  },
  optionLetterBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
  },
  optionRight: {
    flex: 1,
  },
  questionNumbersContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 10,
  },
  questionNumbersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 10,
  },
  questionNumbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  qNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dee2e6",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
    backgroundColor: '#fff',
  },
  qNumberText: {
    fontWeight: "bold",
    fontSize: 14,
    color: '#495057',
  },
  currentQ: {
    borderColor: "#007bff",
    backgroundColor: '#007bff',
  },
  currentQText: {
    color: '#fff',
  },
  answeredQ: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  answeredQText: {
    color: '#fff',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 10,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  prevBtn: {
    backgroundColor: "#007bff",
  },
  nextBtn: {
    backgroundColor: "#28a745",
  },
  disabledNavBtn: {
    backgroundColor: "#e9ecef",
  },
  navBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  disabledNavBtnText: {
    color: "#999",
  },
  subjectNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 10,
  },
  subjectNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    gap: 5,
    maxWidth: 100,
  },
  subjectNavText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '600',
  },
  subjectNavIndicator: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#007bff',
    borderRadius: 15,
  },
  subjectNavIndicatorText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  submitButton: { backgroundColor: "#28a745" },
  quitButton: { backgroundColor: "#dc3545" },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  modalText: { marginBottom: 20, textAlign: "center", fontSize: 16 },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  button: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#f0f0f0", borderWidth: 1, borderColor: "#ccc" },
  textStyle: { color: "white", fontWeight: "bold", textAlign: "center" },
  cancelTextStyle: { color: "#000", fontWeight: "bold" },
});

const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#212529',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  ordered_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  list_item: {
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 5,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 5,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 5,
  },
  heading3: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 5,
  },
  code_inline: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 3,
    padding: 10,
    marginVertical: 5,
    fontFamily: 'monospace',
  },
};