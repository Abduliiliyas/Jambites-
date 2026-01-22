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

const GeographySyllabusScreen = () => {
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

  // Geography Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'handle and interpret topographical maps, photographs, statistical data and diagrams and basic field survey;',
          'demonstrate knowledge of man\'s physical and human environment and how man lives and earns a living on earth surface with special reference to Nigeria and Africa;',
          'show understanding of the interrelationship between man and his environment;',
          'apply geographical concepts, skills and principles to solving problems;',
          'understand field work techniques and the study of a local area in the field.',
        ],
      },
      {
        id: 'part1',
        title: 'PART I: PRACTICAL GEOGRAPHY',
        topics: [
          {
            id: '1.1',
            title: 'Maps',
            content: [
              'Definition and identification of different types and uses of maps',
            ],
            objectives: [
              'Define and identify different types and uses of maps',
            ],
            aiPrompt: "Explain different types of maps: topographic, thematic, political, physical, weather maps. Discuss their uses in geography with Nigerian examples. Include map interpretation skills for UTME preparation.",
          },
          {
            id: '1.2',
            title: 'Scale and Measurement',
            content: [
              'Scale and measurement of distances',
              'Area reduction and enlargement',
              'Directions, bearings and gradients',
              'Reference to topographical maps',
            ],
            objectives: [
              'Apply the different types of scale to distances and area measurement',
              'Understand conversion of scales',
              'Apply the knowledge of scale to gradients, map reduction and enlargement',
              'Apply the knowledge of directions and bearings to geographical features',
            ],
            aiPrompt: "Explain map scales: representative fraction, linear scale, statement scale. Demonstrate distance and area calculations. Discuss bearing measurement (true and magnetic), gradient calculation, and map enlargement/reduction techniques with Nigerian topographical map examples.",
          },
          {
            id: '1.3',
            title: 'Map Reading and Interpretation',
            content: [
              'Drawing of cross profiles',
              'Recognition of intervisibility',
              'Recognition and description of physical and human features',
              'Relationship as depicted on topographical maps',
            ],
            objectives: [
              'Illustrate the relief of an area through profile drawing',
              'Interpret physical and human features from topographical maps',
            ],
            aiPrompt: "Explain topographic map interpretation for UTME Geography. Cover: cross-section/profile drawing, intervisibility determination, identification of physical features (relief, drainage) and human features (settlements, roads, agriculture). Use Nigerian topographic maps as examples.",
          },
          {
            id: '1.4',
            title: 'Interpretation of Statistical Data',
            content: [
              'Maps and diagrams interpretation',
            ],
            objectives: [
              'Compute quantitative information from statistical data, diagrams and maps',
              'Interpret statistical data, diagrams and maps',
            ],
            aiPrompt: "Explain statistical data interpretation in geography: line graphs, bar charts, pie charts, choropleth maps, isoline maps. Discuss computation techniques and data interpretation skills with Nigerian demographic and economic data examples.",
          },
          {
            id: '1.5',
            title: 'Elementary Surveying',
            content: [
              'Chain and prismatic surveying',
              'Open and close traverse',
              'Procedure, problems, advantages and disadvantages',
            ],
            objectives: [
              'Analyse the principle and procedure of each technique',
              'Compare the advantages and disadvantages of the two techniques',
            ],
            aiPrompt: "Explain elementary surveying techniques: chain surveying and prismatic compass surveying. Discuss procedures for open and closed traverse. Compare advantages and disadvantages. Include Nigerian fieldwork applications and practical problems.",
          },
          {
            id: '1.6',
            title: 'Geographic Information System (GIS)',
            content: [
              'Components, techniques, data sources',
              'Applications',
            ],
            objectives: [
              'Understand GIS and its uses',
              'Understand the basic concepts and components',
              'Express locations through the use of latitudes, longitudes, zipcodes etc',
              'Understand land surveying, remote sensing, map digitizing, map scanning as sources of data',
              'Explain areas of use: Defense, Agriculture, Rural Development etc',
              'Identify problems with GIS in Nigeria',
            ],
            aiPrompt: "Explain Geographic Information System (GIS) for UTME Geography. Cover: components (hardware, software, data, people), techniques, data sources. Discuss Nigerian applications in agriculture, urban planning, disaster management. Analyze challenges of GIS implementation in Nigeria.",
          },
        ],
      },
      {
        id: 'part2',
        title: 'PART II: PHYSICAL GEOGRAPHY',
        topics: [
          {
            id: '2.1',
            title: 'The Earth as a Planet',
            content: [
              'The earth in the solar system',
              'Rotation and revolution',
              'The shape and size of the earth',
              'Latitudes and distances',
              'Longitudes and time',
            ],
            objectives: [
              'Identify the relative positions of the planets in the solar system',
              'Understand the effects of the rotation and revolution of the earth',
              'Provide proof for the shape and size of the earth',
              'Differentiate between latitudes and longitudes',
              'Relate lines of latitude to calculation of distance',
              'Relate lines of longitude to calculation of time',
            ],
            aiPrompt: "Explain Earth as a planet: position in solar system, rotation (day/night, Coriolis effect), revolution (seasons). Discuss Earth's shape and size evidence. Detail latitude (distance calculation) and longitude (time zones). Include Nigerian specific coordinates and time zone.",
          },
          {
            id: '2.2',
            title: 'The Earth Crust',
            content: [
              'Structure of the earth (internal and external)',
              'Relationships among the four spheres',
              'Rocks: Types, characteristics, modes of formation and uses',
              'Earth\'s movement: Tectonic forces',
              'Major Landforms: Mountains, Plateau, Plains, Coastal landforms, karst topography and desert landforms',
            ],
            objectives: [
              'Compare the internal and external components of the earth',
              'Understand relationships among atmosphere, biosphere and hydrosphere',
              'Differentiate between major types of rocks and their characteristics',
              'Analyse processes of rock formation and resultant features',
              'Indicate uses of rocks',
              'Differentiate between tensional and compressional forces',
              'Identify and describe major landforms',
            ],
            aiPrompt: "Explain Earth's structure: crust, mantle, core. Discuss rock types (igneous, sedimentary, metamorphic) with Nigerian examples. Analyze tectonic forces and major landforms. Cover Nigerian landforms: Jos Plateau, Niger Delta, Chad Basin, etc.",
          },
          {
            id: '2.3',
            title: 'Volcanism and Earthquakes',
            content: [
              'Processes of volcanic eruptions and earthquakes',
              'Landforms associated with volcanic activities',
              'Landforms of Igneous Rocks',
              'Origin and types of Volcanoes',
              'Some volcanic eruptions and earthquakes',
            ],
            objectives: [
              'Explain processes of volcanic eruptions and earthquakes',
              'Describe different landforms associated with volcanic eruptions and earthquakes',
              'Give examples of major volcanic eruptions and earthquakes in the world',
            ],
            aiPrompt: "Explain volcanism and earthquakes: processes, causes, effects. Discuss associated landforms: volcanic mountains, calderas, lava plateaus. Include global examples and discuss seismic activity in Nigeria (minor tremors) and neighboring volcanic regions.",
          },
          {
            id: '2.4',
            title: 'Denudation Processes in the Tropics',
            content: [
              'Weathering',
              'Erosion',
              'Mass movement',
              'Deposition',
            ],
            objectives: [
              'Identify agents of denudation (water, wind and waves)',
              'Identify landforms associated with each process and agent',
            ],
            aiPrompt: "Explain denudation processes in tropical regions: weathering (chemical, physical), erosion (water, wind, wave), mass movement, deposition. Discuss resulting landforms with Nigerian examples: gully erosion in SE Nigeria, coastal erosion in Lagos, desertification in NE Nigeria.",
          },
          {
            id: '2.5',
            title: 'Water Bodies',
            content: [
              'Oceans and seas (world distribution, salinity and uses)',
              'Ocean currents: types, distribution, causes and effects',
              'Lakes: types, distribution and uses',
              'Rivers: Action of running water',
            ],
            objectives: [
              'Locate oceans and seas on the globe',
              'Examine characteristics and uses of oceans and seas',
              'Classify types of ocean currents',
              'Account for distribution of ocean currents',
              'Evaluate causes and effects of ocean currents',
              'Identify types and location of lakes',
              'Indicate characteristics and uses of lakes',
              'Identify landforms of different stages of a river course',
            ],
            aiPrompt: "Explain water bodies: oceans/seas distribution, salinity, uses. Discuss ocean currents (warm/cold) affecting West Africa (Guinea Current, Canary Current). Cover Nigerian water bodies: Niger River, Benue River, Lake Chad, Atlantic Ocean coastline. Include river processes and landforms.",
          },
          {
            id: '2.6',
            title: 'Weather and Climate',
            content: [
              'Concept of weather and climate',
              'Elements of weather and climate',
              'Factors controlling weather and climate (pressure, air mass, altitude, continentality and winds)',
              'Classification of climate (Greek and Koppen)',
              'Major climate types (Koppen), characteristics and distribution',
              'Measuring and recording weather parameters',
              'The basic science of climate change',
            ],
            objectives: [
              'Differentiate between weather and climate',
              'Identify elements of weather and climate',
              'Identify factors controlling weather and climate',
              'Compare Koppen\'s and Greek\'s classifications',
              'Identify major climate types according to Koppen',
              'Relate weather instruments to their uses',
              'Define climate change',
              'Understand causes of climate change',
              'Understand effects and remedies of climate change',
            ],
            aiPrompt: "Explain weather and climate concepts. Cover Nigerian climate zones: equatorial (South), tropical (Middle Belt), arid (North). Discuss climate factors affecting Nigeria. Analyze climate change impacts on Nigeria: desertification, flooding, agricultural changes, and mitigation strategies.",
          },
          {
            id: '2.7',
            title: 'Vegetation',
            content: [
              'Factors controlling growth of plants',
              'Concept of vegetation (plant communities and succession)',
              'Major types of vegetation, characteristics and distribution',
              'Impact of human activities on vegetation',
            ],
            objectives: [
              'Trace factors controlling growth of plants',
              'Analyse process of vegetation development',
              'Identify types, characteristics and distribution',
              'Assess impact of human activities on vegetation',
              'Identify importance of vegetation',
            ],
            aiPrompt: "Explain vegetation zones of Nigeria: mangrove (coastal), rainforest (South), Guinea savanna (Middle Belt), Sudan savanna, Sahel (North). Discuss factors affecting vegetation, ecological succession, and human impacts (deforestation, agriculture, urbanization) with Nigerian examples.",
          },
          {
            id: '2.8',
            title: 'Soil',
            content: [
              'Definition and properties',
              'Factors and processes of formation',
              'Soil profiles',
              'Major tropical types, characteristics, distribution and uses',
              'Impact of human activities on soils',
            ],
            objectives: [
              'Classify soils and their properties',
              'Identify factors of formation',
              'Differentiate between soil horizons',
              'Compare major tropical soil types and uses',
              'Account for distribution and uses of soils',
              'Assess impact of human activities on soils',
            ],
            aiPrompt: "Explain soil science: properties, formation processes, soil profile. Discuss major Nigerian soil types: ferruginous soils, ferralitic soils, hydromorphic soils, sandy soils. Analyze soil degradation issues: erosion, desertification, pollution, and conservation methods in Nigeria.",
          },
          {
            id: '2.9',
            title: 'Environmental Resources',
            content: [
              'Types of resources (atmospheric, land, soil, vegetation and minerals)',
              'Concept of renewable and non-renewable resources',
            ],
            objectives: [
              'Interpret concept of environmental resources',
              'Relate environmental resources to their uses',
              'Differentiate between renewable and non-renewable resources',
            ],
            aiPrompt: "Explain environmental resources: types, classification (renewable vs non-renewable). Discuss Nigerian resources: petroleum (Niger Delta), solid minerals (Jos Plateau), agricultural land, water resources. Analyze sustainable resource management challenges.",
          },
          {
            id: '2.10',
            title: 'Environmental Interaction',
            content: [
              'Land ecosystem',
              'Environmental balance and human interaction',
              'Effects of human activities on land ecosystem',
            ],
            objectives: [
              'Identify components of land ecosystem',
              'Establish interrelationship within ecosystem',
              'Interpret concept of environmental balance',
              'Analyse effects of human activities on land ecosystem',
            ],
            aiPrompt: "Explain environmental interactions and ecosystems. Discuss Nigerian ecosystems: Niger Delta mangroves, Sahel savanna, rainforests. Analyze human-environment interactions: agriculture, urbanization, mining impacts. Cover ecological balance concepts.",
          },
          {
            id: '2.11',
            title: 'Environmental Hazards',
            content: [
              'Natural hazards (droughts, earthquakes, volcanic eruptions, flooding)',
              'Man-induced (soil erosion, deforestation, pollution, flooding and desertification)',
            ],
            objectives: [
              'Identify natural hazards and their causes',
              'Relate human-induced hazards to their causes',
              'Locate major areas where environmental hazards are common',
              'Recommend prevention and control methods',
            ],
            aiPrompt: "Explain environmental hazards affecting Nigeria: natural (flooding, drought, erosion) and human-induced (deforestation, pollution, desertification). Discuss specific regions: SE gully erosion, NE desertification, coastal erosion. Analyze prevention and control strategies.",
          },
          {
            id: '2.12',
            title: 'Environmental Conservation',
            content: [
              'Meaning and importance',
              'Resources for conservation',
              'Methods of environmental conservation',
            ],
            objectives: [
              'Explain environmental conservation with examples',
              'Identify resources for conservation',
              'Discuss different conservation methods',
              'Explain need/importance of environmental conservation',
            ],
            aiPrompt: "Explain environmental conservation: meaning, importance, methods. Discuss Nigerian conservation efforts: national parks (Yankari, Cross River), afforestation programs, soil conservation, wildlife protection. Analyze challenges and success stories.",
          },
        ],
      },
      {
        id: 'part3',
        title: 'PART III: HUMAN GEOGRAPHY',
        topics: [
          {
            id: '3.1',
            title: 'Population',
            content: [
              'World population with reference to Amazon Basin, N.E. U.S.A., India, Japan, West Coast of Southern Africa',
              'Characteristics – birth and death rates, ages/sex structure',
              'Factors and patterns of population distribution',
              'Factors and problems of population growth',
            ],
            objectives: [
              'Define different concepts of population',
              'Identify characteristics of population (growth rates and structure)',
              'Determine factors and patterns of population distribution',
              'Identify factors and problems of population growth',
              'Relate types of migration to causes and effects',
              'Account for ways population constitutes a resource',
            ],
            aiPrompt: "Explain population geography: concepts, characteristics, distribution patterns. Discuss Nigerian population: distribution patterns (dense South, sparse North), growth rates, age structure, migration patterns (rural-urban). Compare with global regions mentioned in syllabus.",
          },
          {
            id: '3.2',
            title: 'Settlement',
            content: [
              'Types and patterns: rural and urban, dispersed, nucleated and linear',
              'Rural settlement: classification, factors of growth and functions',
              'Urban settlement – classification, factors of growth and functions',
              'Problems of urban centres',
              'Interrelationship between rural and urban settlements',
            ],
            objectives: [
              'Differentiate between types of settlements',
              'Classify patterns and functions of rural settlements',
              'Classify patterns and functions of urban settlements',
              'Identify factors of settlement location',
              'Identify problems of urban centres',
              'Establish interrelationship between rural and urban settlements',
            ],
            aiPrompt: "Explain settlement geography: rural vs urban, settlement patterns. Discuss Nigerian settlements: rural patterns (dispersed North, nucleated South), urbanization trends. Analyze urban problems in Nigerian cities (Lagos, Abuja, Port Harcourt) and rural-urban linkages.",
          },
          {
            id: '3.3',
            title: 'Selected Economic Activities',
            content: [
              'Types of economic activities: primary, secondary, tertiary and quaternary',
              'Agriculture: types, system, factors and problems',
              'Manufacturing industries: types, locational factors, distribution and socio-economic importance',
              'Problems of industrialization in tropical Africa',
              'Transportation and Communication types, roles in economic development',
              'World trade: factors and pattern, major commodities (origin, routes and destinations)',
              'Tourism: definition, importance, location, problems and solutions',
            ],
            objectives: [
              'Identify types of economic activities',
              'Differentiate between types of economic activities',
              'Assess importance and problems of agriculture',
              'Compare types of manufacturing industries',
              'Identify factors of industrial location',
              'Examine socio-economic importance of manufacturing',
              'Give reasons for problems of industrialization in tropical Africa',
              'Differentiate between modes of transportation and communication',
              'Assess economic importance of transportation',
              'Give reasons for transportation problems in tropical Africa',
              'Relate factors to pattern of world trade',
              'Classify major trade commodities',
              'Analyse tourism as economic activity',
              'Identify problems of tourism and solutions',
            ],
            aiPrompt: "Explain economic geography with Nigerian focus. Cover: agriculture (subsistence vs commercial, problems), manufacturing (location factors, industrial estates), transport (road, rail, air, water challenges), trade (Nigeria's exports/imports), tourism potential and challenges in Nigeria.",
          },
        ],
      },
      {
        id: 'part4',
        title: 'PART IV: REGIONAL GEOGRAPHY',
        topics: [
          {
            id: '4.1',
            title: 'Broad Outline of Nigeria',
            content: [
              'Location, position, size, political division (states) and peoples',
              'Physical setting: geology, relief, landform, climate and drainage, vegetation and soils',
              'Population: size, distribution, migration (types, problems and effects)',
              'Natural resources: types (minerals, soils, water, vegetation) distribution, uses and conservation',
            ],
            objectives: [
              'Describe location, size and political divisions of Nigeria',
              'Identify boundaries and neighbours of Nigeria',
              'Identify ethnic groups and their distributions',
              'Relate physical settings to effects on human activities',
              'Account for pattern of population distribution',
              'Examine types of migration, problems and effects',
              'Identify types of natural resources and their distribution',
              'Indicate uses and conservation of natural resources',
            ],
            aiPrompt: "Provide comprehensive regional geography of Nigeria. Cover: geographical location, political divisions (36 states), physical geography (relief, climate, vegetation zones), population distribution patterns, migration trends, natural resource distribution (minerals, agricultural land), and conservation challenges.",
          },
          {
            id: '4.2',
            title: 'Economic and Human Geography of Nigeria',
            content: [
              'Agricultural Systems: major crops produced, problems of agricultural development',
              'Manufacturing Industries: factors of location, types of products, marketing and problems',
              'Transportation and Communication: modes, relative advantages and disadvantages',
              'Trade: Regional and International Trade, advantages and disadvantages',
              'Tourism: definition, importance, problems and solutions',
            ],
            objectives: [
              'Compare farming systems practised in Nigeria',
              'Identify crops produced and problems encountered',
              'Identify types and location of major manufacturing industries',
              'Determine factors of industrial location and associated problems',
              'Establish relationship between transport and communication',
              'Relate transportation modes to advantages and disadvantages',
              'Classify major commodities of regional and international trade',
              'Identify importance of tourism and tourist centres',
              'Account for problems of tourism and solutions',
            ],
            aiPrompt: "Analyze Nigeria's economic geography: agricultural systems (cocoa belt, groundnut pyramid, rice cultivation), manufacturing (Lagos-Ibadan axis, Onitsha-Nnewi, Kano), transport networks (Lagos port, railway revival), trade patterns (ECOWAS, international), tourism potential (Yankari, Obudu, historical sites).",
          },
          {
            id: '4.3',
            title: 'ECOWAS',
            content: [
              'Meaning and objectives',
              'Member states',
              'Advantages and disadvantages',
              'Problems and solutions',
            ],
            objectives: [
              'State meaning, purpose and objectives of ECOWAS',
              'Identify and locate member countries',
              'Understand purpose/mandate of the organization',
              'Evaluate prospects and problems of the organization',
            ],
            aiPrompt: "Explain ECOWAS (Economic Community of West African States): establishment, objectives, member countries. Discuss Nigeria's role as dominant member. Analyze achievements (free movement protocol, trade liberalization), challenges (political instability, economic disparities), and future prospects.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Adeleke and Arcola (2002) Certificate Physical and Human Geography for Senior Secondary School',
          'Balogun, O.Y. (2009) Senior Secondary Atlas, Nigeria: Longman',
          'Bradshaw, M. et al (2004) Contemporary World Regional Geography, McGraw Hill',
          'Bunet and Okunrotifa (1999) General Geography in Diagrams for West Africa',
          'Collins New Secondary Atlas, Macmillan',
          'Emiela, S.A. (2014) Senior Secondary Geography (New Syllabus Edition)',
          'Fellman, D. et al (2005) Introduction to Geography (Seventh Edition)',
          'Getis, A. et al (2004) Introduction to Geography (Ninth Edition)',
          'Iloeje, N. P (1999) A New Geography of West Africa',
          'Iloeje, N.P (1982) A New Geography of Nigeria (New Education)',
          'Iwena, O.A. (2018) Essential Geography for Senior Secondary Schools',
          'Nimako, D.A. (2000) Map Reading of West Africa',
          'Okunrotifa and Michael (2000) A Regional Geography of Africa (New Edition)',
          'Udo, R.K (1970) Geographical Regions of Nigeria',
          'Waugh, D. (1995) Geography an Integrated Approach (Second Edition)',
          'Wisdomline Pass at Once JAMB',
          'Adegoke, M.A (2013) A Comprehensive Text on Physical, Human and Regional Geography',
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
        AsyncStorage.getItem('geography_ai_explanations'),
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
    const systemPrompt = 'You are an expert Geography tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current context. Use proper geographical terminology. Format in markdown.';
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
      await AsyncStorage.setItem('geography_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with Nigerian geographical context.',
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
      const prompt = `As a Geography expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Geography Studies:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian examples and context
3. Explain concepts with reference to Nigerian geographical features
4. Include maps and diagrams descriptions
5. Highlight key learning points with **bold**
6. Provide comparative analysis where applicable
7. Include current environmental issues in Nigeria
8. Provide practice questions with solutions
9. Connect theoretical concepts with practical applications

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key geographical terms
- Use > for important geographical principles
- Include Nigerian statistical data where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian geographical context and current environmental issues.`;

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
              content: 'You are an expert Geography tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current context. Use proper geographical terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('geography_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Geography explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "terrain" : "lock"} 
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
            color="#006400" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#006400" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#006400" style={styles.bulletIcon} />
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
                        color="#008000" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#006400" />
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
                              <Icon name="school" size={16} color="#006400" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#228B22" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Geography Studies</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006400" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Geography Explanations</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian geographical context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006400" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Physical & Human Geography</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of all geography topics</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006400" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Map Interpretation Skills</Text>
                <Text style={styles.featureDescription}>Detailed analysis of map reading and interpretation</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006400" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Environmental Issues in Nigeria</Text>
                <Text style={styles.featureDescription}>Current environmental challenges and solutions</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Geography Studies</Text>
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
          <Icon name="public" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>GEOGRAPHY</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian & African Geographical Focus</Text>
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
            <Icon name="info" size={20} color="#006400" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#006400" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "terrain" : "lock"} size={16} color={isPremiumActivated ? "#228B22" : "#999"} />
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
              <Icon name="map" size={16} color="#006400" />
              <Text style={styles.tipText}>Includes Nigerian geographical context and environmental issues</Text>
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
                <Icon name="terrain" size={20} color="#006400" />
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
                  <ActivityIndicator size="large" color="#006400" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian geographical context...
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
                <Icon name="share" size={20} color="#006400" />
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

// Markdown styles for Geography
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
    color: '#004400',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006400',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#228B22',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#004400',
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
    borderColor: '#CCFFCC',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F0FFF0',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFFCC',
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
    color: '#006400',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#006400',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#006400',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0FFF0',
    borderLeftWidth: 4,
    borderLeftColor: '#006400',
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
    backgroundColor: '#006400',
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
    color: '#006400',
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
    color: '#004400',
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
    borderColor: '#CCFFCC',
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
    color: '#006400',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#228B22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#004400',
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
    color: '#006400',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#006400',
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
    color: '#006400',
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
    borderColor: '#006400',
  },
  saveButton: {
    backgroundColor: '#006400',
    borderColor: '#006400',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006400',
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
    backgroundColor: '#006400',
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
    color: '#006400',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006400',
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
    backgroundColor: '#006400',
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
    backgroundColor: "rgba(0, 100, 0, 0.9)",
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

export default GeographySyllabusScreen;