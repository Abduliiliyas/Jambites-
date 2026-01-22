import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import AdBanner from "../components/AdBanner"; // Import the AdBanner component

export default function LectureDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { lectureId, title, body, content, picture, timestamp } = useLocalSearchParams();

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  const htmlContent = content || `
    <div style="padding: 20px; text-align: center;">
      <p>No content available for this lecture.</p>
    </div>
  `;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        {picture && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: picture }} 
              style={styles.lectureImage}
              resizeMode="contain"
            />
          </View>
        )}
        
        {/* First Ad Banner - After Image View */}
        <AdBanner />
        
        <View style={styles.lectureHeader}>
          <Text style={styles.lectureTitle}>{title}</Text>
          {body && (
            <Text style={styles.lectureBody}>{body}</Text>
          )}
          {timestamp && (
            <Text style={styles.lectureDate}>{formatDate(timestamp)}</Text>
          )}
        </View>
        
        <View style={styles.htmlContent}>
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: htmlContent }}
            baseStyle={styles.htmlBaseStyle}
            tagsStyles={{
              p: { fontSize: 16, lineHeight: 24, marginBottom: 16, color: '#333' },
              h1: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#333' },
              h2: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#333' },
              h3: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
              h4: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
              h5: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#333' },
              h6: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, color: '#333' },
              ul: { marginBottom: 16 },
              ol: { marginBottom: 16 },
              li: { fontSize: 16, lineHeight: 24, marginBottom: 4, color: '#333' },
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              blockquote: { 
                backgroundColor: '#f8f9fa', 
                padding: 16, 
                borderLeftWidth: 4, 
                borderLeftColor: '#007AFF',
                marginBottom: 16,
                borderRadius: 4,
              },
            }}
          />
        </View>
      </ScrollView>

      {/* Second Ad Banner - Fixed at Bottom */}
      <AdBanner />
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
    marginTop: 20
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  imageContainer: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200, // Minimum height to ensure good visibility
    maxHeight: 300, // Maximum height to prevent overly tall images
  },
  lectureImage: {
    width: '180%',
    height: undefined, // Let height be determined by aspect ratio
    aspectRatio: 16/9, // Common aspect ratio, adjust as needed
    maxWidth: '200%',
  },
  lectureHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lectureTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  lectureBody: {
    fontSize: 18,
    color: "#007AFF",
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  lectureDate: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  htmlContent: {
    padding: 16,
    marginBottom: 35,
  },
  htmlBaseStyle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});