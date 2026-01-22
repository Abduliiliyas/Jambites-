import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getQuestions, getCachedDepartments } from "../database";
import { Ionicons } from '@expo/vector-icons';
import { CheckBox } from 'react-native-elements';
import { useRouter, useSearchParams, useLocalSearchParams } from 'expo-router';

export default function SelectSubject() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionId, setQuestionId] = useState(null);
  const [examType, setExamType] = useState(null); // "full" or "partial"
  const [englishSubjectIndex, setEnglishSubjectIndex] = useState(-1);
  const [maxSubjects, setMaxSubjects] = useState(4); // Default to 4
  const [isStudyMode, setIsStudyMode] = useState(false);

  const router = useRouter();
  
  const loadStudyMode = async () => {
    try {
      const studyMode = await AsyncStorage.getItem("study");
      setIsStudyMode(studyMode === "true");
    } catch (error) {
      console.error("Error loading study mode:", error);
    }
  };

  useEffect(() => {
    loadDepartmentsQuickly();
    loadExamType();
    loadStudyMode();
  }, []);

  const loadExamType = async () => {
    try {
      const savedQuestionId = await AsyncStorage.getItem("selectedQuestionId");
      if (!savedQuestionId) {
        Alert.alert("Error", "No question set selected");
        router.back();
        return;
      }
      
      setQuestionId(savedQuestionId);
      const savedExamType = await AsyncStorage.getItem("examType");
      setExamType(savedExamType);
      
      // If it's a full exam, user must select exactly 4 subjects including English
      if (savedExamType === "full") {
        setMaxSubjects(4); // Must select exactly 4
      } else {
        // For partial/study mode, they can select 1-4 subjects
        setMaxSubjects(4); // Maximum 4, but can be less
      }
    } catch (error) {
      console.error("Error loading exam type:", error);
      // Default to partial if there's an error
      setExamType("partial");
      setMaxSubjects(4);
    }
  };

  // Modify handleStartTest function
  const handleStartTest = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert("Select Subjects", "Please select at least one subject to continue.");
      return;
    }
    
    // Validation for full exam
    if (examType === "full") {
      // Check if exactly 4 subjects are selected
      if (selectedSubjects.length !== 4) {
        Alert.alert("Full Exam Requirement", "For JAMB full exam, you must select exactly 4 subjects.");
        return;
      }
      
      // Check if English is included
      const hasEnglish = subjects.some(subject => 
        subject.isEnglish && subject.selected
      );
      
      if (!hasEnglish) {
        Alert.alert("English is Required", "English is compulsory for JAMB full exam.");
        return;
      }
    }
    
    try {
      // Save selected subjects to AsyncStorage
      await AsyncStorage.setItem("selectedSubjects", JSON.stringify(selectedSubjects));
      
      // Check if study mode is enabled
      if (isStudyMode) {
        // Navigate to passQuestion screen for study mode
        router.push("/passQuestions");
      } else {
        // Navigate to instructionScreen for exam mode
        router.push("/instructionScreen");
      }
      
    } catch (error) {
      console.error("Error saving selected subjects:", error);
      Alert.alert("Error", "Failed to save subject selection");
    }
  };

  const loadSubjects = async () => {
    try {
      // Get the selected questionId from AsyncStorage
      
      
      // Get all questions from database
      const rows = await getQuestions();
      if (!rows || rows.length === 0) {
        Alert.alert("Error", "No questions found in database");
        return;
      }
      
      // Get unique subjects from the filtered questions
      const uniqueSubjects = [...new Set(rows.map(q => q.department))];
      
      // Find English subject (check for variations)
      let englishIndex = -1;
      const englishSubjects = ['English', 'ENGLISH', 'english', 'English Language', 'ENGLISH LANGUAGE'];
      
      uniqueSubjects.forEach((subject, index) => {
        if (englishSubjects.includes(subject.trim())) {
          englishIndex = index;
        }
      });
      
      setEnglishSubjectIndex(englishIndex);
      
      // Transform to checkbox format
      const subjectList = uniqueSubjects.map((subject, index) => ({
        id: index + 1,
        name: subject,
        selected: false,
        isEnglish: index === englishIndex
      }));
      
      // Auto-select first subject (and English if it's a full exam)
      let initialSelected = [];
      let updatedSubjectList = [...subjectList];
      
      if (subjectList.length > 0) {
        // Always auto-select first subject
        updatedSubjectList[0].selected = true;
        initialSelected.push(subjectList[0].name);
        
        // If it's a full exam and English is found but not the first subject,
        // also auto-select English
        if (examType === "full" && englishIndex !== -1 && englishIndex !== 0) {
          updatedSubjectList[englishIndex].selected = true;
          initialSelected.push(subjectList[englishIndex].name);
        }
      }
      
      setSubjects(updatedSubjectList);
      setSelectedSubjects(initialSelected);
      setLoading(false);
      
    } catch (error) {
      console.error("Error loading subjects:", error);
      Alert.alert("Error", "Failed to load subjects");
      setLoading(false);
    }
  };
  
  const loadDepartmentsQuickly = async () => {
    const departments = await getCachedDepartments();
    if (departments.length > 0) {
      // Use cached departments
      const subjectList = departments.map((subject, index) => ({
        id: index + 1,
        name: subject,
        selected: false,
        isEnglish: false
      }));
      
      // Check for English subject
      const englishSubjects = ['English', 'ENGLISH', 'english', 'English Language', 'ENGLISH LANGUAGE'];
      let englishIndex = -1;
      
      subjectList.forEach((subject, index) => {
        if (englishSubjects.includes(subject.name.trim())) {
          englishIndex = index;
          subjectList[index].isEnglish = true;
        }
      });
      
      setEnglishSubjectIndex(englishIndex);
      
      // Auto-select first subject (and English if it's a full exam)
      let initialSelected = [];
      if (subjectList.length > 0) {
        subjectList[0].selected = true;
        initialSelected.push(subjectList[0].name);
        
        // If it's a full exam and English is found but not the first subject
        if (examType === "full" && englishIndex !== -1 && englishIndex !== 0) {
          subjectList[englishIndex].selected = true;
          initialSelected.push(subjectList[englishIndex].name);
        }
      }
      
      setSubjects(subjectList);
      setSelectedSubjects(initialSelected);
      setLoading(false);
    } else {
      // Fallback to loading from database
      await loadSubjects();
    }
  };

  const toggleSubjectSelection = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    // Check if subject is English and exam is full
    if (examType === "full" && subject.isEnglish) {
      Alert.alert("English is Required", "English is compulsory for JAMB full exam and cannot be deselected.");
      return;
    }
    
    // Check if trying to deselect when only one subject is selected
    if (subject.selected && selectedSubjects.length === 1) {
      Alert.alert("Minimum Selection", "You must select at least one subject.");
      return;
    }
    
    // Check if trying to select more than max subjects
    if (!subject.selected && selectedSubjects.length >= maxSubjects) {
      Alert.alert(
        "Maximum Subjects Reached",
        examType === "full" 
          ? "For JAMB full exam, you must select exactly 4 subjects including English."
          : `You can select up to ${maxSubjects} subjects only.`
      );
      return;
    }
    
    setSubjects(prevSubjects =>
      prevSubjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, selected: !subject.selected }
          : subject
      )
    );
    
    // Update selected subjects array
    setSelectedSubjects(prevSelected => {
      if (prevSelected.includes(subject.name)) {
        return prevSelected.filter(name => name !== subject.name);
      } else {
        return [...prevSelected, subject.name];
      }
    });
  };

  const renderSubjectItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.subjectItem,
        item.selected && styles.subjectItemSelected,
        item.isEnglish && examType === "full" && styles.englishRequiredItem
      ]}
      onPress={() => toggleSubjectSelection(item.id)}
      disabled={item.isEnglish && examType === "full"} // Disable if English in full exam
    >
      <View style={styles.checkboxContainer}>
        <CheckBox
          checked={item.selected}
          onPress={() => toggleSubjectSelection(item.id)}
          checkedColor={item.isEnglish && examType === "full" ? "#28a745" : "#007bff"}
          containerStyle={styles.checkbox}
          disabled={item.isEnglish && examType === "full"}
        />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={[
          styles.subjectText,
          item.selected && styles.subjectTextSelected,
          item.isEnglish && styles.englishText
        ]}>
          {item.name}
        </Text>
        {item.isEnglish && examType === "full" && (
          <Text style={styles.requiredText}>Required for Full Exam</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getExamTypeText = () => {
    if (examType === "full") {
      return "Full JAMB Exam (4 subjects including English)";
    } else {
      return "Practice/Study Mode (1-4 subjects)";
    }
  };

  const getSelectionInfo = () => {
    if (examType === "full") {
      const englishSelected = subjects.some(s => s.isEnglish && s.selected);
      const englishText = englishSelected ? "✓ English selected" : "✗ English required";
      return `Select exactly 4 subjects • ${englishText} • ${selectedSubjects.length}/4 selected`;
    } else {
      return `Select 1-4 subjects • ${selectedSubjects.length}/4 selected`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading subjects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <Text style={styles.questionSetText}>
        Question Set: JAMB {questionId}
      </Text>
      
      <View style={styles.examTypeContainer}>
        <Ionicons 
          name={examType === "full" ? "school" : "book"} 
          size={20} 
          color={examType === "full" ? "#28a745" : "#007bff"} 
        />
        <Text style={[
          styles.examTypeText,
          examType === "full" && styles.fullExamText
        ]}>
          {getExamTypeText()}
        </Text>
      </View>
      
      <Text style={styles.selectionInfoText}>
        {getSelectionInfo()}
      </Text>
      
      {subjects.length === 0 ? (
        <Text style={styles.noSubjectsText}>No subjects found for this question set.</Text>
      ) : (
        <FlatList
          data={subjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedCountText}>
          Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}
        </Text>
        {selectedSubjects.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.selectedListText}>
              {selectedSubjects.join(", ")}
            </Text>
          </ScrollView>
        )}
      </View>
      
      <TouchableOpacity
        style={[
          styles.startButton,
          (selectedSubjects.length === 0 || 
           (examType === "full" && selectedSubjects.length !== 4)) && styles.startButtonDisabled
        ]}
        onPress={handleStartTest}
        disabled={selectedSubjects.length === 0 || (examType === "full" && selectedSubjects.length !== 4)}
      >
        <Ionicons name="play-circle" size={20} color="#FFF" />
        <Text style={styles.startButtonText}>
          {isStudyMode ? (
            examType === "full" ? (
              selectedSubjects.length === 4 ? "Start Studying (Full Exam)" : `Select ${4 - selectedSubjects.length} More`
            ) : (
              `Start Studying (${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''})`
            )
          ) : (
            examType === "full" ? (
              selectedSubjects.length === 4 ? "Start Full Exam" : `Select ${4 - selectedSubjects.length} More`
            ) : (
              `Start Test (${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''})`
            )
          )}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
    marginBottom: 35
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  questionSetText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  examTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: '#e9ecef',
    padding: 10,
    borderRadius: 8,
  },
  examTypeText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
    fontWeight: '600',
  },
  fullExamText: {
    color: '#28a745',
  },
  selectionInfoText: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 50,
  },
  listContainer: {
    paddingBottom: 20,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectItemSelected: {
    borderColor: '#007bff',
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  englishRequiredItem: {
    borderColor: '#28a745',
    backgroundColor: 'rgba(40, 167, 69, 0.05)',
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectText: {
    fontSize: 16,
    color: '#495057',
  },
  subjectTextSelected: {
    color: '#007bff',
    fontWeight: '600',
  },
  englishText: {
    fontWeight: '600',
  },
  requiredText: {
    fontSize: 11,
    color: '#28a745',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noSubjectsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginVertical: 40,
  },
  selectedInfo: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 5,
  },
  selectedListText: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 10,
    gap: 10,
  },
  startButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});