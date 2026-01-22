import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import AdBanner from "../components/AdBanner";

export default function LecturesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  // JAMB Subjects Array - Core and Elective Subjects
  const jambSubjects = [
    { id: "1", name: "Use of English", category: "Core", description: "Compulsory for all courses", icon: "language", color: "#FF6B6B" },
    { id: "2", name: "Mathematics", category: "Core", description: "For Science, Social Science & some Arts courses", icon: "calculator", color: "#4ECDC4" },
    { id: "3", name: "Physics", category: "Science", description: "Required for Engineering, Physical Sciences", icon: "nuclear", color: "#45B7D1" },
    { id: "4", name: "Chemistry", category: "Science", description: "For Medical Sciences, Engineering, Pharmacy", icon: "flask", color: "#96CEB4" },
    { id: "5", name: "Biology", category: "Science", description: "For Medical, Biological, Agricultural Sciences", icon: "leaf", color: "#FFEAA7" },
    { id: "6", name: "Geography", category: "Social Science", description: "For Geography, Urban Planning, some Social Sciences", icon: "map", color: "#DDA0DD" },
    { id: "7", name: "Economics", category: "Social Science", description: "For Business, Economics, Social Sciences", icon: "trending-up", color: "#98D8C8" },
    { id: "8", name: "Government", category: "Arts/Social Science", description: "For Political Science, Public Administration", icon: "business", color: "#F7DC6F" },
    { id: "9", name: "Literature in English", category: "Arts", description: "For English, Literature, Mass Communication", icon: "book", color: "#BB8FCE" },
    { id: "10", name: "History", category: "Arts", description: "For History, International Studies, some Social Sciences", icon: "time", color: "#85C1E9" },
    { id: "11", name: "Commerce", category: "Social Science", description: "For Business, Accounting, Banking & Finance", icon: "cart", color: "#F1948A" },
    { id: "12", name: "Accounting", category: "Social Science", description: "For Accounting, Business Administration", icon: "cash", color: "#AED6F1" },
    { id: "13", name: "Agricultural Science", category: "Science", description: "For Agriculture, Forestry, related sciences", icon: "leaf", color: "#A2D9CE" },
    { id: "14", name: "Fine Arts", category: "Arts", description: "For Creative Arts, Fine & Applied Arts", icon: "color-palette", color: "#F5B041" },
    { id: "15", name: "French", category: "Arts", description: "For French, International Studies, Linguistics", icon: "language", color: "#5499C7" },
    { id: "16", name: "Islamic Studies", category: "Arts", description: "For Islamic Studies, Arabic, Religious Studies", icon: "star", color: "#48C9B0" },
    { id: "17", name: "Christian Religious Studies", category: "Arts", description: "For CRS, Theology, Religious Studies", icon: "star", color: "#AF7AC5" },
    { id: "18", name: "Hausa", category: "Arts", description: "For Hausa, Linguistics, African Languages", icon: "chatbubbles", color: "#F0B27A" },
    { id: "19", name: "Igbo", category: "Arts", description: "For Igbo, Linguistics, African Languages", icon: "chatbubbles", color: "#73C6B6" },
    { id: "20", name: "Yoruba", category: "Arts", description: "For Yoruba, Linguistics, African Languages", icon: "chatbubbles", color: "#BB8FCE" },
    { id: "21", name: "Music", category: "Arts", description: "For Music, Creative Arts", icon: "musical-notes", color: "#F1948A" },
    { id: "22", name: "Arabic", category: "Arts", description: "For Arabic, Islamic Studies", icon: "language", color: "#76D7C4" },
    { id: "23", name: "Physical Education", category: "Science", description: "For Sports Science, Health Education", icon: "fitness", color: "#F7DC6F" },
    { id: "25", name: "Home Economics", category: "Arts/Social Science", description: "For Economics, Home Management, Nutrition", icon: "trending-up", color: "#85C1E9" },
  ];

  // Filter subjects based on search query
  const filteredSubjects = jambSubjects.filter(subject => {
    const searchLower = searchQuery.toLowerCase();
    return (
      subject.name.toLowerCase().includes(searchLower) ||
      subject.description.toLowerCase().includes(searchLower) ||
      subject.category.toLowerCase().includes(searchLower)
    );
  });

  const handleSubjectPress = (subject) => {
    // Navigate to screen with the same name as the subject
    const screenName = subject.name.replace(/[^a-zA-Z0-9]/g, '');
    console.log(screenName)
    router.push({
      pathname: `/subjects/${screenName}`,
      params: { 
        subjectName: subject.name,
        subjectId: subject.id,
        description: subject.description,
        category: subject.category,
        color: subject.color,
      }
    });
  };

  const getIconName = (iconName) => {
    const iconMap = {
      'language': 'language',
      'calculator': 'calculator',
      'nuclear': 'nuclear',
      'flask': 'flask',
      'leaf': 'leaf',
      'map': 'map',
      'trending-up': 'trending-up',
      'business': 'business',
      'book': 'book',
      'time': 'time',
      'cart': 'cart',
      'cash': 'cash',
      'color-palette': 'color-palette',
      'star': 'star',
      'chatbubbles': 'chatbubbles',
      'musical-notes': 'musical-notes',
      'fitness': 'fitness',
      'construct': 'construct',
    };
    return iconMap[iconName] || 'book';
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>JAMB Subjects</Text>
        <Text style={styles.headerSubtitle}>Select a subject for detailed materials</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subjects..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Subjects Content */}
      <ScrollView style={styles.subjectsContainer}>
        {filteredSubjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No subjects found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different search term</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredSubjects.map((subject, index) => (
              <View key={subject.id} style={styles.gridItem}>
                <Pressable
                  style={styles.subjectCard}
                  onPress={() => handleSubjectPress(subject)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: subject.color + '20' }]}>
                    <Ionicons 
                      name={getIconName(subject.icon)} 
                      size={24} 
                      color={subject.color}
                    />
                  </View>
                  
                  <View style={styles.subjectContent}>
                    <Text style={styles.subjectName}>{subject.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{subject.category}</Text>
                    </View>
                    <Text style={styles.subjectDescription} numberOfLines={2}>
                      {subject.description}
                    </Text>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>

                {/* Ad Banner after every 6 subjects */}
                {(index + 1) % 6 === 0 && (
                  <View style={styles.middleAdContainer}>
                    <AdBanner />
                  </View>
                )}
              </View>
            ))}
          </View>
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
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  subjectsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 16,
  },
  subjectCard: {
    flexDirection: "column",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 160,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subjectContent: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    color: '#333',
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#495057',
    fontWeight: '600',
  },
  subjectDescription: {
    fontSize: 11,
    color: "#666",
    textAlign: 'center',
    lineHeight: 14,
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
  middleAdContainer: {
    marginVertical: 10,
    marginBottom: 16,
    width: '100%',
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
  activeNavText: {
    color: "rgba(92, 184, 92, 0.8)",
  },
});