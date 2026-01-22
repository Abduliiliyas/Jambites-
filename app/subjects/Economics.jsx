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

const EconomicsSyllabusScreen = () => {
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

  // Economics Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Demonstrate sufficient knowledge and understanding of basic economic concepts',
          'Identify and explain structures of economic units and institutions',
          'Describe major economic activities - production, distribution and consumption',
          'Identify and appraise economic problems of society',
          'Develop competence to proffer solutions to economic problems',
        ],
      },
      {
        id: 'section1',
        title: '1. Economics as a Science',
        topics: [
          {
            id: '1.1',
            title: 'Basic Economic Concepts',
            content: [
              'Wants, scarcity, choice, scale of preference, opportunity cost',
              'Rationality, production, distribution, consumption',
              'Economic problems: what, how and for whom to produce',
              'Efficiency of resource use',
              'Application of Production Possibility Frontier (PPF) to solve economic problems',
            ],
            objectives: [
              'Compare various concepts in economics and their applications',
              'Interpret graphs/schedules in relation to concepts',
              'Identify economic problems',
              'Proffer solutions using PPF',
            ],
            aiPrompt: "Explain basic economic concepts: wants, scarcity, choice, opportunity cost, PPF. Use Nigerian examples. Show how PPF illustrates trade-offs in resource allocation. Discuss efficiency in Nigerian economic context.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. Economic Systems',
        topics: [
          {
            id: '2.1',
            title: 'Types of Economic Systems',
            content: [
              'Free enterprise (capitalist) economy',
              'Centrally planned (socialist) economy',
              'Mixed economy characteristics',
              'Solutions to economic problems under different systems',
              'Contemporary issues: deregulation, banking consolidation, cash policy reform in Nigeria',
            ],
            objectives: [
              'Compare various economic systems',
              'Apply knowledge to contemporary Nigerian issues',
              'Proffer solutions under different economic systems',
            ],
            aiPrompt: "Compare free enterprise, centrally planned, and mixed economies. Discuss Nigerian mixed economy characteristics. Analyze economic reforms: deregulation, banking consolidation. Use current Nigerian economic examples.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. Methods and Tools of Economic Analysis',
        topics: [
          {
            id: '3.1',
            title: 'Scientific Approach in Economics',
            content: [
              'Inductive and deductive methods',
              'Positive and normative reasoning',
              'Basic tools: tables, charts, graphs',
              'Measures of central tendency: mean, median, mode',
              'Measures of dispersion: variance, standard deviation, range',
            ],
            objectives: [
              'Distinguish between forms of reasoning',
              'Apply reasoning to real life situations',
              'Use tools to interpret economic data',
              'Analyze economic data using statistical tools',
              'Understand merits and demerits of tools',
            ],
            aiPrompt: "Explain scientific methods in economics: inductive/deductive, positive/normative. Teach statistical tools: mean, median, mode, standard deviation. Use Nigerian economic data examples for analysis exercises.",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. Theory of Demand',
        topics: [
          {
            id: '4.1',
            title: 'Demand Analysis',
            content: [
              'Meaning and determinants of demand',
              'Demand schedules and curves',
              'Change in quantity demanded vs change in demand',
              'Types: composite, derived, competitive, joint demand',
              'Elasticity: price, income, cross elasticity',
              'Importance of elasticity to consumers, producers, government',
            ],
            objectives: [
              'Identify factors determining demand',
              'Interpret demand curves from schedules',
              'Differentiate between changes in demand',
              'Compare types of demand and interrelationships',
              'Compute and interpret elasticity coefficients',
            ],
            aiPrompt: "Explain demand theory comprehensively. Cover: demand determinants, law of demand, elasticity concepts. Use Nigerian market examples (rice, fuel, mobile data). Calculate elasticities with Nigerian price data.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. Theory of Consumer Behaviour',
        topics: [
          {
            id: '5.1',
            title: 'Consumer Choice Theory',
            content: [
              'Utility concepts: cardinal, ordinal, total, average, marginal',
              'Indifference curves and budget lines',
              'Diminishing marginal utility and law of demand',
              'Consumer equilibrium using indifference curves',
              'Income and substitution effects',
              'Consumer surplus and applications',
            ],
            objectives: [
              'Explain utility concepts',
              'Apply law of demand using marginal utility',
              'Determine consumer equilibrium',
              'Relate income and substitution effects',
              'Apply consumer surplus to real life',
            ],
            aiPrompt: "Explain consumer behavior: utility theory, indifference curves, budget constraints. Show consumer equilibrium with diagrams. Use Nigerian consumer examples (mobile phone choice, food purchases). Calculate consumer surplus.",
          },
        ],
      },
      {
        id: 'section6',
        title: '6. Theory of Supply',
        topics: [
          {
            id: '6.1',
            title: 'Supply Analysis',
            content: [
              'Meaning and determinants of supply',
              'Supply schedules and supply curves',
              'Change in quantity supplied vs change in supply',
              'Types: joint/complementary, competitive, composite supply',
              'Elasticity of supply: determinants, measurements',
            ],
            objectives: [
              'Identify factors determining supply',
              'Interpret supply curves from schedules',
              'Differentiate between changes in supply',
              'Compare types of supply relationships',
              'Compute elasticity coefficients',
            ],
            aiPrompt: "Explain supply theory. Cover: supply determinants, law of supply, elasticity of supply. Use Nigerian agricultural and manufacturing examples. Show supply shifts with Nigerian policy changes.",
          },
        ],
      },
      {
        id: 'section7',
        title: '7. Theory of Price Determination',
        topics: [
          {
            id: '7.1',
            title: 'Market Equilibrium',
            content: [
              'Concepts of market and price',
              'Functions of price system',
              'Equilibrium price and quantity in product/factor markets',
              'Price legislation: minimum and maximum price effects',
              'Effects of changes in supply and demand on equilibrium',
            ],
            objectives: [
              'Explain market and price concepts',
              'Examine functions of price system',
              'Evaluate government price interference effects',
              'Differentiate minimum and maximum price legislation',
              'Interpret effects of supply/demand changes',
            ],
            aiPrompt: "Explain price determination and market equilibrium. Cover: demand-supply interaction, price controls. Use Nigerian examples: petrol price regulation, minimum wage, agricultural price floors. Show equilibrium shifts.",
          },
        ],
      },
      {
        id: 'section8',
        title: '8. Theory of Production',
        topics: [
          {
            id: '8.1',
            title: 'Production Analysis',
            content: [
              'Meaning and types of production',
              'Production concepts: TP, AP, MP, law of variable proportion',
              'Division of labour and specialization',
              'Economies of scale: internal and external',
              'Production functions and returns to scale',
              'Producers equilibrium using isoquant-isocost analysis',
              'Factors affecting productivity',
            ],
            objectives: [
              'Relate TP, AP, MP with law of variable proportion',
              'Compare internal and external economies of scale',
              'Identify production function types',
              'Compare returns to scale and implications',
              'Determine firm equilibrium position',
              'Identify productivity factors',
            ],
            aiPrompt: "Explain production theory. Cover: production functions, law of variable proportion, economies of scale. Use Nigerian manufacturing and agricultural examples. Show isoquant-isocost analysis with Nigerian cost data.",
          },
        ],
      },
      {
        id: 'section9',
        title: '9. Theory of Costs and Revenue',
        topics: [
          {
            id: '9.1',
            title: 'Cost and Revenue Analysis',
            content: [
              'Cost concepts: fixed, variable, total, average, marginal',
              'Revenue concepts: total, average, marginal revenue',
              'Accountants vs economists notions of cost',
              'Short-run and long-run costs',
              'Relationship between marginal cost and supply curve',
            ],
            objectives: [
              'Explain various cost concepts',
              'Differentiate accountants and economists cost views',
              'Interpret short-run and long-run cost curves',
              'Establish marginal cost-supply curve relationship',
              'Explain revenue concepts',
            ],
            aiPrompt: "Explain cost and revenue theory. Cover: cost curves, revenue curves, profit maximization. Use Nigerian business examples. Show cost analysis for Nigerian SMEs. Explain implicit vs explicit costs.",
          },
        ],
      },
      {
        id: 'section10',
        title: '10. Market Structures',
        topics: [
          {
            id: '10.1',
            title: 'Perfect Competition',
            content: [
              'Assumptions and characteristics of perfect competition',
              'Short-run and long-run equilibrium of perfect competitor',
              'Break-even and shut-down analysis',
            ],
            objectives: [
              'Analyze perfect competition assumptions',
              'Differentiate short-run and long-run equilibrium',
              'Establish break-even/shut-down conditions',
            ],
            aiPrompt: "Explain perfect competition market structure. Cover: characteristics, equilibrium conditions. Use Nigerian agricultural market examples (tomato sellers, grain markets). Show profit/loss situations.",
          },
          {
            id: '10.2',
            title: 'Imperfect Markets',
            content: [
              'Pure monopoly, discriminatory monopoly, monopolistic competition',
              'Short-run and long-run equilibrium positions',
              'Break-even/shut-down analysis in imperfect markets',
            ],
            objectives: [
              'Analyze imperfect market assumptions',
              'Differentiate monopoly and monopolistic competition',
              'Establish equilibrium conditions for imperfect firms',
            ],
            aiPrompt: "Explain imperfect markets: monopoly, oligopoly, monopolistic competition. Use Nigerian examples: Dangote Cement (monopoly), telecoms (oligopoly), retail shops (monopolistic competition).",
          },
        ],
      },
      {
        id: 'section11',
        title: '11. National Income',
        topics: [
          {
            id: '11.1',
            title: 'National Income Concepts',
            content: [
              'Concepts: GNP, GDP, NI, NNP',
              'National income measurement methods and problems',
              'Uses and limitations of national income estimates',
              'Circular flow of income (2 and 3-sector models)',
              'Consumption, investment, savings concepts',
              'Multiplier effect and income determination',
              'Elementary theory of equilibrium national income',
            ],
            objectives: [
              'Identify major national income concepts',
              'Compare national income measurement methods',
              'Examine measurement problems',
              'Determine uses and limitations of estimates',
              'Interpret circular flow models',
              'Calculate multipliers and evaluate effects',
              'Explain consumption, investment, savings',
            ],
            aiPrompt: "Explain national income accounting. Cover: GDP, GNP, NNP calculation methods. Use Nigerian national income data. Show circular flow diagram with Nigerian economic sectors. Calculate Nigerian GDP growth rate.",
          },
        ],
      },
      {
        id: 'section12',
        title: '12. Money and Inflation',
        topics: [
          {
            id: '12.1',
            title: 'Money and Price Level',
            content: [
              'Types, characteristics, functions of money',
              'Demand for money and money supply',
              'Quantity theory of money (Fisher equation)',
              'Value of money and price level relationship',
              'Inflation: types, measurement, effects, control',
              'Deflation: measurement, effects, control',
            ],
            objectives: [
              'Explain types and functions of money',
              'Identify factors affecting money demand/supply',
              'Examine value of money-price level relationship',
              'Identify quantity theory components',
              'Examine inflation causes and effects',
              'Calculate and interpret consumer price index',
              'Examine deflation causes and control',
            ],
            aiPrompt: "Explain money and inflation theory. Cover: functions of money, quantity theory, inflation types. Use Nigerian inflation data. Calculate inflation rate from Nigerian CPI. Discuss CBN inflation control measures.",
          },
        ],
      },
      {
        id: 'section13',
        title: '13. Financial Institutions',
        topics: [
          {
            id: '13.1',
            title: 'Financial System',
            content: [
              'Types and functions of financial institutions',
              'Role in economic development',
              'Money and capital markets',
              'Financial sector regulations',
              'Deposit money banks and money creation',
              'Monetary policy instruments',
              'Challenges facing Nigerian financial institutions',
            ],
            objectives: [
              'Identify types and functions of financial institutions',
              'Explain roles in economic development',
              'Distinguish money and capital markets',
              'Identify financial sector regulators',
              'Explain money creation process',
              'Examine monetary policy instruments',
              'Appraise challenges in Nigeria',
            ],
            aiPrompt: "Explain Nigerian financial system. Cover: CBN, commercial banks, capital market. Discuss monetary policy tools. Use current Nigerian banking sector examples. Analyze challenges: non-performing loans, digital banking.",
          },
        ],
      },
      {
        id: 'section14',
        title: '14. Public Finance',
        topics: [
          {
            id: '14.1',
            title: 'Government Finance',
            content: [
              'Meaning and objectives of public finance',
              'Fiscal policy and instruments',
              'Sources of government revenue',
              'Principles of taxation',
              'Tax incidence and effects',
              'Effects of public expenditure',
              'Government budget and public debts',
              'Revenue allocation and resource control in Nigeria',
            ],
            objectives: [
              'Identify objectives of public finance',
              'Explain fiscal policy instruments',
              'Compare government revenue sources',
              'Analyze taxation principles',
              'Analyze tax incidence effects',
              'Examine public expenditure effects',
              'Examine budget types and effects',
              'Highlight revenue allocation criteria in Nigeria',
            ],
            aiPrompt: "Explain public finance in Nigeria. Cover: fiscal policy, taxation, public expenditure. Use Nigerian budget examples. Analyze revenue allocation formula. Discuss Nigeria's debt profile and implications.",
          },
        ],
      },
      {
        id: 'section15',
        title: '15. Economic Growth and Development',
        topics: [
          {
            id: '15.1',
            title: 'Growth vs Development',
            content: [
              'Meaning and scope of growth and development',
              'Indicators of growth and development',
              'Factors affecting growth and development',
              'Problems of development in Nigeria',
              'Development planning in Nigeria',
            ],
            objectives: [
              'Distinguish economic growth and development',
              'Highlight growth and development indicators',
              'Identify growth and development factors',
              'Examine Nigerian development problems',
              'Examine planning role in development',
            ],
            aiPrompt: "Explain economic growth vs development. Cover: indicators, measurement, factors. Analyze Nigeria's development challenges. Discuss Nigerian development plans. Compare Nigeria with emerging economies.",
          },
        ],
      },
      {
        id: 'section16',
        title: '16. Agriculture in Nigeria',
        topics: [
          {
            id: '16.1',
            title: 'Agricultural Economics',
            content: [
              'Types and features of Nigerian agriculture',
              'Role in economic development',
              'Problems of agriculture',
              'Agricultural policies and effects',
              'Instability in agricultural incomes',
            ],
            objectives: [
              'Identify types and features of agriculture',
              'Examine characteristics and problems',
              'Assess role in economic development',
              'Appraise Nigerian agricultural policies',
              'Evaluate causes and effects of income instability',
            ],
            aiPrompt: "Explain Nigerian agriculture. Cover: subsistence vs commercial farming, value chains. Analyze challenges: low productivity, climate change. Discuss government policies: Anchor Borrowers Programme. Show agricultural contribution to GDP.",
          },
        ],
      },
      {
        id: 'section17',
        title: '17. Industry and Industrialization',
        topics: [
          {
            id: '17.1',
            title: 'Industrial Development',
            content: [
              'Concepts of location and localization of industry',
              'Strategies for industrialization in Nigeria',
              'Industrialization and economic development',
              'Funding and management of business organizations',
              'Factors determining firm size',
            ],
            objectives: [
              'Differentiate location and localization',
              'Identify factors influencing industrial location',
              'Examine industrialization problems',
              'Appraise industrialization strategies',
              'Examine industry role in development',
            ],
            aiPrompt: "Explain industrialization in Nigeria. Cover: industrial location theory, growth poles. Analyze Nigerian industrial policy. Discuss challenges: infrastructure, power supply. Use examples: Lagos industrial clusters, free trade zones.",
          },
        ],
      },
      {
        id: 'section18',
        title: '18. Natural Resources and Nigerian Economy',
        topics: [
          {
            id: '18.1',
            title: 'Resource Economics',
            content: [
              'Development of major natural resources',
              'Contributions of oil and non-oil sectors',
              'Linkage effects in resource sectors',
              'Upstream/downstream oil sector activities',
              'Role of NNPC and OPEC',
              'Challenges in natural resources exploitation',
            ],
            objectives: [
              'Trace development of Nigerian natural resources',
              'Understand oil and non-oil sector contributions',
              'Establish linkages between resources and other sectors',
              'Analyze environmental effects of exploitation',
              'Distinguish upstream and downstream activities',
              'Examine NNPC and OPEC roles',
              'Suggest control measures for exploitation effects',
            ],
            aiPrompt: "Explain natural resource economics in Nigeria. Cover: oil sector, solid minerals, environmental impact. Analyze resource curse theory. Discuss diversification efforts. Use current oil production data.",
          },
        ],
      },
      {
        id: 'section19',
        title: '19. Business Organizations',
        topics: [
          {
            id: '19.1',
            title: 'Forms of Business',
            content: [
              'Private enterprises: sole proprietorship, partnership, companies',
              'Problems of private enterprises',
              'Public enterprises and their problems',
              'Funding and management of businesses',
              'Factors determining firm size',
              'Privatization and commercialization',
            ],
            objectives: [
              'Compare types and features of private businesses',
              'Appreciate financing and management problems',
              'Identify features of public enterprises',
              'Identify factors determining firm size',
              'Differentiate privatization and commercialization',
              'Compare advantages and disadvantages',
            ],
            aiPrompt: "Explain business organizations in Nigeria. Cover: legal forms, financing options. Analyze challenges of Nigerian businesses. Discuss privatization of public enterprises. Use examples: Dangote Group, Nigerian banks.",
          },
        ],
      },
      {
        id: 'section20',
        title: '20. Population',
        topics: [
          {
            id: '20.1',
            title: 'Population Economics',
            content: [
              'Meaning and theories of population',
              'Census importance and problems',
              'Population size: over, under, optimum',
              'Population structure and distribution',
              'Population policy and economic development',
            ],
            objectives: [
              'Analyze population theories',
              'Examine relevance to Nigeria',
              'Examine census uses and limitations',
              'Identify population size determinants',
              'Analyze population structure and distribution',
              'Appraise Nigerian population policy',
            ],
            aiPrompt: "Explain population economics. Cover: Malthusian theory, demographic transition. Analyze Nigeria's population structure. Discuss population policy implications. Use Nigerian census data and projections.",
          },
        ],
      },
      {
        id: 'section21',
        title: '21. International Trade',
        topics: [
          {
            id: '21.1',
            title: 'Trade Theory',
            content: [
              'Meaning and basis for international trade',
              'Absolute and comparative advantage',
              'Balance of trade and balance of payments',
              'Composition and direction of Nigeria\'s trade',
              'Exchange rates: meaning, types, determination',
            ],
            objectives: [
              'Examine basis for international trade',
              'Differentiate absolute and comparative advantage',
              'Distinguish balance of trade and payments',
              'Highlight balance of payments problems',
              'Examine Nigeria\'s trade composition',
              'Identify exchange rate types',
              'Examine exchange rate determination',
            ],
            aiPrompt: "Explain international trade theory. Cover: comparative advantage, trade policies. Analyze Nigeria's trade patterns. Discuss exchange rate regimes. Use Nigerian trade data with China, EU, US.",
          },
        ],
      },
      {
        id: 'section22',
        title: '22. International Economic Organizations',
        topics: [
          {
            id: '22.1',
            title: 'Global Economic Bodies',
            content: [
              'Roles of ECOWAS, AU, EU, ECA, IMF, World Bank',
              'WTO, ADB, UNCTAD functions',
              'Relevance to Nigerian economy',
            ],
            objectives: [
              'Identify economic organizations and functions',
              'Evaluate relevance to Nigerian economy',
            ],
            aiPrompt: "Explain international economic organizations. Cover: IMF, World Bank, WTO, ECOWAS roles. Analyze their impact on Nigerian economy. Discuss Nigerian membership benefits and obligations.",
          },
        ],
      },
      {
        id: 'section23',
        title: '23. Factors of Production and Theories',
        topics: [
          {
            id: '23.1',
            title: 'Factor Markets',
            content: [
              'Types, features and rewards of factors',
              'Determination of wages, interest, profits',
              'Theories: marginal productivity, liquidity preference',
              'Factor mobility and efficiency',
              'Unemployment and solutions',
            ],
            objectives: [
              'Identify types and rewards of factors',
              'Analyze wage, interest, profit determination',
              'Interpret marginal productivity theory',
              'Examine factor mobility and efficiency',
              'Examine unemployment types and causes',
              'Suggest Nigerian unemployment solutions',
            ],
            aiPrompt: "Explain factors of production. Cover: labor, capital, land, entrepreneurship. Analyze factor pricing theories. Discuss Nigerian unemployment issues. Propose solutions for Nigerian job creation.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Aderinto, A.A et al (1996) Economics: Exam Focus',
          'Black, J. (1997) Oxford Dictionary of Economics',
          'Eyiyere, D.O. (1980) Economics Made Easy',
          'Fajana, F. et al (1999) Countdown to SSCE/JME Economics',
          'Falodun, A.B. et al (1997) Round-up Economics',
          'Kountsoyiannis, A. (1979) Modern Microeconomics',
          'Lipsey, R.G. (1997) An Introduction to Positive Economics',
          'Samuelson, P and Nordhaus, W. (1989) Economics',
          'Udu E and Agu G.A. (2005) New System Economics',
          'Wannacott and Wannacott (1979) Economics',
          'Brownson-oton Richard (2010) What is Micro-Economics?',
          'Brownson-oton Richard (2010) What is Macro-Economics?',
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
        AsyncStorage.getItem('economics_ai_explanations'),
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
    const systemPrompt = 'You are an expert Economics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current economic context. Use proper economic terminology. Format in markdown.';
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
      await AsyncStorage.setItem('economics_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Economics explanations.',
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
      const prompt = `As an Economics expert, explain "${topic.title}" for UTME/JAMB Economics preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Economics:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian economic examples and data
3. Explain concepts with graphs and diagrams where applicable
4. Include real Nigerian economic statistics
5. Highlight key economic principles with **bold**
6. Provide comparative analysis with Nigerian context
7. Include current economic trends in Nigeria
8. Provide practice questions with solutions
9. Connect theoretical concepts with Nigerian practical applications

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key economic terms
- Use > for important economic principles or facts
- Include Nigerian economic data where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian economic context and practical economic analysis.`;

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
              content: 'You are an expert Economics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current economic context. Use proper economic terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('economics_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Economics explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "trending-up" : "lock"} 
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
            color="#27ae60" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#27ae60" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#27ae60" style={styles.bulletIcon} />
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
                        color="#2ecc71" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#27ae60" />
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
                              <Icon name="school" size={16} color="#27ae60" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#2ecc71" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Economics</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#27ae60" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Economics</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian economic context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#27ae60" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Micro & Macro Economics</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of economic theories</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#27ae60" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Economy Focus</Text>
                <Text style={styles.featureDescription}>Real Nigerian economic data and examples</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#27ae60" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practice Questions</Text>
                <Text style={styles.featureDescription}>UTME-style questions with solutions</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Economics</Text>
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
          <Icon name="trending-up" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>ECONOMICS</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Economy Focus</Text>
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
            <Icon name="info" size={20} color="#27ae60" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#27ae60" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "trending-up" : "lock"} size={16} color={isPremiumActivated ? "#2ecc71" : "#999"} />
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
              <Icon name="show-chart" size={16} color="#27ae60" />
              <Text style={styles.tipText}>Includes Nigerian economic data and current trends</Text>
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
                <Icon name="trending-up" size={20} color="#27ae60" />
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
                  <ActivityIndicator size="large" color="#27ae60" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian economic context...
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
                <Icon name="share" size={20} color="#27ae60" />
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

// Markdown styles for Economics
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
    color: '#196F3D',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#196F3D',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F0FFF0',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F0FFF0',
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
    color: '#27ae60',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#27ae60',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#27ae60',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0FFF0',
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
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
    backgroundColor: '#27ae60',
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
    color: '#27ae60',
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
    backgroundColor: '#F0FFF0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#196F3D',
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
    backgroundColor: '#F8FFF8',
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
    color: '#27ae60',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#196F3D',
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
    color: '#27ae60',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#27ae60',
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
    color: '#27ae60',
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
    borderColor: '#27ae60',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
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
    backgroundColor: '#27ae60',
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
    backgroundColor: '#F0FFF0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
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
    backgroundColor: '#27ae60',
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
    backgroundColor: "rgba(39, 174, 96, 0.9)",
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

export default EconomicsSyllabusScreen;