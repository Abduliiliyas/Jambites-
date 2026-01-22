// resultScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { result } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🎯 ResultScreen mounted");
    console.log("Result keys:", result ? Object.keys(result) : "No result");
    
    // Log some sample data to check structure
    if (result) {
      console.log("Sample subjectResults:", result.subjectResults);
      console.log("Loaded subjects:", result.loadedSubjects);
      console.log("Subject analysis:", result.subjectAnalysis);
    }
  }, []);

  const getColorForIndex = (index) => {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];
    return colors[index % colors.length];
  };

  const getGradeColor = (percentage) => {
    if (!percentage) return '#dc3545';
    const pct = Number(percentage);
    if (pct >= 80) return '#28a745';
    if (pct >= 70) return '#17a2b8';
    if (pct >= 60) return '#ffc107';
    if (pct >= 50) return '#fd7e14';
    return '#dc3545';
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("userInfo");
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setUserName(user.name || "");
        }
      } catch (error) {
        console.error("Error loading user info:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  // Add error boundary
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading results</Text>
        <Text style={styles.errorDetails}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading || !result) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text>Loading results...</Text>
      </View>
    );
  }

  try {
    // Safely destructure with defaults
    const {
      department = "",
      questionId = "",
      totalQuestions = 0,
      answered = 0,
      score = 0,
      percentage = "0",
      performance = "Unknown",
      timeTaken = "0:00",
      subjectResults = {},
      subjectAnalysis = {},
      overallStats = {},
      strengths = [],
      weaknesses = [],
      averageSubjectScore = "0",
      overallRecommendation = "",
      studyPlan = [],
      timeTakenSeconds = 0,
      examType = "practice",
      loadedSubjects = [],
      detailedStats = {}
    } = result;

    console.log("Loaded subjects array:", loadedSubjects);
    console.log("Subject results keys:", Object.keys(subjectResults));

    const shareResults = async () => {
      try {
        const shareMessage = `🎯 JAMB Exam Results\n\n` +
          `Score: ${score}/${totalQuestions} (${percentage}%)\n` +
          `Performance: ${performance}\n` +
          `Time: ${timeTaken}\n` +
          `Exam Type: ${examType === "full" ? "Full Exam" : "Practice"}\n\n` +
          `Subjects: ${loadedSubjects?.join(', ') || department}`;

        await Share.share({
          message: shareMessage,
          title: 'My JAMB Exam Results'
        });
      } catch (error) {
        console.error("Error sharing results:", error);
      }
    };

    const handleReviewQuestions = () => {
      navigation.navigate("reviewScreen", { result });
    };

    const handleNewExam = async () => {
      let isQuizMode = await AsyncStorage.getItem("selectedQuestionId")
      if(isQuizMode.includes('quiz')){
        navigation.navigate("startQuiz");
      }
      else{
        navigation.navigate("CBT");
      }
      
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Results</Text>
          <Text style={styles.headerSubtitle}>{userName ? `Candidate: ${userName}` : ""}</Text>
          <Text style={styles.examInfo}>
            {examType === "full" ? "Full JAMB Exam" : "Practice Exam"} • Set: {questionId}
          </Text>
        </View>

        {/* Overall Score Card */}
        <View style={styles.overallCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          
          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <Icon name="checkmark-circle" size={20} color="#28a745" />
              <Text style={styles.scoreText}>Correct: {score}/{totalQuestions}</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Icon name="close-circle" size={20} color="#dc3545" />
              <Text style={styles.scoreText}>Wrong: {Math.max(0, answered - score)}</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Icon name="time-outline" size={20} color="#6c757d" />
              <Text style={styles.scoreText}>Time: {timeTaken}</Text>
            </View>
            
            <View style={styles.scoreRow}>
              <Icon name="stats-chart" size={20} color="#007bff" />
              <Text style={[styles.performanceText, { color: getGradeColor(percentage) }]}>
                {performance}
              </Text>
            </View>
          </View>
        </View>

        {/* Subject-wise Performance - SIMPLIFIED VERSION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subject-wise Performance</Text>
          
          {loadedSubjects && Array.isArray(loadedSubjects) && loadedSubjects.length > 0 ? (
            loadedSubjects.map((subject, index) => {
              const subjectResult = subjectResults[subject];
              if (!subjectResult) {
                return (
                  <View key={index} style={styles.subjectCard}>
                    <Text style={styles.subjectName}>{subject}</Text>
                    <Text style={styles.noDataText}>No data available</Text>
                  </View>
                );
              }
              
              return (
                <View key={index} style={styles.subjectCard}>
                  <View style={styles.subjectHeader}>
                    <Text style={styles.subjectName}>{subject}</Text>
                    <View style={styles.subjectScore}>
                      <Text style={[styles.subjectPercentage, { color: getGradeColor(subjectResult.percentage) }]}>
                        {subjectResult.percentage || 0}%
                      </Text>
                      <Text style={styles.subjectScoreText}>
                        ({subjectResult.correct || 0}/{subjectResult.total || 0})
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { 
                      width: `${Math.min(100, Math.max(0, subjectResult.percentage || 0))}%`, 
                      backgroundColor: getGradeColor(subjectResult.percentage) 
                    }]} />
                  </View>
                  
                  <Text style={styles.analysisText}>
                    {subjectResult.analysis || "No analysis available"}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noSubjectsText}>No subjects data available</Text>
          )}
        </View>

        {/* Strengths & Weaknesses - SIMPLIFIED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          
          <View style={styles.summaryContainer}>
            <View style={styles.summaryColumn}>
              <View style={[styles.summaryHeader, { backgroundColor: '#28a745' }]}>
                <Icon name="trending-up" size={18} color="#fff" />
                <Text style={styles.summaryTitle}>Strengths</Text>
              </View>
              {strengths && strengths.length > 0 ? (
                strengths.slice(0, 3).map((strength, index) => (
                  <Text key={index} style={styles.summaryItem}>
                    • {strength}
                  </Text>
                ))
              ) : (
                <Text style={styles.summaryEmpty}>None identified</Text>
              )}
            </View>
            
            <View style={styles.summaryColumn}>
              <View style={[styles.summaryHeader, { backgroundColor: '#dc3545' }]}>
                <Icon name="trending-down" size={18} color="#fff" />
                <Text style={styles.summaryTitle}>Areas to Improve</Text>
              </View>
              {weaknesses && weaknesses.length > 0 ? (
                weaknesses.slice(0, 3).map((weakness, index) => (
                  <Text key={index} style={styles.summaryItem}>
                    • {weakness}
                  </Text>
                ))
              ) : (
                <Text style={styles.summaryEmpty}>None identified</Text>
              )}
            </View>
          </View>
        </View>

        {/* Recommendations - SIMPLIFIED */}
        {overallRecommendation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendation</Text>
            <View style={styles.recommendationCard}>
              <Icon name="bulb-outline" size={22} color="#ffc107" />
              <Text style={styles.recommendationText}>{overallRecommendation}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.reviewButton]} onPress={handleReviewQuestions}>
            <Icon name="document-text-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Review</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={shareResults}>
            <Icon name="share-social-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.newExamButton]} onPress={handleNewExam}>
            <Icon name="play-circle-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>New Test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  } catch (err) {
    console.error("❌ Error rendering result screen:", err);
    // Set error state to show error screen
    setError(err);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom: 35,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 5,
  },
  examInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  overallCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    borderColor: '#007bff',
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  scoreDetails: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'space-around',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  scoreText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 10,
  },
  performanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  noSubjectsText: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    padding: 20,
  },
  subjectCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  subjectScore: {
    alignItems: 'flex-end',
  },
  subjectPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subjectScoreText: {
    fontSize: 12,
    color: '#6c757d',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  analysisText: {
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  summaryItem: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 6,
    paddingHorizontal: 5,
  },
  summaryEmpty: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  reviewButton: {
    backgroundColor: '#28a745',
  },
  shareButton: {
    backgroundColor: '#17a2b8',
  },
  newExamButton: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
});