import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Markdown from 'react-native-markdown-display';
import NetInfo from '@react-native-community/netinfo';
import { useNavigation } from "@react-navigation/native";

// API Configuration
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api';

const UseOfEnglishSyllabusScreen = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoadingTopics, setAiLoadingTopics] = useState({});
  const [aiExplanations, setAiExplanations] = useState({});
  const [isPremiumActivated, setIsPremiumActivated] = useState(false);
  const [aiLimit, setAiLimit] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const navigation = useNavigation();

  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Communicate effectively in both written and spoken English',
          'Use English Language for learning at the tertiary level',
          'Develop comprehension and summary skills',
          'Master lexis, structure and oral forms',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: COMPREHENSION AND SUMMARY',
        topics: [
          {
            id: 'A1',
            title: 'Comprehension Skills',
            content: [
              'Identifying main points and topic sentences',
              'Determining implied meanings',
              'Understanding grammatical functions',
              'Deducing writer\'s intentions, mood and attitude',
              'Working with descriptive, narrative, expository and argumentative passages',
            ],
            objectives: [
              'Analyze passages of about 200 words',
              'Answer questions on comprehension',
              'Identify figures of speech and idioms',
              'Make logical deductions and inferences',
              'Synthesize ideas from passages',
            ],
            aiPrompt: "Explain comprehension skills for UTME/JAMB. How to identify main ideas in passages? How to determine implied meanings? Give examples of descriptive, narrative, expository and argumentative passages. Show how to analyze 'The Life Changer' text. Provide strategies for answering comprehension questions effectively.",
          },
          {
            id: 'A2',
            title: 'Summary Writing',
            content: [
              'Art of combining distinct information',
              'Forming complete whole from parts',
              'Extracting key points',
              'Paraphrasing effectively',
              'Maintaining coherence',
            ],
            objectives: [
              'Summarize passages concisely',
              'Combine information logically',
              'Identify key ideas',
              'Express ideas in own words',
              'Maintain original meaning',
            ],
            aiPrompt: "Teach summary writing techniques for JAMB. Explain the 'synthesis of ideas' concept. How to combine separate pieces into a coherent summary? Show step-by-step summary of a sample passage. Discuss length requirements and common mistakes to avoid. Provide exercises with solutions.",
          },
          {
            id: 'A3',
            title: 'Cloze Test',
            content: [
              'Understanding context',
              'Vocabulary in context',
              'Grammar in context',
              'Coherence in passages',
              'Logical word selection',
            ],
            objectives: [
              'Complete cloze passages',
              'Choose appropriate words',
              'Maintain passage coherence',
              'Apply contextual understanding',
              'Use correct grammatical forms',
            ],
            aiPrompt: "Explain cloze test strategies for JAMB. How to approach fill-in-the-blank questions? Discuss context clues, grammatical patterns, and vocabulary selection. Provide examples of cloze passages from various disciplines. Show how to eliminate wrong choices and select best answers.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: LEXIS AND STRUCTURE',
        topics: [
          {
            id: 'B1',
            title: 'Vocabulary Development',
            content: [
              'Synonyms and antonyms',
              'Ordinary, figurative and idiomatic usage',
              'Word classes and functions',
              'Formal idioms in Standard British English',
              'Spelling and word forms',
            ],
            objectives: [
              'Identify words in different contexts',
              'Determine similar and opposite meanings',
              'Differentiate correct and incorrect spellings',
              'Use words appropriately',
              'Recognize formal idioms',
            ],
            aiPrompt: "Explain vocabulary development for JAMB. Cover synonyms, antonyms, and homophones. Discuss ordinary vs figurative vs idiomatic usage. Provide lists of common JAMB vocabulary. Explain word classes (nouns, verbs, adjectives, etc.) with examples. Teach spelling rules and common errors.",
          },
          {
            id: 'B2',
            title: 'Grammar and Structure',
            content: [
              'Clause and sentence patterns',
              'Mood, tense and aspect',
              'Number, agreement and concord',
              'Degrees of comparison',
              'Question tags',
              'Sentence mechanics',
            ],
            objectives: [
              'Identify grammatical patterns',
              'Use correct tense and aspect',
              'Apply agreement rules',
              'Form comparative and superlative',
              'Use appropriate question tags',
              'Interpret sentence information',
            ],
            aiPrompt: "Explain grammar and structure for JAMB. Cover: 1) Tense and aspect (present perfect, past continuous, etc.) 2) Subject-verb agreement 3) Degrees of comparison 4) Question tags 5) Sentence patterns (simple, compound, complex) 6) Common grammatical errors in JAMB. Provide examples and exercises.",
          },
          {
            id: 'B3',
            title: 'Sentence Interpretation',
            content: [
              'Understanding sentence meaning',
              'Identifying grammatical functions',
              'Analyzing sentence structure',
              'Interpreting complex sentences',
              'Recognizing rhetorical devices',
            ],
            objectives: [
              'Interpret sentence meanings',
              'Analyze sentence components',
              'Understand complex structures',
              'Identify rhetorical devices',
              'Explain sentence functions',
            ],
            aiPrompt: "Teach sentence interpretation for JAMB. How to analyze complex sentences? Explain grammatical functions of phrases and clauses. Show how to identify subject, predicate, objects, modifiers. Discuss how to interpret figurative language in sentences. Provide practice sentences with explanations.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: ORAL FORMS',
        topics: [
          {
            id: 'C1',
            title: 'Pronunciation and Phonetics',
            content: [
              'Vowels: monothongs, diphthongs, triphthongs',
              'Consonants and consonant clusters',
              'Rhymes and homophones',
              'Individual word pronunciation',
              'Articulation of connected speech',
            ],
            objectives: [
              'Distinguish vowel types',
              'Differentiate consonant types',
              'Identify correct pronunciation',
              'Recognize rhymes and homophones',
              'Articulate connected speech',
            ],
            aiPrompt: "Explain English pronunciation for JAMB Oral Forms. Cover: 1) Vowel sounds with examples 2) Consonant sounds and clusters 3) Common pronunciation errors by Nigerian students 4) Rhyming words and homophones 5) Practice exercises for pronunciation. Use IPA symbols where helpful.",
          },
          {
            id: 'C2',
            title: 'Stress and Intonation',
            content: [
              'Word stress (monosyllabic and polysyllabic)',
              'Emphatic stress in connected speech',
              'Sentence stress patterns',
              'Intonation for meaning',
              'Stress placement for emphasis',
            ],
            objectives: [
              'Place correct word stress',
              'Use emphatic stress appropriately',
              'Apply stress patterns in sentences',
              'Use intonation to convey meaning',
              'Recognize stress patterns',
            ],
            aiPrompt: "Explain stress and intonation for JAMB. How to stress words correctly? What is emphatic stress and how to use it? Provide rules for word stress in English. Show examples of how stress changes meaning. Discuss Nigerian English stress patterns vs Standard British English.",
          },
        ],
      },
      {
        id: 'examStructure',
        title: 'EXAMINATION STRUCTURE',
        type: 'objectives',
        content: [
          'SECTION A: Comprehension and Summary (25 questions)',
          '• 1 comprehension passage - 5 questions',
          '• 1 cloze passage - 10 questions',
          '• 1 reading text - 10 questions',
          'SECTION B: Lexis and Structure (25 questions)',
          '• Sentence interpretation - 5 questions',
          '• Antonyms - 5 questions',
          '• Synonyms - 5 questions',
          '• Basic Grammar - 10 questions',
          'SECTION C: Oral Forms (10 questions)',
          '• Vowels - 2 questions',
          '• Consonants - 2 questions',
          '• Rhymes - 2 questions',
          '• Word Stress - 2 questions',
          '• Emphatic Stress - 2 questions',
          'TOTAL: 60 questions',
        ],
      },
    ],
  };

  // Load saved data on component mount
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const [savedExplanations, savedActivation, savedUser] = await Promise.all([
        AsyncStorage.getItem('english_ai_explanations'),
        AsyncStorage.getItem('isActivated'),
        AsyncStorage.getItem('userInfo'),
      ]);
      
      if (savedExplanations) {
        setAiExplanations(JSON.parse(savedExplanations));
      }
      
      if (savedActivation === 'true') {
        setIsPremiumActivated(true);
      }
      
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserInfo(user);
        if (user?.userId) {
          await checkAiLimit(user.userId, 0, false);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const checkAiLimit = async (userId, usage = 0, showLoading = true) => {
    if (showLoading) {
      setIsCheckingLimit(true);
    }
    
    try {
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

  const calculateAiUsage = (prompt, aiResponse) => {
    const systemPrompt = 'You are an expert English Language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown.';
    const inputChars = systemPrompt.length + prompt.length;
    const outputChars = aiResponse.length;
    const totalChars = inputChars + outputChars;
    
    return {
      inputChars,
      outputChars,
      totalChars
    };
  };

  const saveExplanation = async (topicId, explanation) => {
    try {
      const updated = { ...aiExplanations, [topicId]: explanation };
      setAiExplanations(updated);
      await AsyncStorage.setItem('english_ai_explanations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
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

  const showAiLimitAlert = (currentLimit) => {
    Alert.alert(
      "Insufficient AI Credits",
      `You have ${currentLimit.toLocaleString()} AI characters remaining.\n\nMinimum required for AI analysis: 1,000 characters\n\nPlease purchase more credits to continue using AI assistance.`,
      [
        { text: "OK", style: "cancel" },
        { 
          text: "Buy Credits", 
          onPress: () => navigation.navigate('subscription')
        }
      ]
    );
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleTopic = (topicId) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }));
  };

  const handleAIButtonPress = async (topic) => {
    if (!isPremiumActivated) {
      Alert.alert(
        'Premium Feature Required',
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with clear examples.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate Premium',
            style: 'default',
            onPress: () => navigation.navigate('subscription')
          }
        ]
      );
      return;
    }

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'You need an internet connection to use AI features.'
      );
      return;
    }

    if (!userInfo?.userId) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to use AI features.'
      );
      return;
    }

    if (aiExplanations[topic.id]) {
      setSelectedTopic(topic);
      setAiResponse(aiExplanations[topic.id]);
      setAiModalVisible(true);
      return;
    }

    const limitCheck = await checkAiLimit(userInfo.userId, 0, true);
    
    if (!limitCheck.success) {
      Alert.alert("Subscription Error", limitCheck.message || "Unable to verify subscription.");
      return;
    }
    
    if (!limitCheck.hasEnoughLimit) {
      showAiLimitAlert(limitCheck.aiLimit);
      return;
    }

    await generateAIExplanation(topic);
  };

  const generateAIExplanation = async (topic) => {
    setSelectedTopic(topic);
    setAiLoadingTopics(prev => ({ ...prev, [topic.id]: true }));
    setIsLoading(true);

    try {
      const prompt = `As an English Language tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important steps
4. Include relevant rules and patterns
5. Give practical applications or real-world examples
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice problem at the end with ✅ solution
8. Use Nigerian context where applicable

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- \`code blocks\` for examples
- Tables if needed
- Clear section separation

Make it engaging and educational for Nigerian students.`;

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert English Language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings and bullet points.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const explanation = data.choices[0]?.message?.content || 'No response received';

      const usage = calculateAiUsage(prompt, explanation);
      
      if (userInfo?.userId) {
        const deductionResult = await checkAiLimit(userInfo.userId, usage.totalChars, false);
        
        if (deductionResult.success && deductionResult.deducted) {
          setAiLimit(deductionResult.aiLimit);
          
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
      
      await saveExplanation(topic.id, explanation);
      
      setAiResponse(explanation);
      setAiModalVisible(true);
    } catch (error) {
      console.error('AI Explanation Error:', error);
      Alert.alert(
        'Error',
        'Failed to get AI explanation. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setAiLoadingTopics(prev => ({ ...prev, [topic.id]: false }));
    }
  };

  const clearAllExplanations = async () => {
    Alert.alert(
      'Clear All Explanations',
      'This will delete all saved AI explanations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('english_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All explanations cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear explanations');
            }
          }
        }
      ]
    );
  };

  const renderAIButton = (topic) => {
    const isSaved = !!aiExplanations[topic.id];
    const isLoading = aiLoadingTopics[topic.id];

    return (
      <TouchableOpacity
        style={[
          styles.aiButton,
          isSaved && styles.aiButtonSaved,
          (isLoading || isCheckingLimit) && styles.aiButtonLoading,
          !isPremiumActivated && styles.aiButtonLocked,
        ]}
        onPress={() => handleAIButtonPress(topic)}
        disabled={isLoading || isCheckingLimit}
      >
        {isLoading || isCheckingLimit ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Icon 
              name={isSaved ? "auto-awesome" : "lightbulb"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'AI Notes' : 'AI Explain'}
            </Text>
            {isPremiumActivated && aiLimit > 0 && !isLoading && !isCheckingLimit && (
              <View style={styles.aiLimitBadge}>
                <Text style={styles.aiLimitText}>{aiLimit.toLocaleString()}</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerMain}>
        <Icon name="language" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>USE OF ENGLISH</Text>
          <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        {isPremiumActivated && aiLimit > 0 ? (
          <View style={styles.aiLimitContainer}>
            <Icon name="bar-chart" size={16} color="#28a745" />
            <Text style={styles.aiLimitHeaderText}>{aiLimit.toLocaleString()}</Text>
          </View>
        ) : null}
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllExplanations}
        >
          <Icon name="delete-sweep" size={20} color="white" />
          <Text style={styles.clearButtonText}>Clear AI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInfoCard = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Icon name="info" size={20} color="#3f51b5" />
        <Text style={styles.infoTitle}>How to Use</Text>
      </View>
      <View style={styles.infoContent}>
        <View style={styles.tipItem}>
          <Icon name="touch-app" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name={"auto-awesome"} size={16} color={isPremiumActivated ? "#ff9800" : "#999"} />
          <Text style={styles.tipText}>
            {isPremiumActivated ? 'AI Explain for detailed explanations' : 'Activate premium for AI explanations'}
          </Text>
        </View>
        {isPremiumActivated && aiLimit > 0 && (
          <View style={styles.tipItem}>
            <Icon name="bar-chart" size={16} color="#2196f3" />
            <Text style={styles.tipText}>
              {aiLimit.toLocaleString()} AI characters available
            </Text>
          </View>
        )}
        <View style={styles.tipItem}>
          <Icon name="save" size={16} color="#2196f3" />
          <Text style={styles.tipText}>AI explanations are saved for offline use</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="book" size={16} color="#9c27b0" />
          <Text style={styles.tipText}>Based on JAMB Use of English syllabus</Text>
        </View>
      </View>
    </View>
  );

  const renderSection = (section) => {
    const isExpanded = expandedSections[section.id];

    return (
      <View key={section.id} style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Icon 
            name={isExpanded ? "expand-less" : "expand-more"} 
            size={24} 
            color="#3f51b5" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#4caf50" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.topicsContainer}>
                {section.topics.map(topic => (
                  <View key={topic.id} style={styles.topicCard}>
                    <TouchableOpacity
                      style={styles.topicHeader}
                      onPress={() => toggleTopic(topic.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.topicHeaderContent}>
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        {renderAIButton(topic)}
                      </View>
                      <Icon 
                        name={expandedTopics[topic.id] ? "expand-less" : "expand-more"} 
                        size={20} 
                        color="#5c6bc0" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        <View style={styles.subsection}>
                          <View style={styles.subsectionHeader}>
                            <Icon name="list" size={16} color="#3f51b5" />
                            <Text style={styles.subsectionTitle}>Topics Covered:</Text>
                          </View>
                          {topic.content.map((item, idx) => (
                            <View key={idx} style={styles.contentItem}>
                              <Text style={styles.bullet}>•</Text>
                              <Text style={styles.contentText}>{item}</Text>
                            </View>
                          ))}
                        </View>

                        <View style={styles.subsection}>
                          <View style={styles.subsectionHeader}>
                            <Icon name="school" size={16} color="#3f51b5" />
                            <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                          </View>
                          {topic.objectives.map((item, idx) => (
                            <View key={idx} style={styles.objectiveItem}>
                              <Icon name="target" size={14} color="#ff9800" style={styles.bulletIcon} />
                              <Text style={styles.objectiveText}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        {Object.keys(aiExplanations).length} topics have AI notes saved
      </Text>
     
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderInfoCard()}

        {syllabusData.sections.map(section => renderSection(section))}

        {renderFooter()}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={aiModalVisible}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Icon name="auto-awesome" size={20} color="#ff9800" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - AI Explanation
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAiModalVisible(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={true}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3f51b5" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation...
                  </Text>
                </View>
              ) : (
                <Markdown style={markdownStyles}>
                  {aiResponse}
                </Markdown>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalActionButton}
                onPress={() => {
                  // Share functionality
                }}
              >
                <Icon name="share" size={20} color="#3f51b5" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Saved', 'AI explanation saved successfully!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Save Note
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    
    </View>
  );
};

// Reuse the exact same styles from Mathematics screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
  header: {
    backgroundColor: '#3f51b5',
    padding: 20,
    paddingTop:40,
    paddingLeft:7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 30,
    marginLeft: -100
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3f51b5',
    marginLeft: 8,
  },
  infoContent: {
    paddingLeft: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f2ff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#283593',
    flex: 1,
  },
  sectionContent: {
    padding: 16,
  },
  objectivesContainer: {
    paddingLeft: 8,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  objectiveText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    flex: 1,
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#f9f9ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  topicHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3949ab',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#4caf50',
  },
  aiButtonLoading: {
    backgroundColor: '#9e9e9e',
  },
  aiButtonLocked: {
    backgroundColor: '#757575',
  },
  aiIcon: {
    marginRight: 4,
  },
  aiButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  topicContent: {
    padding: 12,
    paddingTop: 0,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f51b5',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#3f51b5',
    marginRight: 8,
    fontSize: 16,
    marginTop: -1,
  },
  contentText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    flex: 1,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerReference: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#283593',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f51b5',
  },
  saveButton: {
    backgroundColor: '#3f51b5',
    borderColor: '#3f51b5',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f51b5',
    marginLeft: 6,
  },
  saveButtonText: {
    color: 'white',
  },
  aiLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 40,
    marginTop: -40,
  },
  aiLimitHeaderText: {
    color: '#529762ff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  aiLimitBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  aiLimitText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
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

// Reuse the exact same markdown styles
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#283593',
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3949ab',
    marginTop: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#1a237e',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    fontFamily: 'monospace',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 10,
  },
  bullet_list: {
    marginVertical: 10,
  },
  ordered_list: {
    marginVertical: 10,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#3f51b5',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#3f51b5',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default UseOfEnglishSyllabusScreen;