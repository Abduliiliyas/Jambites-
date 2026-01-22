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

// API Configuration
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api';

const ArabicSyllabusScreen = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoadingTopics, setAiLoadingTopics] = useState({});
  const [aiExplanations, setAiExplanations] = useState({});
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [isPremiumActivated, setIsPremiumActivated] = useState(false);
  const [aiLimit, setAiLimit] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [isCheckingLimit, setIsCheckingLimit] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Answer comprehension questions correctly in standard Arabic',
          'Translate simple texts from English to Arabic and vice versa',
          'Apply the rules of Arabic grammar functionally',
          'Appreciate Arabic literary texts within the contexts of their environment and eras',
          'Use Arabic as a living world language in communication where necessary',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: COMPREHENSION',
        topics: [
          {
            id: 'A.1',
            title: 'Comprehension Passage',
            content: [
              'Passage of seventy (70) words',
              'Five multiple-choice questions',
              'Contents within candidate experience: current affairs, sports, education, politics, economy, health, culture, ethics',
            ],
            objectives: [
              'Use appropriate words or phrases for specific thought',
              'Deduce the lesson in the passage',
              'Determine the main themes of the passage',
              'Give an appropriate title to the passage',
              'Interpret the meanings of particular words',
            ],
            aiPrompt: "Explain Arabic comprehension strategies. Provide a 70-word sample passage about education in Nigeria. Create 5 comprehension questions with answers. Explain how to identify main themes and deduce lessons. Give tips for vocabulary in context.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: TRANSLATION',
        topics: [
          {
            id: 'B.1',
            title: 'Translation Exercises',
            content: [
              'Ten (10) questions total',
              'Five translation from English to Arabic',
              'Five translation from Arabic to English',
              'Based on standard Arabic and English usages',
              'Includes key words and phrases',
            ],
            objectives: [
              'Use appropriate Arabic word/phrase for English meaning',
              'Determine appropriate English for Arabic statements',
              'Interpret idiomatic expressions in both languages',
              'Transfer ideas between Arabic and English',
              'Communicate effectively in both languages',
            ],
            aiPrompt: "Explain translation techniques between Arabic and English. Provide examples: 'The student reads the book' to Arabic. Translate Arabic sentence 'الطالب يقرأ الكتاب' to English. Explain common pitfalls. Give 5 practice sentences with solutions.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: GRAMMAR',
        topics: [
          {
            id: 'C.1',
            title: 'Pronouns & Gender',
            content: [
              'Demonstrative, relative, conditional, interrogative pronouns',
              'Gender (Masculine and Feminine) المذكر والمؤنث',
              'Characteristics of noun علامت الأسم',
              'Dual المقنى',
              'Plurals الجموع',
            ],
            objectives: [
              'Identify various forms of pronouns',
              'Compare gender markers in Arabic',
              'Identify characteristics of Arabic nouns',
              'Differentiate between singular and dual forms',
              'Construct plural forms',
            ],
            aiPrompt: "Explain Arabic pronouns and gender rules. Provide examples of demonstrative pronouns (هذا، هذه). Explain masculine vs feminine nouns (طالب/طالبة). Show dual forms (طالبان، طالبتان). Demonstrate sound and broken plurals.",
          },
          {
            id: 'C.2',
            title: 'Constructs & Pronouns',
            content: [
              'Construct phrases المشاف والمضاف إليه',
              'Separable and inseparable pronouns الضمائر المنفصلة والمتصلة',
              'Followers التوابع: adjective, conjunction, permutative, emphasis',
            ],
            objectives: [
              'Identify and construct phrases',
              'Differentiate between pronoun types',
              'Identify correct usage of adjectives, conjunctions, etc.',
            ],
            aiPrompt: "Explain construct phrases (إضافة) like بيت الطالب. Differentiate between attached pronouns (ضمائر متصلة) like كتابي and separate pronouns (ضمائر منفصلة) like أنا. Show adjective agreement examples.",
          },
          {
            id: 'C.3',
            title: 'Verbs & Modifiers',
            content: [
              'Prepositions حروف الجر والنصب والجزم',
              'Transitive & Intransitive verbs الفعل اللازم والفعل المتعدي',
              'Perfect verb الفعل الماضي',
              'Imperfect verb (indicative, subjunctive, jussive)',
              'Imperative verb',
              'Modifiers (Kana, Inna, Zanna and associates)',
            ],
            objectives: [
              'Apply correct prepositions',
              'Differentiate transitive/intransitive verbs',
              'Identify perfect verbs',
              'Identify imperfect verbs',
              'Identify imperative verbs',
              'Identify and apply modifiers',
            ],
            aiPrompt: "Explain Arabic verb forms. Show past tense (فعل ماضي) مثل كتب. Present tense (فعل مضارع) مثل يكتب. Imperative (فعل أمر) مثل اكتب. Explain كان وأخواتها with examples.",
          },
          {
            id: 'C.4',
            title: 'Advanced Grammar',
            content: [
              'Trilateral and derived verbs',
              'Verbal noun',
              'Derivatives: active/passive participles, comparative, noun of instrument, etc.',
              'Conditional sentences',
              'Numerals (1 – 1000)',
              'Active and passive voices',
              'Subject and predicate',
              'Nouns in accusative cases',
            ],
            objectives: [
              'Differentiate trilateral and derived verbs',
              'Identify types of derivatives',
              'Apply conditional sentence rules',
              'Recognize Arabic numerals 1-1000',
              'Distinguish active/passive voices',
              'Identify adverbial clauses and vocative',
            ],
            aiPrompt: "Explain derived verbs (أفعال مشتقة) and patterns. Show active participle (اسم الفاعل) مثل كاتب. Passive participle (اسم المفعول) مثل مكتوب. Teach Arabic numbers 1-100 with examples. Explain conditional sentences إن/إذا.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: COMPOSITION',
        topics: [
          {
            id: 'D.1',
            title: 'Composition Writing',
            content: [
              'Five (5) questions',
              'Subjects related to candidates lives and environment',
              'Topics: education, culture, health, politics, economy, sports, current affairs',
            ],
            objectives: [
              'Write coherent compositions in Arabic',
              'Express ideas clearly on given topics',
              'Use appropriate vocabulary and structure',
              'Apply grammatical rules in writing',
            ],
            aiPrompt: "Guide for Arabic composition writing. Provide structure for essay writing. Give vocabulary lists for common topics. Show sample introduction and conclusion paragraphs. Provide topic sentences examples.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'SECTION E: ARABIC LITERATURE',
        topics: [
          {
            id: 'E.1',
            title: 'Literature Introduction',
            content: [
              'Introduction to Arabic literature',
              'Definition, divisions, arts of literature',
              'Literary periods',
              'Poetry and prose definitions and purposes',
            ],
            objectives: [
              'Identify essence of Arabic literature',
              'Recognize poetry and prose periods',
              'Understand literary arts and divisions',
            ],
            aiPrompt: "Introduce Arabic literature. Explain major periods: Pre-Islamic, Islamic, Modern. Define poetry (شعر) and prose (نثر). List major literary arts. Provide timeline of Arabic literature development.",
          },
          {
            id: 'E.2',
            title: 'Pre-Islamic Period (500 – 610 C.E.)',
            content: [
              'Zuhayr ibn Abi Sulma and his didactic poem',
              'Hashim ibn Abd Manaf and his speech on noble morals',
            ],
            objectives: [
              'Identify Pre-Islamic poetic traditions',
              'Analyze figurative expressions',
              'Understand literary conventions',
            ],
            aiPrompt: "Explain Pre-Islamic (Jahiliyyah) literature. Analyze Zuhayr ibn Abi Sulma's poem. Discuss Hashim ibn Abd Manaf's speeches. Explain mu'allaqat (المعلقات) and their significance.",
          },
          {
            id: 'E.3',
            title: 'Islamic Period (610 – 1798 C.E.)',
            content: [
              'Prophet Muhammad\'s speech on conquest of Mecca',
              'Ka\'b ibn Zuhayr and his poem "Banat Suad"',
              'Debate between al-Farazdaq and Jarir',
              'Al-Mutanabbi and his panegyric',
            ],
            objectives: [
              'Analyze Islamic literature style',
              'Describe aesthetic features',
              'Assess cultural values',
            ],
            aiPrompt: "Explain Islamic period literature. Analyze Prophet Muhammad's speeches. Discuss Ka'b ibn Zuhayr's 'Banat Suad'. Explain the poetic duel between al-Farazdaq and Jarir. Analyze al-Mutanabbi's style.",
          },
          {
            id: 'E.4',
            title: 'Modern Period (1798 to date)',
            content: [
              'Mahmoud Sami al-Barudi and his pride poem',
              'Hafez Ibrahim and his poem "Arabic Language"',
              'Murtada Bamasi and his book "Future of Arabic in Nigeria"',
            ],
            objectives: [
              'Evaluate modern literary texts',
              'Assess contemporary cultural values',
              'Analyze modern poetry styles',
            ],
            aiPrompt: "Explain modern Arabic literature revival (al-Nahda). Analyze Mahmoud Sami al-Barudi's neoclassicism. Discuss Hafez Ibrahim's nationalist poetry. Explain Murtada Bamasi's contributions to Arabic in West Africa.",
          },
          {
            id: 'E.5',
            title: 'West African Arabic Literature',
            content: [
              'Sheikh Abdullahi ibn Fodio and his response poem',
              'Muhammad Tukur Mai Angwa and his novel "Why Do They Hate Us"',
              'Sheikh Adam Abdullah al-Ilory and his speech on virtue of knowledge',
              'Dr. Isa Abubakar Abu Zikr and his contemporary poem',
            ],
            objectives: [
              'Evaluate Arabic as medium in West Africa',
              'Analyze contents and characteristics',
              'Describe plots and themes',
            ],
            aiPrompt: "Explain Arabic literature in West Africa. Discuss Sheikh Abdullahi ibn Fodio's scholarly contributions. Analyze the Sokoto Caliphate literary tradition. Explain modern West African Arabic novels and poetry.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Bashir Ahmad Muhyiddin & al-Murtada Mukhtar al-Murtada: al-Mutala\'ah al-Wadihah',
          'Sayyid Hamid Malik (2005): al-Insha\' al-ʻArabi al-Mutawassit',
          'Abd al-Fattah Sabri & Ali Umar Bak: al-Qira\'ah al-Rashidah, Parts 1-4',
          'Abdullah al-Tayyib: Samir al-Talamidh, Parts 1-2',
          'Haywood & Nahmad (1965): A New Arabic Grammar of the Written Language',
          'Arabic newspapers, magazines and journals',
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
        AsyncStorage.getItem('arabic_ai_explanations'),
        AsyncStorage.getItem('isPremiumActivated'),
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

  // Check AI limit from backend
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

  // Calculate AI usage characters
  const calculateAiUsage = (prompt, aiResponse) => {
    const systemPrompt = 'You are an expert Arabic language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples, provide Arabic script with proper diacritics, and format responses in markdown.';
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
      await AsyncStorage.setItem('arabic_ai_explanations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
  };

  const activatePremium = async () => {
    try {
      await AsyncStorage.setItem('isPremiumActivated', 'true');
      setIsPremiumActivated(true);
      setSubscriptionModalVisible(false);
      Alert.alert('Success', 'Premium features activated!');
      
      if (userInfo?.userId) {
        await checkAiLimit(userInfo.userId, 0, false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to activate premium');
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
          onPress: () => {} // You can add navigation here
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
    // Check if premium is activated
    if (!isPremiumActivated) {
      Alert.alert(
        'Premium Feature Required',
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with markdown formatting.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate Premium',
            style: 'default',
            onPress: () => setSubscriptionModalVisible(true)
          }
        ]
      );
      return;
    }

    // Check internet connection
    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      Alert.alert(
        'No Internet Connection',
        'You need an internet connection to use AI features.'
      );
      return;
    }

    // Check if user is logged in
    if (!userInfo?.userId) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to use AI features.'
      );
      return;
    }

    // If already have cached explanation, show it
    if (aiExplanations[topic.id]) {
      setSelectedTopic(topic);
      setAiResponse(aiExplanations[topic.id]);
      setAiModalVisible(true);
      return;
    }

    // Check AI limit before generating
    const limitCheck = await checkAiLimit(userInfo.userId, 0, true);
    
    if (!limitCheck.success) {
      Alert.alert("Subscription Error", limitCheck.message || "Unable to verify subscription.");
      return;
    }
    
    if (!limitCheck.hasEnoughLimit) {
      showAiLimitAlert(limitCheck.aiLimit);
      return;
    }

    // All checks passed - generate AI explanation
    await generateAIExplanation(topic);
  };

  const generateAIExplanation = async (topic) => {
    setSelectedTopic(topic);
    setAiLoadingTopics(prev => ({ ...prev, [topic.id]: true }));
    setIsLoading(true);

    try {
      const prompt = `As an Arabic language and literature expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Arabic:
1. Start with a clear definition in ## H2 heading
2. Explain concepts in simple terms with Arabic examples and English translations
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important rules
4. Include relevant Arabic grammar rules using \`code blocks\` for Arabic text
5. Give practical applications with Nigerian context
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice exercises at the end with ✅ solutions
8. Include Arabic script with diacritics where necessary

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key terms
- \`code blocks\` for Arabic examples
- Include translations in parentheses
- Make it engaging for Nigerian students

Write in clear, educational Arabic instruction style.`;

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
              content: 'You are an expert Arabic language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples, provide Arabic script with proper diacritics, and format responses in markdown.'
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

      // Calculate AI usage and deduct from limit
      const usage = calculateAiUsage(prompt, explanation);
      
      // Deduct AI usage from user's limit
      if (userInfo?.userId) {
        const deductionResult = await checkAiLimit(userInfo.userId, usage.totalChars, false);
        
        if (deductionResult.success && deductionResult.deducted) {
          setAiLimit(deductionResult.aiLimit);
          
          // Show brief usage notification
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
      
      // Save to cache
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
              await AsyncStorage.removeItem('arabic_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Arabic explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "translate" : "lock"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'AI Notes' : isPremiumActivated ? 'AI Explain' : 'Locked'}
            </Text>
            {/* Show AI limit for premium users */}
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
            color="#2E7D32" 
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
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#795548" style={styles.bulletIcon} />
                    <Text style={styles.textbookText}>{item}</Text>
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
                        color="#388E3C" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#2E7D32" />
                              <Text style={styles.subsectionTitle}>Topics Covered:</Text>
                            </View>
                            {topic.content.map((item, idx) => (
                              <View key={idx} style={styles.contentItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.contentText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {topic.objectives && topic.objectives.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="school" size={16} color="#2E7D32" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#FF9800" style={styles.bulletIcon} />
                                <Text style={styles.objectiveText}>{item}</Text>
                              </View>
                            ))}
                          </View>
                        )}
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

  const renderSubscriptionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={subscriptionModalVisible}
      onRequestClose={() => setSubscriptionModalVisible(false)}
    >
      <View style={styles.subscriptionOverlay}>
        <View style={styles.subscriptionContainer}>
          <View style={styles.subscriptionHeader}>
            <Icon name="workspace-premium" size={40} color="#FFD700" />
            <Text style={styles.subscriptionTitle}>Unlock Premium Features</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Arabic Explanations</Text>
                <Text style={styles.featureDescription}>Get detailed, step-by-step explanations with Arabic script and markdown formatting</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Grammar & Translation Help</Text>
                <Text style={styles.featureDescription}>Expert Arabic grammar explanations and translation practice</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Character Credits</Text>
                <Text style={styles.featureDescription}>Access AI explanations with character-based credit system</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Ad-Free Experience</Text>
                <Text style={styles.featureDescription}>Study Arabic without interruptions</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits</Text>
            </View>
          </View>

          <View style={styles.subscriptionFooter}>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.cancelButton]}
              onPress={() => setSubscriptionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.activateButton]}
              onPress={activatePremium}
            >
              <Icon name="lock-open" size={20} color="white" />
              <Text style={styles.activateButtonText}>Activate Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
<View style={styles.header}>
  <View style={styles.headerMain}>
    <Icon name="language" size={32} color="white" style={styles.headerIcon} />
    <View>
      <Text style={styles.headerTitle}>ARABIC</Text>
      <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
    </View>
  </View>
  <View style={styles.headerRight}>
    {!isPremiumActivated ? (
      <View style={styles.headerRightStack}>
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => setSubscriptionModalVisible(true)}
        >
          <Icon name="workspace-premium" size={16} color="#FFD700" />
          <Text style={styles.premiumButtonText}>Go Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllExplanations}
        >
          <Icon name="delete-sweep" size={20} color="white" />
          <Text style={styles.clearButtonText}>Clear AI</Text>
        </TouchableOpacity>
      </View>
    ) : aiLimit > 0 ? (
      <View style={styles.headerRightStack}>
        <View style={styles.aiLimitContainer}>
          <Icon name="bar-chart" size={16} color="#28a745" />
          <Text style={styles.aiLimitHeaderText}>{aiLimit.toLocaleString()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllExplanations}
        >
          <Icon name="delete-sweep" size={20} color="white" />
          <Text style={styles.clearButtonText}>Clear AI</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        style={styles.clearButton}
        onPress={clearAllExplanations}
      >
        <Icon name="delete-sweep" size={20} color="white" />
        <Text style={styles.clearButtonText}>Clear AI</Text>
      </TouchableOpacity>
    )}
  </View>
</View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color="#2E7D32" />
            <Text style={styles.infoTitle}>How to Use</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#4caf50" />
              <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "translate" : "lock"} size={16} color={isPremiumActivated ? "#FF9800" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Explain for Arabic explanations' : 'Activate premium for AI explanations'}
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
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} topics have AI notes saved
          </Text>
          
        </View>
      </ScrollView>

      {/* AI Explanation Modal with Markdown */}
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
                <Icon name="translate" size={20} color="#2E7D32" />
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
                  <ActivityIndicator size="large" color="#2E7D32" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with markdown formatting...
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
                <Icon name="share" size={20} color="#2E7D32" />
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

      {/* Subscription Modal */}
      {renderSubscriptionModal()}
      
      
    </View>
  );
};

// Markdown styles for Arabic
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#388E3C',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'right',
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    fontFamily: 'System',
    fontSize: 15,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  bullet_list: {
    marginVertical: 10,
  },
  ordered_list: {
    marginVertical: 10,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#2E7D32',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#2E7D32',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    paddingLeft: 10,
    marginVertical: 10,
    paddingVertical: 5,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
header: {
  backgroundColor: '#2E7D32',
  padding: 20,
  paddingTop:40,
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
  alignItems: 'flex-end', // Changed from 'center' to 'flex-end'
  gap: 4, // Reduced gap for vertical stacking
},
headerRightStack: {
  alignItems: 'center', // Center the stacked items
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
premiumButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 215, 0, 0.2)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#FFD700',
  marginBottom: 4, // Added margin to separate from clear button
},
premiumButtonText: {
  color: '#FFD700',
  fontSize: 12,
  fontWeight: '600',
  marginLeft: 4,
},
aiLimitContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  marginBottom: 4, // Added margin to separate from clear button
},
aiLimitHeaderText: {
  color: '#28a745',
  fontSize: 12,
  fontWeight: '600',
  marginLeft: 4,
},
clearButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 20,
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
    color: '#2E7D32',
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
    backgroundColor: '#E8F5E9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
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
  textbooksContainer: {
    paddingLeft: 8,
  },
  textbookItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  textbookText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    backgroundColor: '#f9f9ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    color: '#2E7D32',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
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
    color: '#2E7D32',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#2E7D32',
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
  },
  // Modal Styles
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
    color: '#1B5E20',
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
    borderColor: '#2E7D32',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginLeft: 6,
  },
  saveButtonText: {
    color: 'white',
  },
  // Subscription Modal Styles
  subscriptionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  subscriptionHeader: {
    backgroundColor: '#2E7D32',
    padding: 30,
    alignItems: 'center',
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  subscriptionContent: {
    padding: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingContainer: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  pricingNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  subscriptionFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  subscriptionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activateButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  // AI Limit Checking Popup
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

export default ArabicSyllabusScreen;