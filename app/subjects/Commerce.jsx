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

const CommerceSyllabusScreen = () => {
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

  // Commerce Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Acquire basic knowledge of Commerce',
          'Examine relationship between Commerce and other fields',
          'Apply principles of Commerce in Nigerian economy',
          'Appreciate dynamic changes in commercial activities',
        ],
      },
      {
        id: 'section1',
        title: '1. Introduction to Commerce',
        topics: [
          {
            id: '1.1',
            title: 'Meaning and Scope of Commerce',
            content: [
              'Definition of commerce',
              'Scope: trade and aids to trade',
              'Characteristics of commerce',
              'Functions of commerce',
              'Differentiation from other business subjects',
            ],
            objectives: [
              'Differentiate Commerce from related subjects',
              'Describe characteristics of Commerce',
              'Identify functions of Commerce',
            ],
            aiPrompt: "Explain commerce: meaning, scope, characteristics, functions. Differentiate commerce from business studies, economics. Use Nigerian commercial examples. Discuss importance in Nigerian economy.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. Occupation',
        topics: [
          {
            id: '2.1',
            title: 'Types and Choice of Occupation',
            content: [
              'Meaning and importance of occupation',
              'Types: industrial, commercial, services',
              'Factors determining choice of occupation',
              'Career opportunities in Nigeria',
            ],
            objectives: [
              'State importance of occupation',
              'Compare types of occupation',
              'Identify factors determining choice',
            ],
            aiPrompt: "Explain occupation in commerce context. Cover: industrial, commercial, service sectors. Analyze factors affecting career choice in Nigeria. Discuss emerging Nigerian occupational trends.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. Production',
        topics: [
          {
            id: '3.1',
            title: 'Factors and Types of Production',
            content: [
              'Factors: land, labour, capital, entrepreneur',
              'Rewards: rent, wages, interest, profit',
              'Division of labour and specialization',
              'Types: primary, secondary, tertiary production',
              'Production process in Nigerian industries',
            ],
            objectives: [
              'Identify factors of production and rewards',
              'Distinguish division of labour and specialization',
              'Classify types of production',
            ],
            aiPrompt: "Explain production in commerce. Cover: factors, division of labour, production types. Use Nigerian examples: agriculture (primary), manufacturing (secondary), banking (tertiary). Discuss production challenges in Nigeria.",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. Trade',
        topics: [
          {
            id: '4.1',
            title: 'Home Trade - Retail',
            content: [
              'Types of retailers: itinerant, small-scale, large-scale',
              'Functions of retailers',
              'Factors in setting up retail trade',
              'Trends: branding, self-service, vending machines',
              'Advantages and disadvantages of retail business',
            ],
            objectives: [
              'Compare types of retailers',
              'Identify functions of retailers',
              'Highlight factors in setting up retail trade',
              'Classify modern retailing practices',
              'Identify advantages and disadvantages',
            ],
            aiPrompt: "Explain retail trade in Nigeria. Cover: types of retailers, functions, modern trends. Use examples: open markets, supermarkets, e-commerce. Discuss Nigerian retail environment: Shoprite, Spar, local markets.",
          },
          {
            id: '4.2',
            title: 'Home Trade - Wholesale',
            content: [
              'Types of wholesalers: merchant, agent, general',
              'Functions of wholesalers',
              'Advantages and disadvantages',
              'Role of middlemen in distribution',
            ],
            objectives: [
              'Classify types of wholesalers',
              'Discuss functions of wholesalers',
              'Outline merits and demerits of middlemen',
            ],
            aiPrompt: "Explain wholesale trade. Cover: types, functions, importance. Discuss Nigerian wholesale markets (Alaba, Balogun). Analyze wholesaler-retailer relationships in Nigeria.",
          },
          {
            id: '4.3',
            title: 'Foreign Trade',
            content: [
              'Basic issues: balance of trade, balance of payments',
              'Counter trade arrangements',
              'Procedures and documents in export/import',
              'Barriers to international trade',
              'Role of Customs, Ports Authority in Nigeria',
            ],
            objectives: [
              'Analyze basic issues in foreign trade',
              'Explain procedures and documents used',
              'Identify barriers to international trade',
              'Appraise role of government agencies',
            ],
            aiPrompt: "Explain foreign trade with Nigerian focus. Cover: balance of trade, import/export procedures, trade barriers. Use Nigerian examples: oil exports, import regulations. Discuss Nigeria's major trading partners.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. Purchase and Sale of Goods',
        topics: [
          {
            id: '5.1',
            title: 'Trade Procedures and Documents',
            content: [
              'Procedure: enquiry, quotation, order, invoice',
              'Documents: proforma invoice, bill of lading, certificate of origin',
              'Terms: trade discount, quantity discount, cash discount',
              'Warranties, C.O.D., C.I.F., F.O.B.',
              'Terms of payment: cash and credit',
            ],
            objectives: [
              'Examine procedures and documents',
              'Determine terms of trade',
              'Distinguish cash and credit payments',
              'Identify types of credit',
              'Analyze merits/demerits of credit',
            ],
            aiPrompt: "Explain purchase and sale procedures in commerce. Cover: documents, terms, payment methods. Use Nigerian import/export examples. Discuss common commercial terms in Nigerian business.",
          },
        ],
      },
      {
        id: 'section6',
        title: '6. Aids-to-Trade',
        topics: [
          {
            id: '6.1',
            title: 'Advertising',
            content: [
              'Types: informative, persuasive, competitive',
              'Media: print, broadcast, digital, outdoor',
              'Advantages and disadvantages',
              'Advertising ethics and regulations in Nigeria',
            ],
            objectives: [
              'Identify types and media of advertising',
              'Analyze advantages and disadvantages',
            ],
            aiPrompt: "Explain advertising as aid-to-trade. Cover: types, media, effectiveness. Use Nigerian advertising examples (MTN, Dangote). Discuss advertising standards in Nigeria.",
          },
          {
            id: '6.2',
            title: 'Banking',
            content: [
              'Types: commercial, merchant, development, central bank',
              'Services: savings, loans, transfers, forex',
              'Challenges: liquidity, technology, regulations',
              'Nigerian banking sector overview',
            ],
            objectives: [
              'Categorize types of bank',
              'Assess services rendered by banks',
              'Identify challenges facing banks',
            ],
            aiPrompt: "Explain banking in Nigerian commerce. Cover: bank types, services, challenges. Discuss CBN regulations. Use examples: First Bank, GTBank, digital banking trends.",
          },
          {
            id: '6.3',
            title: 'Communication',
            content: [
              'Communication process and procedure',
              'Types: oral, written, electronic',
              'Trends: courier services, GSM, internet',
              'Merits and demerits',
              'Barriers to effective communication',
            ],
            objectives: [
              'Assess stages in communication process',
              'Analyze types of communication',
              'Appraise contributions of modern communication',
              'State merits and demerits',
              'Outline barriers to communication',
            ],
            aiPrompt: "Explain communication in business. Cover: process, types, modern trends. Discuss Nigerian telecoms (MTN, Glo, Airtel). Analyze communication challenges in Nigerian businesses.",
          },
          {
            id: '6.4',
            title: 'Insurance',
            content: [
              'Types: life, fire, marine, motor, burglary',
              'Principles: utmost good faith, indemnity, insurable interest',
              'Terms: premium, policy, claim, risk',
              'Importance to businesses and individuals',
            ],
            objectives: [
              'Describe types of insurance',
              'Apply principles to life situations',
              'Explain terms in insurance',
              'State importance of insurance',
            ],
            aiPrompt: "Explain insurance as aid-to-trade. Cover: types, principles, importance. Use Nigerian insurance companies (Leadway, AIICO). Discuss insurance penetration in Nigeria.",
          },
          {
            id: '6.5',
            title: 'Tourism',
            content: [
              'Importance to economy',
              'Agencies promoting tourism in Nigeria',
              'Challenges facing Nigerian tourism',
              'Tourist attractions in Nigeria',
            ],
            objectives: [
              'Examine importance of tourism',
              'Identify agencies promoting tourism',
              'Analyze challenges facing tourism',
            ],
            aiPrompt: "Explain tourism in commerce context. Cover: economic importance, Nigerian attractions. Discuss challenges and opportunities. Use examples: Obudu Ranch, Yankari Games Reserve.",
          },
          {
            id: '6.6',
            title: 'Transportation',
            content: [
              'Modes: road, rail, water, air, pipeline',
              'Importance to commerce',
              'Advantages and disadvantages of each mode',
              'Nigerian transportation infrastructure',
            ],
            objectives: [
              'Appraise relevance of various modes',
              'List importance of transportation',
              'Discuss advantages and disadvantages',
            ],
            aiPrompt: "Explain transportation in commerce. Cover: modes, importance, challenges. Discuss Nigerian transport: roads, railways, ports. Analyze impact on Nigerian businesses.",
          },
          {
            id: '6.7',
            title: 'Warehousing',
            content: [
              'Importance in commerce',
              'Types and functions of warehouses',
              'Factors in siting warehouses',
              'Modern warehousing practices',
            ],
            objectives: [
              'Highlight importance of warehousing',
              'Appraise contributions to businesses',
              'Evaluate factors in siting warehouses',
            ],
            aiPrompt: "Explain warehousing in commerce. Cover: types, functions, importance. Discuss Nigerian warehousing challenges. Use examples: ports warehouses, agricultural storage.",
          },
        ],
      },
      {
        id: 'section7',
        title: '7. Business Units',
        topics: [
          {
            id: '7.1',
            title: 'Forms of Business Organizations',
            content: [
              'Forms: sole proprietorship, partnership, limited companies',
              'Public corporations, cooperative societies',
              'Registration of businesses in Nigeria',
              'Business mergers: reasons and forms',
              'Dissolution and liquidation',
              'Merits and demerits of each form',
            ],
            objectives: [
              'Identify forms and features of business units',
              'Analyze registration procedures',
              'Appraise forms of business mergers',
              'Examine factors determining choice',
              'Differentiate dissolution and liquidation',
              'State merits and demerits',
            ],
            aiPrompt: "Explain business units in Nigerian context. Cover: legal forms, registration, mergers. Discuss CAC registration process. Use Nigerian examples: Dangote Industries, small businesses.",
          },
        ],
      },
      {
        id: 'section8',
        title: '8. Financing Business',
        topics: [
          {
            id: '8.1',
            title: 'Sources and Types of Capital',
            content: [
              'Sources: personal savings, shares, loans, debentures',
              'Bank overdraft, credit purchase, leasing',
              'Types: share capital, authorized, issued, paid-up',
              'Working capital, liquid capital, owners equity',
              'Calculation of profits: gross and net',
              'Problems of sourcing finance in Nigeria',
              'Role of Bureau de change',
            ],
            objectives: [
              'Identify ways of financing business',
              'Discuss different types of capital',
              'Compute capital, profits, turnover',
              'Appraise problems sourcing finance',
              'Assess role of Bureau de change',
            ],
            aiPrompt: "Explain business financing in Nigeria. Cover: sources, types, calculations. Discuss SME financing challenges. Use examples: Nigerian banks, microfinance, venture capital.",
          },
        ],
      },
      {
        id: 'section9',
        title: '9. Trade Associations',
        topics: [
          {
            id: '9.1',
            title: 'Business Associations',
            content: [
              'Objectives and functions of trade associations',
              'Examples: Cocoa Farmers Association, Poultry Farmers',
              'Chambers of Commerce: objectives and functions',
              'Role in Nigerian business environment',
            ],
            objectives: [
              'Discuss objectives and functions',
              'List objectives of Chambers of Commerce',
            ],
            aiPrompt: "Explain trade associations in Nigeria. Cover: types, functions, importance. Discuss MAN, NACCIMA, sectoral associations. Analyze their role in policy advocacy.",
          },
        ],
      },
      {
        id: 'section10',
        title: '10. Money',
        topics: [
          {
            id: '10.1',
            title: 'Evolution and Functions',
            content: [
              'Evolution: barter to modern money',
              'Forms: commodity, metallic, paper, digital',
              'Qualities of good money',
              'Functions: medium, measure, standard, store',
            ],
            objectives: [
              'Discuss origin of money',
              'Analyze forms and qualities',
              'Appraise functions of money',
            ],
            aiPrompt: "Explain money in commerce. Cover: evolution, forms, functions. Discuss Nigerian currency (Naira) history. Analyze digital money trends in Nigeria.",
          },
        ],
      },
      {
        id: 'section11',
        title: '11. Stock Exchange',
        topics: [
          {
            id: '11.1',
            title: 'Capital Market Operations',
            content: [
              'Importance and functions of stock exchange',
              'Securities: stocks, shares, bonds, debentures',
              'Transaction procedures and speculations',
              'Second-Tier Securities Market',
              'Nigerian Stock Exchange overview',
            ],
            objectives: [
              'State importance and functions',
              'Identify securities traded',
              'Analyze transaction procedures',
              'Appraise advantages and regulations',
            ],
            aiPrompt: "Explain stock exchange operations. Cover: functions, securities, procedures. Discuss Nigerian Stock Exchange (NGX). Use examples: listed companies, investment process.",
          },
        ],
      },
      {
        id: 'section12',
        title: '12. Business Management',
        topics: [
          {
            id: '12.1',
            title: 'Management Principles and Functions',
            content: [
              'Functions: planning, organizing, staffing, controlling',
              'Principles: span of control, unity of command',
              'Organizational structures: line, functional, matrix',
              'Functional areas: production, marketing, finance, personnel',
              'Business resources: 5Ms (man, money, materials, machines, management)',
            ],
            objectives: [
              'Appraise functions of management',
              'Analyze principles of management',
              'Identify organizational structures',
              'Assess functional areas',
              'Examine business resources',
            ],
            aiPrompt: "Explain business management principles. Cover: functions, principles, structures. Discuss Nigerian management practices. Use examples: successful Nigerian businesses.",
          },
        ],
      },
      {
        id: 'section13',
        title: '13. Marketing',
        topics: [
          {
            id: '13.1',
            title: 'Marketing Concepts and Mix',
            content: [
              'Importance and functions of marketing',
              'Marketing concept: consumer orientation',
              'Marketing mix: 4Ps (product, price, place, promotion)',
              'Market segmentation',
              'Public relations and customer service',
            ],
            objectives: [
              'Highlight importance and functions',
              'Discuss marketing concept',
              'Assess marketing mix elements',
              'Explain market segmentation',
              'Examine public relations',
            ],
            aiPrompt: "Explain marketing in commerce. Cover: concepts, mix, segmentation. Use Nigerian marketing examples. Discuss digital marketing trends in Nigeria.",
          },
        ],
      },
      {
        id: 'section14',
        title: '14. Legal Aspects of Business',
        topics: [
          {
            id: '14.1',
            title: 'Business Law and Regulations',
            content: [
              'Meaning and validity of contract',
              'Agency, Sale of Goods Act, Hire Purchase Act',
              'Contract of employment',
              'Government regulations: patents, trademarks, copyrights',
              'Consumer protection: CPC, NAFDAC, SON',
            ],
            objectives: [
              'Analyze elements of valid contract',
              'Examine relevant business laws',
              'Assess rights of employers/employees',
              'Distinguish patents, trademarks, copyrights',
              'Identify functions of consumerism',
              'Assess relevance of regulatory agencies',
            ],
            aiPrompt: "Explain legal aspects of Nigerian business. Cover: contracts, consumer protection, regulations. Discuss CAC, NAFDAC, SON roles. Use Nigerian legal case examples.",
          },
        ],
      },
      {
        id: 'section15',
        title: '15. ICT in Commerce',
        topics: [
          {
            id: '15.1',
            title: 'Information and Communication Technology',
            content: [
              'Computer appreciation and applications',
              'Types and functions of computers',
              'Merits and demerits of ICT',
              'Terms: internet, intranet, e-mail, LAN',
              'Activities: e-commerce, e-banking, e-business',
              'Challenges of ICT in Nigeria',
            ],
            objectives: [
              'Discuss computer appreciation',
              'Enumerate types and functions',
              'Analyze merits and demerits',
              'Appraise challenges',
              'Identify ICT terms',
              'Evaluate ICT trends',
            ],
            aiPrompt: "Explain ICT in Nigerian commerce. Cover: applications, e-commerce, challenges. Discuss Jumia, Paystack, online banking. Analyze digital divide in Nigeria.",
          },
        ],
      },
      {
        id: 'section16',
        title: '16. Business Environment',
        topics: [
          {
            id: '16.1',
            title: 'Environment and Social Responsibility',
            content: [
              'Business environments: legal, political, economic, social',
              'Social responsibility: safe products, philanthropy',
              'Types of pollution: water, air, land',
              'Implications on businesses',
              'Sustainable business practices',
            ],
            objectives: [
              'Discuss types of business environment',
              'Assess role of social responsibility',
              'Identify types of pollution',
              'Analyze implications on businesses',
            ],
            aiPrompt: "Explain business environment and CSR in Nigeria. Cover: PESTEL analysis, pollution, sustainability. Discuss Nigerian companies' CSR initiatives. Analyze environmental regulations.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Anderson, D. J. (1978) Commerce for West Africa',
          'Abukannah, L. I. et al (1992) Commerce for Secondary Schools',
          'Asaolu, A. and Igwe, P. M. (2005) New Syllabus Commerce',
          'Babatunde, A. H. (1999) Handbook on Commerce',
          'Eriki, P. O. (1998) Working with Computer',
          'French, C. S. (2000) Computer Science',
          'Ibru, G. M. (2004) Nigeria: The Promise of Tourism',
          'Igwe, P. M. et al (2004) Countdown to WASSCE/SSCE/NECO/JME Commerce',
          'James, A. F. et al (1996) Management',
          'Nwachukwu, C. C. (1999) Management Theory and Practice',
          'Odedokun, M. O. et al (1999) Commerce for Senior Secondary',
          'Odoom, F. F. (1998) Commerce for Senior Secondary',
          'Onifade, A. (2001) Management: Office Business Education',
          'Onifade, A. (2002) The Computer for Word Processing and Internet',
          'Onu, A. J. C. (2000) Marketing Today',
          'Pallister, J. and Isaacs, A. (2002) A Dictionary of Business',
          'Ubaka, O. A. (2012) Commerce Simplified',
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
        AsyncStorage.getItem('commerce_ai_explanations'),
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
    const systemPrompt = 'You are an expert Commerce tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian business examples and current commercial context. Use proper commerce terminology. Format in markdown.';
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
      await AsyncStorage.setItem('commerce_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Commerce explanations.',
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
      const prompt = `As a Commerce expert, explain "${topic.title}" for UTME/JAMB Commerce preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Commerce:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian business examples and commercial context
3. Explain concepts with practical business applications
4. Include Nigerian commercial statistics and data
5. Highlight key commerce principles with **bold**
6. Provide comparative analysis with Nigerian context
7. Include current commercial trends in Nigeria
8. Provide practice questions with solutions
9. Connect theoretical concepts with Nigerian business practices

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key commerce terms
- Use > for important commercial principles or facts
- Include Nigerian business data where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian commercial context and practical business applications.`;

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
              content: 'You are an expert Commerce tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian business examples and current commercial context. Use proper commerce terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('commerce_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Commerce explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "store" : "lock"} 
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
            color="#9b59b6" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#9b59b6" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#9b59b6" style={styles.bulletIcon} />
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
                        color="#8e44ad" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#9b59b6" />
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
                              <Icon name="school" size={16} color="#9b59b6" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#8e44ad" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Commerce</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#9b59b6" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Commerce</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian business context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#9b59b6" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Trade and Business</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of commercial concepts</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#9b59b6" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Business Focus</Text>
                <Text style={styles.featureDescription}>Real Nigerian commercial data and examples</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#9b59b6" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practice Questions</Text>
                <Text style={styles.featureDescription}>UTME-style questions with solutions</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Commerce</Text>
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
          <Icon name="store" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>COMMERCE</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Business Focus</Text>
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
            <Icon name="info" size={20} color="#9b59b6" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#9b59b6" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "store" : "lock"} size={16} color={isPremiumActivated ? "#8e44ad" : "#999"} />
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
              <Icon name="business" size={16} color="#9b59b6" />
              <Text style={styles.tipText}>Includes Nigerian business examples and commercial context</Text>
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
                <Icon name="store" size={20} color="#9b59b6" />
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
                  <ActivityIndicator size="large" color="#9b59b6" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian business context...
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
                <Icon name="share" size={20} color="#9b59b6" />
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

// Markdown styles for Commerce
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
    color: '#6c3483',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9b59b6',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8e44ad',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#6c3483',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F5EEF8',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D7BDE2',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F5EEF8',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D7BDE2',
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
    color: '#9b59b6',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#9b59b6',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#9b59b6',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F5EEF8',
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
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
    backgroundColor: '#9b59b6',
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
  // Vertical arrangement for controls
  headerControlsVertical: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 10,
    gap: 8, // Space between elements
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
    color: '#9b59b6',
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
    backgroundColor: '#F5EEF8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6c3483',
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
    backgroundColor: '#FBF8FE',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D7BDE2',
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
    color: '#9b59b6',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8e44ad',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#6c3483',
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
    color: '#9b59b6',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#9b59b6',
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
    color: '#9b59b6',
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
    borderColor: '#9b59b6',
  },
  saveButton: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9b59b6',
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
    backgroundColor: '#9b59b6',
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
    backgroundColor: '#F5EEF8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9b59b6',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9b59b6',
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
    backgroundColor: '#9b59b6',
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
    backgroundColor: "rgba(155, 89, 182, 0.9)",
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

export default CommerceSyllabusScreen;