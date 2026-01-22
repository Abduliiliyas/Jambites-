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

const AgricultureSyllabusScreen = () => {
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

  // Agriculture Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Stimulate and sustain interest in Agriculture',
          'Acquire basic knowledge and practical skills in Agriculture',
          'Acquire knowledge of interpretation and use of data',
          'Develop ability to make deductions using acquired agricultural knowledge',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: General Agriculture',
        topics: [
          {
            id: 'A1',
            title: 'Meaning and Scope of Agriculture',
            content: [
              'Definition of Agriculture in modern terms',
              'Branches of Agriculture',
              'Types: subsistence and commercial agriculture',
              'Advantages and disadvantages of each type',
            ],
            objectives: [
              'Use definition of Agriculture in modern terms',
              'Differentiate between branches of Agriculture',
              'Compare subsistence and commercial agriculture',
            ],
            aiPrompt: "Explain the meaning and scope of Agriculture. Cover: modern definition, branches, types (subsistence vs commercial). Use Nigerian agricultural context. Discuss advantages/disadvantages of each type with Nigerian examples.",
          },
          {
            id: 'A2',
            title: 'Importance of Agriculture',
            content: [
              'Provision of raw materials for agro-allied industries',
              'Employment generation',
              'Rural development',
              'Foreign exchange earnings',
              'Food security',
            ],
            objectives: [
              'Relate agricultural benefits to individual farmers',
              'Connect agro-allied industries to raw materials',
              'Analyze contributions to West African economic development',
            ],
            aiPrompt: "Explain the importance of Agriculture in Nigeria. Cover: economic contributions, employment, rural development, food security. Use current Nigerian agricultural statistics and examples of agro-allied industries.",
          },
          {
            id: 'A3',
            title: 'Agricultural Ecology',
            content: [
              'Ecological zones of West Africa',
              'Agricultural products of each zone',
              'Environmental factors affecting production',
              'Abiotic vs biotic factors',
            ],
            objectives: [
              'Differentiate ecological zones in West Africa',
              'Classify agricultural products by ecological zone',
              'Distinguish abiotic from biotic factors',
            ],
            aiPrompt: "Explain Agricultural Ecology in West Africa. Cover: ecological zones (forest, savannah, sahel), typical crops/animals in each zone. Discuss environmental factors affecting Nigerian agriculture: rainfall, temperature, soil types.",
          },
          {
            id: 'A4',
            title: 'Agricultural Genetics',
            content: [
              'Mendel\'s first and second laws',
              'Cell division (mitosis and meiosis)',
              'Genetic terminologies: locus, alleles, genotype, dominance',
              'Methods of crop improvement: introduction, selection, crossing',
            ],
            objectives: [
              'Apply Mendel\'s laws to genetics',
              'Differentiate types of cell division',
              'Determine outcomes of genetic crosses',
              'Compute probability ratios',
              'Distinguish crop improvement methods',
            ],
            aiPrompt: "Explain Agricultural Genetics. Cover: Mendel's laws, cell division, genetic terminologies. Use Nigerian crop examples (maize, cassava). Discuss modern crop improvement techniques used in Nigerian agriculture.",
          },
          {
            id: 'A5',
            title: 'Farm Inputs',
            content: [
              'Types of farm inputs',
              'Planting materials',
              'Agrochemicals',
              'Farm machinery',
              'Animal improvement methods',
            ],
            objectives: [
              'Classify farm inputs and their uses',
              'Distinguish animal improvement methods',
              'Compare breeding systems',
            ],
            aiPrompt: "Explain Farm Inputs in Nigerian agriculture. Cover: seeds, fertilizers, pesticides, machinery. Discuss animal improvement: breeding systems, artificial insemination. Use Nigerian examples and current practices.",
          },
          {
            id: 'A6',
            title: 'History of Agricultural Development in West Africa',
            content: [
              'Agricultural systems: shifting cultivation, bush fallowing',
              'Problems of agricultural development',
              'National research institutes: NCRI, IAR, CRIN, etc.',
              'International institutes: IITA, ILRI, ICRISAT',
              'Agricultural Development Projects (ADPs)',
              'National agricultural programmes',
            ],
            objectives: [
              'Compare agricultural systems',
              'Identify problems and solutions',
              'Trace history of research institutes',
              'Evaluate national programmes',
            ],
            aiPrompt: "Explain historical agricultural development in West Africa. Cover: traditional systems, modern developments, research institutes. Discuss Nigerian ADPs and national programmes. Analyze challenges and progress.",
          },
          {
            id: 'A7',
            title: 'Roles of Government and NGOs in Agricultural Development',
            content: [
              'Fiscal policies favorable to agriculture',
              'Agricultural laws and reforms',
              'Government programmes: subsidies, credit facilities',
              'Infrastructure provision',
              'NGO contributions',
            ],
            objectives: [
              'Evaluate effects of government policies',
              'Identify agricultural laws and reforms',
              'Assess government incentives',
              'Examine NGO roles',
            ],
            aiPrompt: "Explain roles of government and NGOs in Nigerian agriculture. Cover: policies, laws (Land Use Act), programmes (subsidies, credits). Discuss current government initiatives and NGO projects in Nigerian agriculture.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: Agronomy',
        topics: [
          {
            id: 'B1',
            title: 'Rocks and Soil Formation',
            content: [
              'Rock formation and types',
              'Factors affecting weathering and soil formation',
              'Soil physical properties: profile, texture, structure',
              'Soil chemical properties: acidity, alkalinity, components',
            ],
            objectives: [
              'Identify rock types and formation',
              'Analyze soil properties',
              'Differentiate soil horizons',
              'Determine soil pH',
            ],
            aiPrompt: "Explain rocks and soil formation. Cover: soil types in Nigeria, soil properties, pH importance. Discuss Nigerian soil management practices and soil fertility issues.",
          },
          {
            id: 'B2',
            title: 'Soil Water and Soil Conservation',
            content: [
              'Soil water: importance, sources, movement',
              'Water-holding capacity, wilting point',
              'Soil conservation methods',
              'Irrigation and drainage systems',
            ],
            objectives: [
              'Compare water types in soil',
              'Determine water-holding capacity',
              'Identify erosion causes and control',
              'Classify irrigation systems',
            ],
            aiPrompt: "Explain soil water and conservation. Cover: Nigerian soil water management, erosion control methods. Discuss irrigation systems used in Nigeria (fadama, drip). Use current examples.",
          },
          {
            id: 'B3',
            title: 'Soil Fertility',
            content: [
              'Macro and micro-nutrients',
              'Carbon, water and nitrogen cycles',
              'Soil flora and fauna',
              'Maintenance of soil fertility',
              'Nutrient deficiency symptoms',
            ],
            objectives: [
              'Classify plant nutrients',
              'Examine roles of soil organisms',
              'Compare fertility maintenance methods',
              'Identify deficiency symptoms',
            ],
            aiPrompt: "Explain soil fertility in Nigerian agriculture. Cover: essential nutrients, organic/inorganic fertilizers. Discuss soil management practices in different Nigerian ecological zones.",
          },
          {
            id: 'B4',
            title: 'Land Preparation and Soil Tillage',
            content: [
              'Principles of land preparation',
              'Tillage practices',
              'Factors affecting tillage choice',
              'Zero tillage and minimum tillage',
            ],
            objectives: [
              'Compare land preparation methods',
              'State advantages and disadvantages',
              'Give reasons for tillage choices',
            ],
            aiPrompt: "Explain land preparation and tillage in Nigerian agriculture. Cover: traditional vs modern methods, conservation tillage. Discuss practices suitable for different Nigerian crops and soils.",
          },
          {
            id: 'B5',
            title: 'Plant Forms and Functions',
            content: [
              'Parts of monocot and dicot plants',
              'Functions of plant parts',
              'Anatomy of storage organs',
            ],
            objectives: [
              'Identify plant parts and functions',
              'Distinguish monocots and dicots',
              'Identify storage organs',
            ],
            aiPrompt: "Explain plant forms and functions. Cover: Nigerian crop plant structures, storage organs (yam tubers, cassava roots). Discuss adaptations of Nigerian crops to local conditions.",
          },
          {
            id: 'B6',
            title: 'Growth, Development and Reproduction',
            content: [
              'Gametogenesis',
              'Pollination types',
              'Fertilization process',
              'Embryo formation and development',
            ],
            objectives: [
              'Examine gamete formation',
              'Identify pollination types',
              'Analyze fertilization',
              'Trace embryo development',
            ],
            aiPrompt: "Explain plant growth and reproduction. Cover: pollination mechanisms in Nigerian crops, fruit development. Use examples: maize pollination, citrus fruit development.",
          },
          {
            id: 'B7',
            title: 'Plant Propagation Methods',
            content: [
              'Sexual propagation: seeds, germination',
              'Asexual propagation: cutting, grafting, layering',
              'Nursery management',
            ],
            objectives: [
              'Classify propagation methods',
              'Determine seed viability',
              'Differentiate germination types',
              'Apply nursery techniques',
            ],
            aiPrompt: "Explain plant propagation methods used in Nigeria. Cover: seed propagation (maize, rice), vegetative propagation (cassava, yam, fruit trees). Discuss nursery management practices.",
          },
          {
            id: 'B8',
            title: 'Cropping Systems and Planting Patterns',
            content: [
              'Cropping systems: monocropping, mixed, intercropping',
              'Planting patterns: broadcasting, row spacing',
              'Plant densities',
            ],
            objectives: [
              'Identify and compare cropping systems',
              'Differentiate planting patterns',
              'Compute plant density',
            ],
            aiPrompt: "Explain cropping systems in Nigerian agriculture. Cover: traditional intercropping (maize/beans), modern monocropping. Discuss optimal plant densities for Nigerian crops.",
          },
          {
            id: 'B9',
            title: 'Crop Husbandry',
            content: [
              'Cereals: maize, rice, guinea corn',
              'Legumes: cowpea, groundnut, soybean',
              'Tubers: yam, cassava, sweet potato',
              'Vegetables and spices',
              'Fruits, beverages, oils, fibres, sugars',
            ],
            objectives: [
              'Apply husbandry practices for each crop',
              'Identify diseases and pests',
              'Determine economic importance',
              'Relate to national development',
            ],
            aiPrompt: "Explain crop husbandry in Nigeria. Cover: major Nigerian crops, cultivation practices, economic importance. Discuss current production statistics and challenges for each crop group.",
          },
          {
            id: 'B10',
            title: 'Pasture and Forage Crops',
            content: [
              'Common pasture grasses and legumes',
              'Establishment and maintenance',
              'Natural grasslands in West Africa',
              'Range management',
            ],
            objectives: [
              'Classify pasture plants',
              'Differentiate conservation methods',
              'Relate vegetational zones to pastures',
              'Determine range utilization',
            ],
            aiPrompt: "Explain pasture and forage crops in Nigeria. Cover: common species (guinea grass, elephant grass), pasture management. Discuss Nigerian livestock feed resources and challenges.",
          },
          {
            id: 'B11',
            title: 'Floriculture',
            content: [
              'Ornamental trees, shrubs, flowers',
              'Establishment and maintenance',
              'Uses of ornamental plants',
            ],
            objectives: [
              'Distinguish ornamental plants',
              'Determine uses and maintenance',
            ],
            aiPrompt: "Explain floriculture in Nigeria. Cover: popular ornamental plants, commercial flower production. Discuss opportunities in Nigerian ornamental horticulture.",
          },
          {
            id: 'B12',
            title: 'Weeds',
            content: [
              'Weed morphology and reproduction',
              'Weed effects on crops',
              'Control methods: mechanical, chemical, biological',
            ],
            objectives: [
              'Identify weeds',
              'Classify by dispersal mode',
              'Apply control methods',
            ],
            aiPrompt: "Explain weed science in Nigerian agriculture. Cover: common Nigerian weeds, economic impact, integrated weed management. Discuss herbicide use and resistance issues.",
          },
          {
            id: 'B13',
            title: 'Crop Diseases',
            content: [
              'Disease-causing organisms',
              'Symptoms and damage',
              'Transmission methods',
              'Control measures',
              'Side effects of control methods',
            ],
            objectives: [
              'Distinguish disease organisms',
              'Relate organisms to damage',
              'Apply control methods',
              'Assess side effects',
            ],
            aiPrompt: "Explain crop diseases in Nigeria. Cover: major diseases of Nigerian crops, symptoms, control. Discuss integrated pest management and environmental considerations.",
          },
          {
            id: 'B14',
            title: 'Crop Pests',
            content: [
              'Types of agricultural pests',
              'Life cycles of insects',
              'Prevention and control',
              'Pesticides and side effects',
            ],
            objectives: [
              'Identify field and store pests',
              'Assess economic importance',
              'Describe insect life cycles',
              'Examine pesticide modes of action',
            ],
            aiPrompt: "Explain crop pests in Nigerian agriculture. Cover: major pests (stalk borers, weevils, aphids), control methods. Discuss integrated pest management and pesticide safety.",
          },
          {
            id: 'B15',
            title: 'Forest Management (Silviculture)',
            content: [
              'Importance of forests',
              'Conservation methods',
              'Forest management systems',
            ],
            objectives: [
              'Relate forest products to uses',
              'Compare conservation methods',
            ],
            aiPrompt: "Explain forest management in Nigeria. Cover: Nigerian forest resources, conservation efforts, agroforestry. Discuss deforestation challenges and sustainable management.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: Animal Production',
        topics: [
          {
            id: 'C1',
            title: 'Forms and Classification of Farm Animals',
            content: [
              'Species and breeds in West Africa',
              'Distribution and uses',
              'External features',
            ],
            objectives: [
              'Classify farm animal breeds',
              'Locate distribution areas',
              'Identify uses of species',
              'Recognize external features',
            ],
            aiPrompt: "Explain farm animal classification in West Africa. Cover: Nigerian livestock breeds (Ndama cattle, West African dwarf goat), distribution, economic uses. Discuss indigenous vs exotic breeds.",
          },
          {
            id: 'C2',
            title: 'Animal Production Terminologies',
            content: [
              'Common husbandry terms',
              'Breeding and management terms',
            ],
            objectives: [
              'Distinguish husbandry terms',
            ],
            aiPrompt: "Explain animal production terminologies. Cover: Nigerian livestock farming terms, breeding terminology. Use local Nigerian examples and practices.",
          },
          {
            id: 'C3',
            title: 'Anatomy and Physiology of Farm Animals',
            content: [
              'Functions of tissues and organs',
              'Body systems: digestive, reproductive, respiratory',
              'Effects of environmental changes',
            ],
            objectives: [
              'Distinguish tissue and organ functions',
              'Compare body systems',
              'Determine climate change effects',
            ],
            aiPrompt: "Explain anatomy and physiology of Nigerian livestock. Cover: digestive systems (ruminants vs non-ruminants), adaptations to Nigerian climate. Discuss heat stress management.",
          },
          {
            id: 'C4',
            title: 'Reproduction in Farm Animals',
            content: [
              'Gametogenesis and estrus cycle',
              'Gestation and parturition',
              'Hormonal control',
              'Poultry reproduction',
            ],
            objectives: [
              'Explain reproduction process',
              'Trace development from fertilization',
              'Describe poultry reproduction',
            ],
            aiPrompt: "Explain reproduction in Nigerian livestock. Cover: breeding cycles, gestation periods, hatchery management. Discuss artificial insemination in Nigerian animal production.",
          },
          {
            id: 'C5',
            title: 'Animal Nutrition',
            content: [
              'Feed nutrients and functions',
              'Ration formulation',
              'Pasture and forage crops',
              'Nutrient deficiencies',
            ],
            objectives: [
              'Identify feed nutrients',
              'Differentiate feed types',
              'Trace deficiency symptoms',
              'Apply corrective measures',
            ],
            aiPrompt: "Explain animal nutrition in Nigeria. Cover: feed resources, ration formulation for Nigerian conditions, common deficiencies. Discuss feed challenges in Nigerian livestock production.",
          },
          {
            id: 'C6',
            title: 'Livestock Management',
            content: [
              'Housing systems',
              'Feeding practices',
              'Sanitation and veterinary care',
              'Intensive vs extensive systems',
            ],
            objectives: [
              'Apply management practices',
            ],
            aiPrompt: "Explain livestock management in Nigeria. Cover: housing systems, feeding strategies, health management. Compare traditional and modern Nigerian livestock practices.",
          },
          {
            id: 'C7',
            title: 'Animal Health',
            content: [
              'Animal diseases and pathogens',
              'Preventive and curative methods',
              'Parasites and control',
            ],
            objectives: [
              'Identify diseases and agents',
              'Classify livestock diseases',
              'Apply control measures',
              'Trace parasite life cycles',
            ],
            aiPrompt: "Explain animal health in Nigerian livestock. Cover: major diseases (PPR, Newcastle), parasite control, vaccination programmes. Discuss challenges in Nigerian veterinary services.",
          },
          {
            id: 'C8',
            title: 'Fisheries and Wildlife',
            content: [
              'Fish culture systems',
              'Common fish types',
              'Harvesting and processing',
              'Wildlife management',
            ],
            objectives: [
              'Identify common fish species',
              'Differentiate fish farming systems',
              'Assess harvesting methods',
              'Identify wildlife regulations',
            ],
            aiPrompt: "Explain fisheries and wildlife in Nigeria. Cover: aquaculture systems, common Nigerian fish species, wildlife conservation. Discuss economic importance and sustainability issues.",
          },
          {
            id: 'C9',
            title: 'Bee-keeping (Apiculture)',
            content: [
              'Meaning and importance',
              'Types of bees',
              'Bee-keeping methods',
              'Equipment and safety',
            ],
            objectives: [
              'Relate bee-keeping to development',
              'Differentiate bee types',
              'Classify bee-keeping methods',
              'Identify equipment and precautions',
            ],
            aiPrompt: "Explain apiculture in Nigeria. Cover: Nigerian bee species, honey production methods, economic importance. Discuss opportunities and challenges in Nigerian bee-keeping.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: Agricultural Economics and Extension',
        topics: [
          {
            id: 'D1',
            title: 'Factors of Agricultural Production',
            content: [
              'Land: meaning, ownership, uses',
              'Labour: types and sources',
              'Capital: sources and problems',
              'Management functions',
            ],
            objectives: [
              'Understand land and its uses',
              'Differentiate labour types',
              'Compare capital sources',
              'Determine management functions',
            ],
            aiPrompt: "Explain factors of agricultural production in Nigeria. Cover: land tenure systems, labor issues, financing challenges. Discuss Nigerian agricultural management practices.",
          },
          {
            id: 'D2',
            title: 'Basic Economic Principles',
            content: [
              'Demand and supply',
              'Production function',
              'Characteristics of agricultural production',
            ],
            objectives: [
              'Relate demand to supply',
              'Interpret graphs and curves',
              'Compute elasticity',
            ],
            aiPrompt: "Explain economic principles in Nigerian agriculture. Cover: demand-supply dynamics, production economics, price elasticity. Use Nigerian agricultural commodity examples.",
          },
          {
            id: 'D3',
            title: 'Labour Management',
            content: [
              'Labour relations',
              'Types of labour',
              'National labour laws',
            ],
            objectives: [
              'Identify labour efficiency methods',
              'Differentiate labour types',
              'Apply labour laws',
            ],
            aiPrompt: "Explain labour management in Nigerian agriculture. Cover: farm labour issues, mechanization impact, labour laws. Discuss seasonal labour patterns in Nigerian farming.",
          },
          {
            id: 'D4',
            title: 'Farm Management',
            content: [
              'Qualities of farm manager',
              'Records and record-keeping',
              'Stock evaluation',
              'Agricultural insurance',
            ],
            objectives: [
              'Identify manager qualities',
              'Differentiate record types',
              'Determine profit margins',
              'Examine insurance relevance',
            ],
            aiPrompt: "Explain farm management in Nigeria. Cover: farm records, financial management, risk management. Discuss challenges in Nigerian farm management.",
          },
          {
            id: 'D5',
            title: 'Marketing of Agricultural Produce',
            content: [
              'Importance of marketing',
              'Marketing channels',
              'Characteristics affecting marketing',
            ],
            objectives: [
              'Evaluate marketing importance',
              'Classify marketing agents',
              'Determine marketing problems',
            ],
            aiPrompt: "Explain agricultural marketing in Nigeria. Cover: value chains, market structures, pricing issues. Discuss Nigerian agricultural marketing challenges and reforms.",
          },
          {
            id: 'D6',
            title: 'Agricultural Extension',
            content: [
              'Meaning and importance',
              'Role of institutions',
              'Extension methods',
              'Problems and solutions',
            ],
            objectives: [
              'Identify extension importance',
              'Analyze institutional roles',
              'Differentiate extension methods',
              'Examine problems and solutions',
            ],
            aiPrompt: "Explain agricultural extension in Nigeria. Cover: extension services, farmer education, technology transfer. Discuss challenges in Nigerian agricultural extension.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'SECTION E: Agricultural Technology',
        topics: [
          {
            id: 'E1',
            title: 'Farm Surveying and Planning',
            content: [
              'Meaning and importance',
              'Surveying equipment',
              'Survey methods',
              'Farmstead planning',
            ],
            objectives: [
              'Examine surveying relevance',
              'Classify equipment',
              'Differentiate survey methods',
              'Apply planning principles',
            ],
            aiPrompt: "Explain farm surveying and planning in Nigeria. Cover: surveying techniques, farm layout design. Discuss modern technologies in Nigerian farm planning.",
          },
          {
            id: 'E2',
            title: 'Farm Tools and Machinery',
            content: [
              'Simple farm tools',
              'Farm machinery and implements',
              'Uses and maintenance',
            ],
            objectives: [
              'Identify farm tools',
              'Use and maintain tools',
              'Operate farm machinery',
            ],
            aiPrompt: "Explain farm tools and machinery in Nigerian agriculture. Cover: traditional tools, modern machinery, maintenance practices. Discuss mechanization challenges in Nigeria.",
          },
          {
            id: 'E3',
            title: 'Farm Mechanization',
            content: [
              'Sources of farm power',
              'Advantages and disadvantages',
              'Problems and prospects',
            ],
            objectives: [
              'Compare power sources',
              'Distinguish mechanization pros/cons',
              'Assess mechanization prospects',
            ],
            aiPrompt: "Explain farm mechanization in Nigeria. Cover: mechanization levels, power sources, challenges. Discuss government policies on agricultural mechanization.",
          },
          {
            id: 'E4',
            title: 'Processing and Storage',
            content: [
              'Traditional and modern processing',
              'Storage methods',
              'Preservation techniques',
            ],
            objectives: [
              'Identify processing importance',
              'Differentiate processing methods',
              'Apply storage methods',
            ],
            aiPrompt: "Explain agricultural processing and storage in Nigeria. Cover: post-harvest handling, storage technologies, value addition. Discuss Nigerian food processing industry.",
          },
          {
            id: 'E5',
            title: 'Introduction to Biotechnology',
            content: [
              'Basic biotech terms',
              'Tissue culture',
              'Genetic engineering',
            ],
            objectives: [
              'Use biotech terms',
              'Provide reasons for importance',
            ],
            aiPrompt: "Explain agricultural biotechnology in Nigeria. Cover: tissue culture applications, GMOs, biotech research. Discuss prospects and controversies in Nigerian agricultural biotech.",
          },
          {
            id: 'E6',
            title: 'ICT in Agriculture',
            content: [
              'Computer features',
              'Uses in agriculture',
              'Communication gadgets',
            ],
            objectives: [
              'Identify computer components',
              'Use computers in agriculture',
              'Use communication gadgets',
            ],
            aiPrompt: "Explain ICT applications in Nigerian agriculture. Cover: precision farming, mobile apps for farmers, data analytics. Discuss digital agriculture initiatives in Nigeria.",
          },
          {
            id: 'E7',
            title: 'Agricultural Research and Statistics',
            content: [
              'Experimental concepts',
              'Interpretation of results',
              'Statistical measures',
            ],
            objectives: [
              'Use experimental concepts',
              'Draw inferences from results',
              'Compute statistical measures',
            ],
            aiPrompt: "Explain agricultural research and statistics in Nigeria. Cover: research methodology, data analysis, statistical applications. Discuss Nigerian agricultural research system.",
          },
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
        AsyncStorage.getItem('agriculture_ai_explanations'),
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
    const systemPrompt = 'You are an expert Agriculture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and practical applications. Use proper agricultural terminology. Format in markdown.';
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
      await AsyncStorage.setItem('agriculture_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Agriculture explanations.',
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
      const prompt = `As an Agriculture expert, explain "${topic.title}" for UTME/JAMB Agriculture preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Agriculture:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian agricultural examples and data
3. Explain concepts with diagrams where applicable
4. Include practical applications in Nigerian farming
5. Highlight key agricultural principles with **bold**
6. Provide comparative analysis with Nigerian context
7. Include current agricultural trends in Nigeria
8. Provide practical farming recommendations
9. Connect theoretical concepts with Nigerian farm practices

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key agricultural terms
- Use > for important agricultural principles or facts
- Include Nigerian agricultural statistics where available
- Make it engaging for Nigerian students

Write in clear, practical style with emphasis on Nigerian agricultural context and hands-on applications.`;

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
              content: 'You are an expert Agriculture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and practical applications. Use proper agricultural terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('agriculture_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Agriculture explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "grass" : "lock"} 
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
            color="#8B4513" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#8B4513" style={styles.bulletIcon} />
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
                        color="#A0522D" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#8B4513" />
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
                              <Icon name="school" size={16} color="#8B4513" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#A0522D" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Agriculture</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Agriculture</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian agricultural context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Crop & Animal Science</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of agricultural sciences</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Farming Focus</Text>
                <Text style={styles.featureDescription}>Practical Nigerian farming examples and data</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practical Applications</Text>
                <Text style={styles.featureDescription}>Real farming techniques and practices</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Agriculture</Text>
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
          <Icon name="grass" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>AGRICULTURE</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Agricultural Focus</Text>
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
            <Icon name="info" size={20} color="#8B4513" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "grass" : "lock"} size={16} color={isPremiumActivated ? "#A0522D" : "#999"} />
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
              <Icon name="agriculture" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Includes Nigerian agricultural data and practices</Text>
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
                <Icon name="grass" size={20} color="#8B4513" />
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
                  <ActivityIndicator size="large" color="#8B4513" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian agricultural context...
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
                <Icon name="share" size={20} color="#8B4513" />
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

// Markdown styles for Agriculture
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
    color: '#556B2F',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0522D',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#556B2F',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F5F5DC',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D2B48C',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F5F5DC',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D2B48C',
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
    color: '#8B4513',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#8B4513',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#8B4513',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F5F5DC',
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    color: '#8B4513',
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
    backgroundColor: '#FAF0E6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#556B2F',
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
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D2B48C',
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
    color: '#8B4513',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A0522D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#556B2F',
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
    color: '#8B4513',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#8B4513',
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
    color: '#8B4513',
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
    borderColor: '#8B4513',
  },
  saveButton: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    backgroundColor: '#FAF0E6',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    backgroundColor: "rgba(139, 69, 19, 0.9)",
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

export default AgricultureSyllabusScreen;