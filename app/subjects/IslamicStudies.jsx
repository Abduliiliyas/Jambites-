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

const IslamicStudiesSyllabusScreen = () => {
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

  // Islamic Studies Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Master the Qur\'ān and Sunnah as foundations of Islamic and social life',
          'Be familiar with Islamic heritage, culture and civilization',
          'Be acquainted with the tradition of Islamic scholarship and intellectual discourse',
          'Demonstrate knowledge of Islamic moral, spiritual, economic, political and social values',
          'Be exposed to the fundamental principles of Islam',
          'Be prepared to face the challenges of life as good practising Muslims',
        ],
      },
      {
        id: 'part1',
        title: 'PART I: THE QUR\'ĀN AND HADĪTH',
        topics: [
          {
            id: '1.1',
            title: 'Revelation of the Glorious Qur\'ān',
            content: [
              'Visits of the Prophet (SAW) to Cave Hira',
              'His reaction to the first revelation and its importance',
              'Different modes of revelation (Q.42:51): inspiration behind the veil, through an angel',
              'Piecemeal revelation (Q.17:106) (Q.25:32)',
            ],
            objectives: [
              'Analyze the Prophet\'s (SAW) visits to Cave Hira and the purpose',
              'Describe the Prophet\'s reaction to the first revelation and its importance',
              'Differentiate between the modes of revelation',
              'Explain why the Glorious Qur\'ān was revealed piecemeal',
            ],
            aiPrompt: "Explain the revelation of the Glorious Qur'ān. Cover: Prophet Muhammad's (SAW) experiences in Cave Hira, modes of revelation (wahy), piecemeal revelation. Discuss the significance of revelation in Islamic theology and the uniqueness of Qur'anic revelation compared to other scriptures.",
          },
          {
            id: '1.2',
            title: 'Preservation of the Glorious Qur\'ān',
            content: [
              'Recording, compilation and standardization of the Qur\'ān',
              'Differences between Makkah and Madinan suwar',
              'The role played by the Companions of the Prophet (SAW) on collection and compilation',
            ],
            objectives: [
              'Analyze how the Glorious Qur\'ān was recorded, compiled and standardized',
              'Differentiate between Makkan and Madinan suwar',
              'Evaluate the role played by the companions on collection and compilation',
            ],
            aiPrompt: "Explain the preservation of the Qur'an. Cover: compilation during Abu Bakr and Uthman's caliphates, differences between Makkan and Madinan chapters, role of Sahaba. Discuss the authenticity of Qur'anic text and comparison with preservation of other religious texts.",
          },
          {
            id: '1.3',
            title: 'Importance and Authenticity of the Glorious Qur\'ān',
            content: [
              'Importance as source of guidance in spiritual, moral, economic, political and socio-cultural matters',
              'Proof of Divine authenticity (Q.4:82) (Q.41:42)',
              'Uniqueness of the Glorious Qur\'ān (Q.39:27) (Q.17:88) (Q.75:16-19)',
              'Divine preservation (Q.15:9)',
            ],
            objectives: [
              'Examine the importance of the Glorious Qur\'ān',
              'Evaluate the proof of divine authenticity',
              'Evaluate the uniqueness of the Glorious Qur\'ān',
              'Examine the ways by which the Qur\'ān was preserved',
            ],
            aiPrompt: "Explain the importance and authenticity of the Qur'an. Cover: guidance in all aspects of life, proofs of divine origin (scientific miracles, literary excellence), uniqueness, divine preservation. Discuss contemporary relevance of Qur'anic teachings.",
          },
          {
            id: '1.4',
            title: 'Tafsīr (Qur\'anic Exegesis)',
            content: [
              'Historical development of Tafsīr',
              'Importance of Tafsīr',
            ],
            objectives: [
              'Trace the origin and sources of Tafsīr',
              'Evaluate the importance of Tafsīr',
            ],
            aiPrompt: "Explain Tafsīr (Qur'anic exegesis). Cover: historical development (from Prophet's explanations to modern tafsīr), major tafsīr works (Tabari, Ibn Kathir, Qurtubi), importance for understanding Qur'an. Discuss methodology of tafsīr.",
          },
          {
            id: '1.5',
            title: 'Introduction to Tajwīd',
            content: [
              'Theory and practice of Tajwīd',
              'Study of selected suwar with Tajwīd (al-Fātihah to an-Nās)',
            ],
            objectives: [
              'Examine the meaning and importance of Tajwīd',
              'Recite with correct tajwīd the Arabic texts of the suwar',
              'Translate the verses and deduce lessons',
            ],
            aiPrompt: "Explain Tajwīd (Qur'anic recitation rules). Cover: importance, basic rules (makharij, sifaat), practical application. Include selected suwar (al-Fātihah to an-Nās) with tajwīd rules application.",
          },
          {
            id: '1.6',
            title: 'Hadīth Literature',
            content: [
              'History of Hadīth literature from Prophet (SAW) to six authentic collectors',
              'Authentication: Isnād (chain), Matn (text), classification (Sahīh, Hassan, Daīf)',
              "Relationship between Hadīth and Qur\'ān",
              'Six authentic collectors and their works',
              'Imam Malik and al-Muwatta',
            ],
            objectives: [
              'Evaluate history of Hadīth from Prophet to six authentic collectors',
              'Analyze Isnād and Matn',
              "Distinguish between Sahīh, Hassan and da'īf Hadīth",
              "Examine importance and relationship with Qur\'ān",
              'Evaluate biographies and works of collectors',
            ],
            aiPrompt: "Explain Hadīth literature. Cover: history of compilation, authentication methodology (isnād-matn analysis), classification, major collections (Sahih al-Bukhari, Muslim, etc.), relationship with Qur'an. Discuss importance of Hadīth in Islamic jurisprudence.",
          },
          {
            id: '1.7',
            title: 'Moral Lessons from Qur\'ān and Hadīth',
            content: [
              'Admonition of Luqman (Q.31:12-18)',
              'Goodness to parents (Q.17:23-24)',
              'Honesty, prohibition of bribery, alcohol, gambling, stealing, fraud',
              'Dignity of labour, modesty in dressing',
              'Prohibition of adultery, homosexuality, obscenity',
              'Leadership, justice, trust, promises',
              'Piety (Taqwa), tolerance, patience, unity, enjoining good',
            ],
            objectives: [
              'Demonstrate teachings in daily life',
              'Apply teachings to contemporary situations',
            ],
            aiPrompt: "Explain moral lessons from Qur'an and Hadīth. Cover: comprehensive ethical teachings, practical applications in modern life. Discuss Islamic moral philosophy and its relevance to contemporary ethical challenges.",
          },
        ],
      },
      {
        id: 'part2',
        title: 'PART II: TAWHĪD AND FIQH',
        topics: [
          {
            id: '2.1',
            title: 'Faith (Īmān) and Tawhīd',
            content: [
              'Tawhīd: importance and lessons',
              'Kalimatush-Shahadah: meaning and importance',
              'Oneness of Allah (Q.3:18, 2:255, 112:1-4)',
              'Servanthood and messengership of Prophet Muhammad (SAW)',
              'Universality and finality of his message',
            ],
            objectives: [
              'Analyze concepts of Tawhīd',
              'Evaluate significance of Shahadah',
              'Identify verses on Oneness of Allah',
              'Explain significance of Prophet\'s servanthood and messengership',
              'Evaluate universality and finality of Prophethood',
            ],
            aiPrompt: "Explain Tawhīd and Īmān. Cover: concept of divine unity, significance of Shahadah, attributes of Allah, finality of Prophethood. Discuss theological implications and practical manifestations in Muslim life.",
          },
          {
            id: '2.2',
            title: 'Shirk and Incompatible Practices',
            content: [
              'Beliefs incompatible with Tawhīd: idol worship, ancestral worship, Trinity, atheism',
              'Practices incompatible with Tawhīd: superstition, fortune-telling, magic, cult worship, innovation (Bid\'ah)',
            ],
            objectives: [
              'Identify actions and beliefs constituting shirk',
              'Explain implications of shirk',
              'Identify practices incompatible with Tawhīd',
              'Shun off incompatible actions',
            ],
            aiPrompt: "Explain Shirk and incompatible practices. Cover: major and minor shirk, contemporary manifestations, Islamic perspective on superstition, magic, innovations. Discuss how to maintain pure Tawhīd in modern society.",
          },
          {
            id: '2.3',
            title: 'Articles of Faith',
            content: [
              'Belief in Allah: existence, attributes, works',
              'Belief in angels, books, prophets (Ulul-azmi)',
              'Belief in Last Day (Yawn-al-Ba\'th)',
              'Belief in destiny (Qada and Qadar)',
            ],
            objectives: [
              'Examine significance of articles of faith',
              'List attributes of Allah',
              'Explain belief in Allah\'s books and prophets',
              'Analyze belief in Last Day and destiny',
            ],
            aiPrompt: "Explain the six articles of faith. Cover: detailed explanation of each article, theological significance, practical implications. Discuss Islamic eschatology and concept of divine decree.",
          },
          {
            id: '2.4',
            title: 'Ibadat (Acts of Worship)',
            content: [
              'Good deeds and their importance',
              'Taharah (purification): types and importance',
              'Salah: importance, types, things that vitiate',
              'Zakah: types, importance, collection, difference from sadaqah',
              'Sawm: types, exemptions, things that vitiate',
              'Hajj: importance, types, essentials, conditions, difference from Umrah',
              'Jihad: concept, kinds, manner, lessons',
            ],
            objectives: [
              'Identify acts of ibadah',
              'Distinguish types of taharah',
              'Assess importance of salah and analyze types',
              'Differentiate zakah types and explain collection',
              'Compare sawm types and explain exemptions',
              'Examine importance of Hajj and differentiate types',
              'Examine concepts of jihad and its types',
            ],
            aiPrompt: "Explain Ibadat in Islam. Cover: comprehensive treatment of five pillars plus additional acts of worship. Discuss spiritual, social, and economic dimensions of each ibadah. Include contemporary issues and rulings.",
          },
          {
            id: '2.5',
            title: 'Family Matters',
            content: [
              'Marriage: importance, prohibited categories, conditions, rights and duties, polygamy',
              'Ill-treatment of wife (Idrar)',
              'Divorce: Islamic attitude, kinds, Iddah, prohibited forms, custody of children',
              'Inheritance: importance, heirs and shares',
            ],
            objectives: [
              'Analyze importance of marriage and list prohibited categories',
              'Examine conditions for validity and explain spouses\' rights',
              'Evaluate polygamy and ill-treatment of wife',
              'Analyze Islamic attitude to divorce and examine kinds',
              'Differentiate kinds of iddah and analyze significance',
              'Explain prohibited forms of ending marriage',
              'Examine custody rights and evaluate inheritance significance',
            ],
            aiPrompt: "Explain Islamic family law. Cover: marriage, divorce, inheritance, child custody. Discuss contemporary family issues from Islamic perspective, balancing traditional rulings with modern contexts.",
          },
          {
            id: '2.6',
            title: 'Sources and Schools of Islamic Law',
            content: [
              'Four major sources: Qur\'ān, Sunnah, Ijma\', Qiyās',
              'Four Sunni Schools: Hanafi, Maliki, Shafi\'i, Hanbali and their founders',
            ],
            objectives: [
              'Analyze four major sources of Islamic law',
              'Examine biography of founders of Sunni schools',
              'Examine contributions of founders',
            ],
            aiPrompt: "Explain sources and schools of Islamic law. Cover: Usul al-Fiqh methodology, development of madhhabs, contributions of Imams. Discuss contemporary application of Islamic jurisprudence.",
          },
          {
            id: '2.7',
            title: 'Islamic Economic System',
            content: [
              'Islamic attitude to Riba (interest)',
              'Prohibition of cheating (at-tatfif) and hoarding (ihtikar)',
              'Islamic sources of revenue: Zakah, Jizyah, Kharaj, Ghanimah',
              'Baitul-mal as socio-economic welfare institution',
              'Differences with Western economic system',
            ],
            objectives: [
              'Analyze Islamic attitude to Riba',
              'Relate at-tatfif and its negative consequences',
              'Examine ihtikar and implications',
              'Identify sources of revenue and evaluate disbursement',
              'Explain uses of baitul-mal',
              'Differentiate Islamic and Western economic systems',
            ],
            aiPrompt: "Explain Islamic economic system. Cover: prohibition of riba, Islamic banking principles, wealth distribution, economic justice. Compare with capitalist and socialist systems, discuss contemporary Islamic finance.",
          },
          {
            id: '2.8',
            title: 'Islamic Political System',
            content: [
              'Allah as Sovereign',
              'Concept of Shurah (consultation)',
              'Concept of Adalah (justice) and Mas\'uliyah (accountability)',
              'Rights of non-Muslims in Islamic state',
              'Differences with Western political system',
            ],
            objectives: [
              'Analyze concept of Allah\'s sovereignty',
              'Examine concept of shurah in Islam',
              'Evaluate concepts of justice and accountability',
              'Examine rights of non-Muslims',
              'Differentiate Islamic and Western political systems',
            ],
            aiPrompt: "Explain Islamic political system. Cover: concepts of khilafah, shurah, justice, accountability, rights of minorities. Discuss contemporary political challenges from Islamic perspective.",
          },
        ],
      },
      {
        id: 'part3',
        title: 'PART III: ISLAMIC HISTORY AND CIVILIZATION',
        topics: [
          {
            id: '3.1',
            title: 'Pre-Islamic Arabia (Jahiliyyah)',
            content: [
              'Jahiliyyah practices: idol worship, infanticide, polyandry, gambling, usury',
              'Islamic reforms',
            ],
            objectives: [
              'Distinguish practices common to Arabs of al-Jahiliyyah',
              'Trace reforms brought by Islam',
            ],
            aiPrompt: "Explain Pre-Islamic Arabia (Jahiliyyah). Cover: social, religious, economic conditions, major reforms introduced by Islam. Discuss transformation of Arabian society through Islam.",
          },
          {
            id: '3.2',
            title: 'Life of Prophet Muhammad (SAW)',
            content: [
              'Birth and early life',
              'Call to Prophethood',
              'Da\'wah in Makkah and Madinah',
              'Hijrah',
              'Administration of Ummah in Madinah',
              'Battles of Badr, Uhud, Khandaq: causes and effects',
              'Treaty of al-Hudaibiyyah and conquest of Makkah',
              'Farewell pilgrimage and sermon',
              'Qualities and lessons',
            ],
            objectives: [
              'Account for birth and early life',
              'Provide evidence for call to Prophethood',
              'Analyze Da\'wah activities',
              'Account for Hijrah',
              'Analyze administration in Madinah',
              'Account for causes and effects of battles',
              'Trace circumstances of Treaty and conquest',
              'Examine farewell pilgrimage and lessons',
              'Analyze qualities and relevance to Muslim life',
            ],
            aiPrompt: "Explain the life of Prophet Muhammad (SAW). Cover: comprehensive biography from birth to death, major events, leadership qualities, lessons for contemporary Muslims. Include Seerah with historical context.",
          },
          {
            id: '3.3',
            title: 'Rightly Guided Caliphs (al-Khulafa\'u rashidun)',
            content: [
              'Lives and contributions of Abu Bakr, Umar, Uthman, Ali (RA)',
            ],
            objectives: [
              'Trace biographies of four Rightly Guided Caliphs',
              'Evaluate contributions to development of Islam',
            ],
            aiPrompt: "Explain the Rightly Guided Caliphs. Cover: biographies, major achievements, challenges faced, contributions to Islamic state. Discuss lessons for Muslim leadership.",
          },
          {
            id: '3.4',
            title: 'Early Contact of Islam with Africa',
            content: [
              'Hijrah to Abyssinia',
              'Spread of Islam to Egypt',
              'Role of traders, teachers, preachers, Murabitun, Sufi orders, Mujaddidun in West Africa',
            ],
            objectives: [
              'Evaluate circumstances leading to Hijrah to Abyssinia',
              'Give reasons for spread to Egypt',
              'Account for roles in spread of Islam in West Africa',
            ],
            aiPrompt: "Explain early Islamic contact with Africa. Cover: Hijrah to Abyssinia, Islamization of Egypt, spread to West Africa through various means. Discuss African Islamic history and contributions.",
          },
          {
            id: '3.5',
            title: 'Impact of Islam in West Africa',
            content: [
              'Influence on socio-political life of Ghana, Mali, Songhai, Borno empires',
              'Impact on economic life of Timbuktu, Kano, Borno',
            ],
            objectives: [
              'Analyze influence on socio-political systems',
              'Evaluate impact on economic life',
            ],
            aiPrompt: "Explain impact of Islam in West Africa. Cover: transformation of societies, development of Islamic states, economic systems, educational institutions. Discuss legacy of West African Islamic civilizations.",
          },
          {
            id: '3.6',
            title: 'Contributions of Islam to Education',
            content: [
              'Aims and objectives of Islamic Education',
              'Qur\'ān and Hadīth on education',
              'Intellectual activities in West Africa (written history, Sankore University)',
              'Contributions of Ahmad Baba, al-Maghili, Usman Danfodio, Muhammad Bello, Ibn Battuta',
              'Islamic Education Institutions: House of Wisdom, al-Azhar, Nizamiyyah',
              'Contributions of Ibn Sina, al-Ghazali, Ibn Rushd, ar-Razi, Ibn Khaldun',
            ],
            objectives: [
              'Explain aims and objectives of Islamic Education',
              'Assess position of Qur\'ān and Hadīth in education',
              'Analyze intellectual activities in West Africa',
              'Assess contributions of West African scholars',
              'Account for development of intellectual centers',
              'Examine contributions of classical Muslim scholars',
            ],
            aiPrompt: "Explain Islamic contributions to education and knowledge. Cover: Islamic educational philosophy, major institutions, contributions of Muslim scholars to various sciences. Discuss Golden Age of Islam and its legacy.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Abdul, M.O.A. (1976) Studies in Islam Series Book 3',
          'Abdul, M.O.A. (1982) Studies in Islam Series Book 2',
          'Abdul, M.O.A. (1988) The Classical Caliphate',
          'Abdulrahman and Canham (n.d) The Ink of the Scholar',
          'Ali, A.Y. (1975) The Holy Qur\'an Text: Translation and Commentary',
          'Ali, M.M. (n.d) The Religion of Islam',
          'Doi, A. R. I. (1997) Shariah: The Islamic Law',
          'Hay Lal, M. (1982) The Life of Muhammad (SAW)',
          'Lemu, A. (1992) Methodology of Primary Islamic Studies',
          'Lemu, A. (1993) Islamic Studies for SSS, Book 1',
          'Lemu, A. (1993) Islamic Studies for SSS, Books',
          'Muhammad, S. Q. (2010) al-Burhanu fi tajwidil Qur\'an',
          'Opeloye, M.O. (1996) A Dictionary of Peoples and Places in the Qur\'an',
          'Philips, A. A. B. (1997) Usool at-Tafseer',
          'Quadri, Y.A. et al (1990) Al-Iziyyah for the English Audience',
          'Rahim, A. (1992) Islamic History',
          'Sambo, M.B. et al (1984) Islamic Religious Knowledge for WASC Book 1',
          'Sambo, M.B. et al (1984) Islamic Religious Knowledge for WASC Book 3',
          'Trimingham, J.S. (1993) A History of Islam in West Africa',
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
        AsyncStorage.getItem('islamic_studies_ai_explanations'),
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
    const systemPrompt = 'You are an expert Islamic Studies tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Islamic context, Qur\'anic references, and practical applications. Use proper Islamic terminology with Arabic terms. Format in markdown.';
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
      await AsyncStorage.setItem('islamic_studies_ai_explanations', JSON.stringify(updated));
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
          onPress: () => {} // Add navigation here
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Islamic Studies explanations.',
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
      const prompt = `As an Islamic Studies expert, explain "${topic.title}" for UTME/JAMB Islamic Studies preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Islamic Studies:
1. Start with a clear definition in ## H2 heading with Arabic terms
2. Provide Qur'anic references with translations
3. Include Hadith references where applicable
4. Explain concepts with Islamic theological context
5. Highlight key Islamic principles with **bold**
6. Provide practical applications in Muslim life
7. Include contemporary relevance and challenges
8. Compare with other perspectives when relevant
9. Provide historical context where needed

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key Islamic terms (Arabic and English)
- Use > for important Islamic principles or Qur'anic verses
- Include transliteration of Arabic terms in brackets
- Make it engaging for Nigerian Muslim students

Write in clear, respectful, educational style with emphasis on authentic Islamic sources and practical applications for modern Muslim life.`;

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
              content: 'You are an expert Islamic Studies tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Islamic context, Qur\'anic references, and practical applications. Use proper Islamic terminology with Arabic terms. Format in markdown. Be respectful of Islamic beliefs and practices. Provide authentic information from Qur\'an and Sunnah.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2500,
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
              await AsyncStorage.removeItem('islamic_studies_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Islamic Studies explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "menu-book" : "lock"} 
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
            color="#1B5E20" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#1B5E20" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#1B5E20" style={styles.bulletIcon} />
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
                        color="#2E7D32" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#1B5E20" />
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
                              <Icon name="school" size={16} color="#1B5E20" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#2E7D32" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Islamic Studies</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#1B5E20" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Islamic Studies</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Qur'anic references and Islamic context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#1B5E20" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Qur'an & Hadith Studies</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of Islamic scriptures</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#1B5E20" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Fiqh & Islamic History</Text>
                <Text style={styles.featureDescription}>Detailed explanations of Islamic jurisprudence and history</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#1B5E20" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practical Applications</Text>
                <Text style={styles.featureDescription}>Real-life applications of Islamic teachings</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Islamic Studies</Text>
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
      {/* Header with vertical arrangement */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Icon name="menu-book" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>ISLAMIC STUDIES</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Qur'an & Sunnah Focus</Text>
          </View>
        </View>
        
        {/* Vertical arrangement of header controls */}
        <View style={styles.headerControlsVertical}>
          {!isPremiumActivated ? (
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => setSubscriptionModalVisible(true)}
            >
              <Icon name="workspace-premium" size={16} color="#FFD700" />
              <Text style={styles.premiumButtonText}>Premium</Text>
            </TouchableOpacity>
          ) : aiLimit > 0 ? (
            <View style={styles.aiLimitContainer}>
              <Icon name="bar-chart" size={16} color="#28a745" />
              <Text style={styles.aiLimitHeaderText}>{aiLimit.toLocaleString()}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearAllExplanations}
          >
            <Icon name="delete-sweep" size={18} color="white" />
            <Text style={styles.clearButtonText}>Clear AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color="#1B5E20" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#1B5E20" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "menu-book" : "lock"} size={16} color={isPremiumActivated ? "#2E7D32" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Explain for detailed analysis' : 'Unlock premium for AI explanations'}
              </Text>
            </View>
            {isPremiumActivated && aiLimit > 0 && (
              <View style={styles.tipItem}>
                <Icon name="bar-chart" size={16} color="#2196f3" />
                <Text style={styles.tipText}>
                  {aiLimit.toLocaleString()} AI characters remaining
                </Text>
              </View>
            )}
            <View style={styles.tipItem}>
              <Icon name="save" size={16} color="#2196f3" />
              <Text style={styles.tipText}>AI explanations are cached for offline use</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="mosque" size={16} color="#1B5E20" />
              <Text style={styles.tipText}>Includes Qur'anic references and authentic Hadith</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} topics have saved AI notes
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
                <Icon name="menu-book" size={20} color="#1B5E20" />
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
                  <ActivityIndicator size="large" color="#1B5E20" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Islamic context...
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
                <Icon name="share" size={20} color="#1B5E20" />
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
                  Save Notes
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

// Markdown styles for Islamic Studies
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
    fontFamily: 'System',
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
    backgroundColor: '#E8F5E9',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#E8F5E9',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginVertical: 10,
    textAlign: 'left',
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
    fontStyle: 'italic',
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
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerControlsVertical: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 10,
    gap: 8,
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
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  headerNote: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
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
    alignSelf: 'flex-end',
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
    alignSelf: 'flex-end',
  },
  aiLimitHeaderText: {
    color: '#e3f1e6ff',
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
    alignSelf: 'flex-end',
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
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C8E6C9',
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
    backgroundColor: '#388E3C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#1B5E20',
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
    color: '#2E7D32',
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
    textAlign: 'center',
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
  subscriptionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontStyle: 'italic',
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
    color: '#2E7D32',
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
  checkingLimitPopup: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(46, 125, 50, 0.9)",
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

export default IslamicStudiesSyllabusScreen;