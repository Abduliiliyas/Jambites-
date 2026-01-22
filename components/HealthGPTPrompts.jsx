import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

const SAMPLE_PROMPTS = [
  {
    title: "Medical Concepts",
    prompts: [
      "Explain the pathophysiology of diabetes mellitus",
      "What are the different types of shock and their management?",
      "Describe the mechanism of action of beta-blockers",
    ]
  },
  {
    title: "Clinical Skills",
    prompts: [
      "How to perform a proper patient assessment?",
      "What are the steps in wound care management?",
      "Explain proper injection techniques",
    ]
  },
  {
    title: "Exam Preparation",
    prompts: [
      "What are the key topics for nursing board exams?",
      "How to study pharmacology effectively?",
      "Tips for clinical case analysis in exams",
    ]
  },
  {
    title: "Professional Development",
    prompts: [
      "What are the ethical considerations in patient confidentiality?",
      "How to handle difficult patient situations?",
      "Career paths for health professionals",
    ]
  }
];

export default function HealthGPTPrompts({ onPromptSelect }) {
  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {SAMPLE_PROMPTS.map((category, categoryIndex) => (
        <View key={categoryIndex} style={styles.category}>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          {category.prompts.map((prompt, promptIndex) => (
            <Pressable
              key={promptIndex}
              style={styles.promptButton}
              onPress={() => onPromptSelect(prompt)}
            >
              <Text style={styles.promptText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  category: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  promptButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promptText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});