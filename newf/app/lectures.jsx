import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = "https://healthprof.com.ng";

export default function CoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestedCourses, setRequestedCourses] = useState([]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/courses/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setCourses(data.courses || []);
      setRequestedCourses(data.requested_courses || []);
      
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.message || "Failed to load courses. Please try again.");
      Alert.alert("Error", "Failed to load courses. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course) => {
    router.push({
      pathname: "/courseDetail",
      params: { 
        courseName: course.courseName,
        content: course.content
      }
    });
  };

  const getPreviewContent = (content, maxLength = 100) => {
    if (!content) return 'No content available';
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const trimmed = plainText.replace(/\s+/g, ' ').trim();
    
    if (trimmed.length <= maxLength) return trimmed;
    return trimmed.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable 
            style={styles.retryButton}
            onPress={fetchCourses}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Courses</Text>
        <Pressable 
          style={styles.refreshButton}
          onPress={fetchCourses}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </Pressable>
      </View>

      {/* Course List */}
      <ScrollView style={styles.coursesContainer}>
        {courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No courses available</Text>
            <Text style={styles.emptyStateSubtext}>
              {requestedCourses.length > 0 
                ? `Requested courses: ${requestedCourses.join(', ')}`
                : 'No courses found in the database'
              }
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryText}>
                Showing {courses.length} of {requestedCourses.length} requested courses
              </Text>
              {requestedCourses.length > courses.length && (
                <Text style={styles.missingText}>
                  Missing: {requestedCourses.filter(name => 
                    !courses.some(c => c.courseName === name)
                  ).join(', ')}
                </Text>
              )}
            </View>
            
            {courses.map((course, index) => (
              <Pressable
                key={index}
                style={styles.courseItem}
                onPress={() => handleCoursePress(course)}
              >
                <View style={styles.courseIcon}>
                  <Ionicons name="book" size={24} color="#007AFF" />
                </View>
                
                <View style={styles.courseContent}>
                  <Text style={styles.courseName}>{course.courseName}</Text>
                  <Text style={styles.coursePreview} numberOfLines={2}>
                    {getPreviewContent(course.content)}
                  </Text>
                </View>
                
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <Pressable style={styles.navItem} onPress={() => router.push("/")}>
          <Ionicons name="home" size={18} color="#666" />
          <Text style={styles.navText}>Home</Text>
        </Pressable>
        
        <Pressable style={styles.navItem} onPress={() => router.push("/courses")}>
          <Ionicons name="book" size={18} color="rgba(92, 184, 92, 0.8)" />
          <Text style={styles.navText}>Courses</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push("/HealthGPTScreen")}>
          <Ionicons name="chatbubble-ellipses" size={18} color="#666" />
          <Text style={styles.navText}>HealthGPT</Text>
        </Pressable>
        
        <Pressable style={styles.navItem} onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications" size={18} color="#666" />
          <Text style={styles.navText}>News</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  coursesContainer: {
    flex: 1,
    padding: 16,
  },
  summaryContainer: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  missingText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontStyle: 'italic',
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseContent: {
    flex: 1,
    marginRight: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: '#333',
  },
  coursePreview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomNavigation: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
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
});