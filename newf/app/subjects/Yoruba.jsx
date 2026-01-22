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

const YorubaSyllabusScreen = () => {
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
  const navigation = useNavigation();

  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Stimulate and sustain interest in Yorubâ language, literature and culture',
          'Acquire basic knowledge and skill in Yorubâ language, literature and material and non-material aspects of culture',
        ],
      },
      {
        id: 'examStructure',
        title: 'EXAMINATION STRUCTURE',
        type: 'structure',
        content: [
          'Total Questions: 40 multiple-choice',
          'Language: 21 items (Comprehension, Essay, Sound System, Grammar, Orthography, Translation)',
          'Literature: 10 items (Oral 4, Written 6)',
          'Culture: 9 items',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: LANGUAGE',
        topics: [
          {
            id: 'A.1',
            title: 'Comprehension',
            content: [
              '1 prose and 1 verse passage',
              '8 multiple-choice items',
              'Current affairs, sports, education, politics, economy, health, culture, ethics',
            ],
            objectives: [
              'Identify central issues and draw appropriate conclusions',
              'Determine basic assumptions and express ideas',
              'Identify meanings and functions of phrases and sentences',
            ],
            aiPrompt: "Explain Yoruba comprehension strategies. Provide a sample prose passage about education in Nigeria. Create comprehension questions. Explain how to identify main themes and deduce lessons in Yoruba texts.",
          },
          {
            id: 'A.2',
            title: 'Essay Writing',
            content: [
              '1 essay writing item',
              'Different types of essays',
              'Techniques associated with each type',
            ],
            objectives: [
              'Identify different types of essay',
              'Apply techniques for each essay type',
            ],
            aiPrompt: "Explain Yoruba essay writing. Describe different types: narrative, descriptive, argumentative. Provide structure templates. Give examples of opening and closing paragraphs. List useful Yoruba essay vocabulary.",
          },
          {
            id: 'A.3',
            title: 'Sound System',
            content: [
              'Production of sounds (consonants and vowels)',
              'Tones and tone change',
              'Syllable structure',
              'Sound processes (co-vowel occurrence, elision, deletion)',
            ],
            objectives: [
              'Identify organs of speech and speech sounds',
              'Determine correct pronunciations',
              'Detect linguistic errors',
              'Determine syllable components',
              'Demonstrate knowledge of sound relationships',
            ],
            aiPrompt: "Explain Yoruba phonology. Cover consonants, vowels, and tones. Provide examples of tone changes. Explain syllable structures. Show examples of elision and deletion processes in Yoruba words.",
          },
          {
            id: 'A.4',
            title: 'Grammar',
            content: [
              'Morphology – Word-formation',
              'Loan-word integration',
              'Word classes (nouns, verbs, adjectives, adverbs, pronouns, etc.)',
              'Phrases and clauses – types and functions',
              'Sentences – types, structures and functions',
            ],
            objectives: [
              'Demonstrate knowledge of word derivation',
              'Demonstrate knowledge of word adoption',
              'Identify appropriate word classes',
              'Demonstrate understanding of Yoruba syntax',
              'Identify types, structures and functions of sentences',
            ],
            aiPrompt: "Explain Yoruba grammar comprehensively. Cover morphology with examples of word formation. Explain loan word integration from English. Detail all word classes with examples. Provide sentence structure analysis.",
          },
          {
            id: 'A.5',
            title: 'Current Orthography',
            content: [
              'Standard Yoruba writing system',
              'Accepted written forms',
            ],
            objectives: [
              'Present ideas in acceptable written form',
            ],
            aiPrompt: "Explain modern Yoruba orthography rules. Cover diacritics, tone marking, and spelling rules. Provide examples of correct vs incorrect spellings. Explain standard writing conventions.",
          },
          {
            id: 'A.6',
            title: 'Translation',
            content: [
              'Translation between Yoruba and English',
              'Interpretation principles',
            ],
            objectives: [
              'Interpret sentences and ideas according to acceptable principles',
            ],
            aiPrompt: "Explain translation techniques between Yoruba and English. Provide examples of common translation challenges. Give practice sentences with solutions. Explain idiomatic expressions translation.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: LITERATURE',
        topics: [
          {
            id: 'B.1',
            title: 'Oral Literature - Prose',
            content: [
              'Babalolá, A. (2018). Ákójopó Áló Íjápá (Apá Kín-in-ní)',
            ],
            objectives: [
              'Identify central issues and component parts',
              'Draw moral lessons from texts',
              'Identify figurative and idiomatic expressions',
              'Draw appropriate conclusions',
            ],
            aiPrompt: "Analyze 'Ákójopó Áló Íjápá'. Explain the themes, characters, and moral lessons. Identify key figurative expressions. Provide cultural context of Ijapa stories.",
          },
          {
            id: 'B.2',
            title: 'Oral Literature - Poetry',
            content: [
              'Babalolá, A. (2001). Áwon Oríki Orilè Métádinlógbón',
              'Pages: i-ix & 117-314',
            ],
            objectives: [
              'Deduce logical inferences from abstract relations',
              'Identify figurative and idiomatic expressions',
            ],
            aiPrompt: "Analyze Yoruba Oriki poetry. Explain the structure and purpose of Oríkì. Provide examples from the text. Explain cultural significance and poetic devices used.",
          },
          {
            id: 'B.3',
            title: 'Written Literature - Prose',
            content: [
              'Awé, D. (2016). Morèmi Ájásoró',
            ],
            objectives: [
              'Demonstrate knowledge of ideas in the work',
              'Draw moral lessons from the text',
              'Identify narrative techniques',
              'Identify figurative and idiomatic expressions',
            ],
            aiPrompt: "Analyze 'Morèmi Ájásoró'. Explain the historical context. Discuss character development and themes. Identify narrative techniques and their effectiveness.",
          },
          {
            id: 'B.4',
            title: 'Written Literature - Poetry',
            content: [
              'Ákànji, A. (2017). Óró Emu Akèwi',
            ],
            objectives: [
              'Deduce import of written works and genres',
              'Identify figurative and idiomatic expressions',
            ],
            aiPrompt: "Analyze 'Óró Emu Akèwi'. Explain poetic devices used. Discuss themes and messages. Provide line-by-line analysis of selected stanzas.",
          },
          {
            id: 'B.5',
            title: 'Written Literature - Drama',
            content: [
              'Ísólá, A. (2014). Nítori Owó',
            ],
            objectives: [
              'Identify central theme of the work',
              'Interpret according to societal principles',
              'Identify types of drama',
              'Identify figurative and idiomatic expressions',
              'Extract narrative techniques',
            ],
            aiPrompt: "Analyze the drama 'Nítori Owó'. Discuss themes of money and morality. Analyze character motivations. Explain dramatic techniques used. Provide cultural context.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: CULTURE',
        topics: [
          {
            id: 'C.1',
            title: 'Éró àti Ìgbàgbó (Beliefs)',
            content: [
              'Olódùmarè, ákùdáàyà, emèré, àjé, àwon irúnmolé',
              'Traditional beliefs and practices',
            ],
            objectives: [
              'Distinguish traditional practices from modern beliefs',
            ],
            aiPrompt: "Explain Yoruba traditional beliefs. Discuss Olodumare, Orishas, and spiritual beings. Compare traditional and modern perspectives. Explain cultural significance.",
          },
          {
            id: 'C.2',
            title: 'Étó Ìşèlú àti Ààbò Ílú (Governance)',
            content: [
              'Egbé àti ogbà, oyè jije, ogun jijà',
              'Community organization and leadership',
            ],
            objectives: [
              'Assess roles in ensuring peace and stability',
            ],
            aiPrompt: "Explain traditional Yoruba governance. Discuss social organization, chieftaincy, and conflict resolution. Provide historical examples of community leadership.",
          },
          {
            id: 'C.3',
            title: 'Étó Ìsinkú àti Ogún Pìnpín (Burial & Inheritance)',
            content: [
              'Òkú àgbà, òkú ófò, òkú òòşà, itúfò, ilè òkú gbigbé',
              'Burial rites and inheritance practices',
            ],
            objectives: [
              'Distinguish between traditional practices',
              'Relate them to funerals and inheritance',
            ],
            aiPrompt: "Explain Yoruba burial rites and inheritance. Compare different types of burials. Discuss traditional inheritance laws and their modern adaptations.",
          },
          {
            id: 'C.4',
            title: 'Òòkà Yorùbá (Numerals)',
            content: [
              'Numbers 1-20,000',
              'Addition, subtraction, and division methods',
            ],
            objectives: [
              'Count in Yoruba numerals',
              'Apply arithmetic methods in Yoruba',
            ],
            aiPrompt: "Teach Yoruba numerals 1-20,000. Provide counting exercises. Explain traditional arithmetic methods. Give practical examples of calculations in Yoruba.",
          },
          {
            id: 'C.5',
            title: 'Ayeye (Festivities)',
            content: [
              'Social activities and events',
              'Cultural celebrations',
            ],
            objectives: [
              'Relate social activities to appropriate situations',
            ],
            aiPrompt: "Explain Yoruba festivities and celebrations. Discuss major festivals, ceremonies, and their cultural significance. Provide vocabulary for different celebrations.",
          },
          {
            id: 'C.6',
            title: 'Ètô Ìwòsàn (Health Care)',
            content: [
              'Traditional health practices',
              'Healthcare methods',
            ],
            objectives: [
              'Demonstrate knowledge of appropriate health care practices',
            ],
            aiPrompt: "Explain traditional Yoruba healthcare. Discuss herbal medicine, preventive practices, and treatment methods. Compare traditional and modern approaches.",
          },
          {
            id: 'C.7',
            title: 'Eré Ìdárayá (Sports/Games)',
            content: [
              'Traditional games and sports',
              'Rules and regulations',
            ],
            objectives: [
              'Identify types of traditional games',
              'Identify rules and regulations',
              'Mention values derived from games',
            ],
            aiPrompt: "Describe Yoruba traditional games. Explain rules of popular games like Ayo, Ijakadi. Discuss cultural values and skills developed through games.",
          },
          {
            id: 'C.8',
            title: 'Isé Abînibí àti Oúnjè Ilé Yorùbá (Professions & Cuisine)',
            content: [
              'Traditional professions',
              'Yoruba cuisine and food preparation',
            ],
            objectives: [
              'Demonstrate knowledge of traditional professions',
              'Compare various professions',
              'Demonstrate knowledge of food preparation',
              'Mention nutritional values',
            ],
            aiPrompt: "Explain traditional Yoruba professions and cuisine. Discuss occupations like farming, weaving, blacksmithing. Provide recipes for popular Yoruba dishes with nutritional information.",
          },
          {
            id: 'C.9',
            title: 'Èkó Ilé (Home Training)',
            content: [
              'Patterns of behavior and attitude',
              'Societal norms and values',
            ],
            objectives: [
              'Identify acceptable patterns of behavior',
            ],
            aiPrompt: "Explain Yoruba home training (Omoluabi values). Discuss respect, responsibility, and community values. Provide examples of proper conduct in various situations.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Abiódún, J. (1995). Áröko ait Advan Ögbufö',
          'Adéwolé, L. O. et al (2000). Exam Focus – Yorùbá Language for WASSCE/SSCE',
          'Awóbùlúyì, O. (1978). Essentials of Yorùbá Grammar',
          'Awóbùlúyì, O. (ed.) (1990). Yorùbá Metalanguage (Èdè-Iperí Yorùbá) Vol. II',
          'Babalolá, A. (ed.) (1991). Îwé Îmódõtun Yorùbá SSI – SSIII',
          'Adéoyè, C. L. (1979). Âşà àti Îşe Yorùbá',
          'Adéoyè, C. L. (1985). Îgbâgbó àti Èsin Yorùbá',
          'All prescribed literature texts from syllabus',
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
        AsyncStorage.getItem('yoruba_ai_explanations'),
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

  // AI limit check function
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

  // Calculate AI usage function
  const calculateAiUsage = (prompt, aiResponse) => {
    const systemPrompt = 'You are an expert Yoruba language and literature tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with cultural context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and Yoruba language examples.';
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
      await AsyncStorage.setItem('yoruba_ai_explanations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
  };

  // Internet check function
  const checkInternetConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected;
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  };

  // AI limit alert
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
    // Check if premium is activated
    if (!isPremiumActivated) {
      Alert.alert(
        'Premium Feature Required',
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Yoruba explanations with clear examples.',
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
      const prompt = `As a Yoruba language and literature expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important steps
4. Include relevant Yoruba language examples with proper diacritics
5. Give practical applications or cultural examples
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice exercise at the end with ✅ solution
8. Use Nigerian context where applicable

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- Yoruba language examples with tone marks
- Clear section separation
- Include English translations for Yoruba examples in parentheses

Make it engaging and educational for JAMB candidates.`;

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
              content: 'You are an expert Yoruba language and literature tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with cultural context. Use step-by-step examples, provide Yoruba language examples with proper diacritics, and format responses in markdown.'
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
              await AsyncStorage.removeItem('yoruba_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Yoruba explanations cleared');
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
              name={isSaved ? "auto-awesome" : "translate"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'AI Notes' : 'AI Explain'}
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerMain}>
        <Icon name="language" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>YORUBA</Text>
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
        <Icon name="info" size={20} color="#7B1FA2" />
        <Text style={styles.infoTitle}>How to Use</Text>
      </View>
      <View style={styles.infoContent}>
        <View style={styles.tipItem}>
          <Icon name="touch-app" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="translate" size={16} color={isPremiumActivated ? "#FF9800" : "#999"} />
          <Text style={styles.tipText}>
            {isPremiumActivated ? 'AI Explain for Yoruba explanations' : 'Activate premium for AI explanations'}
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
            color="#7B1FA2" 
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
            ) : section.type === 'structure' ? (
              <View style={styles.structureContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.structureItem}>
                    <Icon name="assignment" size={16} color="#9C27B0" style={styles.bulletIcon} />
                    <Text style={styles.structureText}>{item}</Text>
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
                        color="#9C27B0" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#7B1FA2" />
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
                              <Icon name="school" size={16} color="#7B1FA2" />
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
                <Icon name="translate" size={20} color="#FF9800" />
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
                  <ActivityIndicator size="large" color="#7B1FA2" />
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
                <Icon name="share" size={20} color="#7B1FA2" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
  header: {
    backgroundColor: '#7B1FA2',
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
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumButtonText: {
    color: '#FFD700',
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
    marginTop: 30,
    marginLeft: -95
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
    color: '#7B1FA2',
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
    backgroundColor: '#F3E5F5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B1FA2',
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
  structureContainer: {
    paddingLeft: 8,
  },
  structureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  structureText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
    color: '#7B1FA2',
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
    color: '#7B1FA2',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#7B1FA2',
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
    color: '#7B1FA2',
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
    borderColor: '#7B1FA2',
  },
  saveButton: {
    backgroundColor: '#7B1FA2',
    borderColor: '#7B1FA2',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7B1FA2',
    marginLeft: 6,
  },
  saveButtonText: {
    color: 'white',
  },
  // AI Limit Styles
  aiLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 50,
    marginTop: -40,
  },
  aiLimitHeaderText: {
    color: '#28a745',
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

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 28, // More space for Yoruba text
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7B1FA2',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8E24AA',
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9C27B0',
    marginTop: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#7B1FA2',
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
  },
  code_block: {
    backgroundColor: '#f8f9fa',
    fontFamily: 'System',
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
    color: '#7B1FA2',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#7B1FA2',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
  },
  link: {
    color: '#7B1FA2',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#7B1FA2',
    paddingLeft: 10,
    marginVertical: 10,
    paddingVertical: 5,
  },
});

export default YorubaSyllabusScreen;