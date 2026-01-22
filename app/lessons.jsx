import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html'; // You'll need to install this
import AdBanner from "../components/AdBanner"; // Import the AdBanner component

const API_BASE_URL = "https://healthprof.com.ng";

export default function LecturesScreen() {
  const router = useRouter();
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/jlectures/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLectures(data);
    } catch (err) {
      console.error("Error fetching lectures:", err);
      setError("Failed to load lectures. Please try again.");
      Alert.alert("Error", "Failed to load lectures. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Handle invalid date format
        return "Recent";
      }
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Recent";
    }
  };

  const handleLecturePress = (lecture) => {
    router.push({
      pathname: "/lectureDetail",
      params: { 
        lectureId: lecture.id,
        title: lecture.title,
        body: lecture.body,
        content: lecture.content,
        picture: lecture.picture,
        timestamp: lecture.timestamp
      }
    });
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const getPreviewText = (content, maxLength = 100) => {
    const plainText = stripHtml(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  useEffect(() => {
    fetchLectures();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Loading lectures...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={{ textAlign: 'center', marginVertical: 10, color: '#666' }}>
          {error}
        </Text>
        <Pressable 
          style={styles.retryButton}
          onPress={fetchLectures}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Top Ad Banner */}
      <AdBanner />

      {/* Lectures Content */}
      <ScrollView style={styles.lecturesContainer}>
        {lectures.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No lessons available</Text>
            <Text style={styles.emptyStateSubtext}>Check back later for new study materials</Text>
          </View>
        ) : (
          lectures.map((lecture, index) => (
            <View key={lecture.id}>
              <Pressable
                style={styles.lectureItem}
                onPress={() => handleLecturePress(lecture)}
              >
                {lecture.picture && (
                  <Image 
                    source={{ uri: lecture.picture }} 
                    style={styles.lectureImage}
                    resizeMode="cover"
                  />
                )}
                
                <View style={styles.lectureContent}>
                  <Text style={styles.lectureTitle}>{lecture.title}</Text>
                  {lecture.body && (
                    <Text style={styles.lectureBody}>{lecture.body}</Text>
                  )}
                  <Text style={styles.lectureDescription} numberOfLines={3}>
                    {getPreviewText(lecture.content)}
                  </Text>
                  <View style={styles.lectureMeta}>
                    <Text style={styles.lectureDate}>
                      {formatDate(lecture.timestamp)}
                    </Text>
                    {lecture.is_posting && (
                      <View style={styles.publishedBadge}>
                        <Text style={styles.publishedText}>Published</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </Pressable>

              {/* Ad Banner after every 5 lectures */}
              {(index + 1) % 3 === 0 && (
                <View style={styles.middleAdContainer}>
                  <AdBanner />
                </View>
              )}
            </View>
          ))
        )}
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

    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  refreshButton: {
    padding: 8,
  },
  lecturesContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  lectureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  lectureImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  lectureContent: {
    flex: 1,
    marginRight: 8,
  },
  lectureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: '#333',
  },
  lectureBody: {
    fontSize: 14,
    fontWeight: '600',
    color: "#007AFF",
    marginBottom: 4,
  },
  lectureDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  lectureMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lectureDate: {
    fontSize: 12,
    color: "#999",
    fontStyle: 'italic',
  },
  publishedBadge: {
    backgroundColor: '#4CD964',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publishedText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: 'bold',
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
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  middleAdContainer: {
    marginVertical: 10,
    marginBottom: 16,
  },
  bottomNavigation: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginBottom: 43,
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