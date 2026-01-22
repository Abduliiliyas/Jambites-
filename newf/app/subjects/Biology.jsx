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

const BiologySyllabusScreen = () => {
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

  // Biology Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Demonstrate sufficient knowledge of the concepts of the diversity, interdependence and unity of life',
          'Account for continuity of life through reorganization, inheritance and evolution',
          'Apply biological principles and concepts to everyday life, especially to matters affecting living things, individual, society, the environment, community health and the economy',
        ],
      },
      {
        id: 'sectionA',
        title: 'A: VARIETY OF ORGANISMS',
        topics: [
          {
            id: 'A.1',
            title: '1. Living organisms',
            content: [
              'Characteristics of living and non-living things',
              'Cell structure and functions of cell components',
              'Level of organization: Cell, Tissue, Organ, System, Organism',
              'Plant and animal cells comparison',
            ],
            objectives: [
              'Differentiate between characteristics of living and non-living things',
              'Identify structures of plant and animal cells',
              'Analyze functions of components of plant and animal cells',
              'Compare and contrast structure of plant and animal cells',
              'Trace levels of organization among organisms',
            ],
            aiPrompt: "Explain characteristics of living organisms. Cover: cell theory, cell organelles, levels of biological organization. Use diagrams to show plant vs animal cells. Discuss importance of cellular organization in multicellular organisms.",
          },
          {
            id: 'A.2',
            title: '2. Evolution and Classification',
            content: [
              'Monera (prokaryotes): bacteria and blue-green algae',
              'Protista: protozoans and protophyta (Amoeba, Euglena, Paramecium)',
              'Fungi: mushroom and Rhizopus',
              'Plantae: Thallophyta, Bryophyta, Pieridophyta, Spermatophyta',
              'Animalia: Invertebrates and Vertebrates',
            ],
            objectives: [
              'Analyze external features and characteristics of listed organisms',
              'Demonstrate increase in structural complexity',
              'Trace stages in life histories of organisms',
              'Demonstrate gradual transition from water to land life',
              'Trace evolution of listed plants and animals',
            ],
            aiPrompt: "Explain biological classification and evolution. Cover: 5 kingdoms with examples. Show evolutionary trends from simple to complex organisms. Discuss adaptations for terrestrial life. Include Nigerian examples of organisms from each kingdom.",
          },
          {
            id: 'A.3',
            title: '3. Structural/Functional and Behavioural Adaptations',
            content: [
              'Adaptive coloration and its functions',
              'Behavioural adaptations in social animals',
              'Structural adaptations in organisms',
              'Obtaining food adaptations',
              'Protection and defence mechanisms',
              'Securing mates adaptations',
              'Regulating body temperature',
              'Conserving water adaptations',
            ],
            objectives: [
              'Describe how structures, functions and behaviour adapt organisms to environment',
              'Categorize countershading and warning coloration',
              'Differentiate castes in social insects and their functions',
              'Account for basking, hibernation, aestivation',
              'Explain adaptations for obtaining food, protection, mating, thermoregulation, water conservation',
            ],
            aiPrompt: "Explain adaptations in organisms. Cover: camouflage, mimicry, behavioral adaptations. Use Nigerian animal examples: chameleon coloration, termite caste system, lizard thermoregulation. Show structural adaptations like bird beaks, insect mouthparts.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'B: FORM AND FUNCTIONS',
        topics: [
          {
            id: 'B.1',
            title: '1. Internal Structure of Plants and Animals',
            content: [
              'Internal structure of flowering plant: root, stem, leaf',
              'Internal structure of mammal',
              'Supporting tissues in plants (collenchyma, sclerenchyma, xylem, phloem)',
              'Mammalian internal organs arrangement',
            ],
            objectives: [
              'Identify transverse sections of plant organs',
              'Relate structure of organs to their functions',
              'Identify supporting tissues in plants',
              'Describe distribution of supporting tissues',
              'Examine arrangement of mammalian internal organs',
              'Describe appearance and position of digestive, reproductive and excretory organs',
            ],
            aiPrompt: "Explain internal structure of plants and animals. Cover: plant tissue organization (dermal, vascular, ground). Mammalian organ systems. Use diagrams of root/stem/leaf cross-sections. Show mammalian digestive system with Nigerian examples.",
          },
          {
            id: 'B.2',
            title: '2. Nutrition',
            content: [
              'Modes of nutrition: autotrophic and heterotrophic',
              'Types of nutrition: holozoic, parasitic, saprophytic, carnivorous plants',
              'Plant nutrition: photosynthesis, chemosynthesis, mineral requirements',
              'Animal nutrition: classes of food substances, food tests, mammalian tooth, alimentary canal, nutrition process',
            ],
            objectives: [
              'Compare autotrophic and heterotrophic nutrition',
              'Differentiate types of heterotrophic feeding',
              'Determine nutritional value of foods',
              'Differentiate light and dark reactions of photosynthesis',
              'Detect presence of starch as evidence of photosynthesis',
              'Identify macro and micro elements',
              'Recognize deficiency symptoms',
              'Describe structure of mammalian tooth',
              'Relate alimentary canal structure to function',
              'Associate enzymes with food digestion',
            ],
            aiPrompt: "Explain nutrition in plants and animals. Cover: photosynthesis process, mineral nutrition. Human digestive system with enzymes. Food tests practical procedures. Nigerian nutritional deficiencies (kwashiorkor, rickets). Balanced diet importance in Nigerian context.",
          },
          {
            id: 'B.3',
            title: '3. Transport',
            content: [
              'Need for transportation in organisms',
              'Materials for transportation',
              'Mammalian circulatory system',
              'Plant vascular system',
              'Media and processes of transportation',
            ],
            objectives: [
              'Determine need for transport system',
              'Determine sources and forms of transported materials',
              'Describe general circulatory system',
              'Compare functions of blood vessels',
              'Identify plant vascular system organs',
              'Understand functions of phloem and xylem',
              'Identify media of transportation',
              'Describe diffusion, osmosis, plasmolysis, turgidity',
            ],
            aiPrompt: "Explain transport systems. Cover: human circulatory system (heart, blood vessels). Plant transport (transpiration, translocation). Osmosis and diffusion experiments. Blood composition and functions. Nigerian context: circulatory diseases, plant water relations in dry season.",
          },
          {
            id: 'B.4',
            title: '4. Respiration',
            content: [
              'Respiratory organs and surfaces',
              'Mechanism of gaseous exchange in plants and animals',
              'Aerobic respiration',
              'Anaerobic respiration',
            ],
            objectives: [
              'Explain significance of respiration',
              'Describe glycolysis and Krebs cycle',
              'Deduce gaseous exchange and energy production',
              'Describe respiratory organs and surfaces',
              'Describe stomata opening/closing mechanism',
              'Determine respiratory mechanisms',
              'Examine role of oxygen in energy liberation',
              'Demonstrate fermentation',
              'State economic importance of yeasts',
            ],
            aiPrompt: "Explain respiration. Cover: aerobic vs anaerobic respiration. Gaseous exchange in humans (lungs) and plants (stomata). ATP production. Fermentation process with Nigerian examples (palm wine production, bread making). Respiratory diseases in Nigeria.",
          },
          {
            id: 'B.5',
            title: '5. Excretion',
            content: [
              'Types of excretory structures',
              'Excretory mechanisms: kidneys, lungs, skin',
              'Excretory products of plants',
            ],
            objectives: [
              'Define excretion and state its significance',
              'Relate structure to function in excretory organs',
              'Relate kidney structure to excretory and osmoregulatory functions',
              'Identify functions and excretory products of lungs and skin',
              'Deduce economic importance of plant excretory products',
            ],
            aiPrompt: "Explain excretion. Cover: human excretory system (kidney structure and function). Plant excretory products. Osmoregulation. Nigerian context: kidney diseases, medicinal plants and their excretory products. Dialysis treatment availability.",
          },
          {
            id: 'B.6',
            title: '6. Support and Movement',
            content: [
              'Tropic, tactic, nastic and sleep movements in plants',
              'Supporting tissues in animals',
              'Types and functions of skeleton',
            ],
            objectives: [
              'Determine need for support and movement',
              'Identify supporting tissues in plants',
              'Describe distribution of supporting tissues',
              'Relate plant responses to stimuli',
              'Identify regions of growth and roles of auxins',
              'Relate location of supporting structures to function',
              'Relate mammalian skeleton to functions',
              'Differentiate types of joints',
              'Apply skeleton functions to animal wellbeing',
            ],
            aiPrompt: "Explain support and movement. Cover: plant movements (tropisms). Human skeletal system. Types of joints. Bone structure and function. Nigerian context: bone diseases (rickets, osteoporosis), traditional bone setting practices.",
          },
          {
            id: 'B.7',
            title: '7. Reproduction',
            content: [
              'Asexual reproduction: fission, budding, vegetative propagation',
              'Sexual reproduction in flowering plants',
              'Reproduction in mammals',
            ],
            objectives: [
              'Differentiate asexual and sexual reproduction',
              'Apply vegetative propagation in agriculture',
              'Relate flower parts to functions',
              'State advantages of cross pollination',
              'Deduce types of placentation',
              'Differentiate male and female reproductive organs',
              'Describe fertilization process',
              'Relate maternal health to embryo development',
              'Explain modern reproductive technologies',
            ],
            aiPrompt: "Explain reproduction. Cover: plant reproduction (flower structure, pollination). Human reproductive system. Fertilization and development. Nigerian context: reproductive health issues, agricultural applications of vegetative propagation, family planning methods.",
          },
          {
            id: 'B.8',
            title: '8. Growth',
            content: [
              'Meaning of growth',
              'Germination of seeds and conditions for germination',
            ],
            objectives: [
              'Apply knowledge of germination conditions',
              'Differentiate epigeal and hypogeal germination',
            ],
            aiPrompt: "Explain growth in organisms. Cover: seed germination process, factors affecting germination. Plant growth patterns. Human growth and development stages. Nigerian context: agricultural seed treatment, child growth monitoring.",
          },
          {
            id: 'B.9',
            title: '9. Co-ordination and Control',
            content: [
              'Nervous coordination: CNS, PNS, reflex action',
              'Sense organs: skin, nose, tongue, eye, ear',
              'Hormonal control: animal and plant hormones',
              'Homeostasis: temperature, water and salt regulation',
            ],
            objectives: [
              'Apply knowledge of CNS in coordination',
              'Illustrate reflex actions',
              'Differentiate reflex and voluntary actions',
              'Relate sense organs to their functions',
              'Apply knowledge of sense organ structure',
              'State location of endocrine glands',
              'Relate hormones to their functions',
              'Examine effects of phytohormones',
              'Relate hormones to homeostasis',
            ],
            aiPrompt: "Explain coordination and control. Cover: nervous system (neurons, synapses). Endocrine system. Homeostasis mechanisms. Nigerian context: common nervous disorders, diabetes management, traditional medicine for hormonal issues.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'C: ECOLOGY',
        topics: [
          {
            id: 'C.1',
            title: '1. Factors Affecting Distribution of Organisms',
            content: [
              'Abiotic factors: temperature, rainfall, humidity, wind, altitude, salinity, pH, soil',
              'Biotic factors: human and animal activities',
            ],
            objectives: [
              'Relate effects of abiotic factors on organism distribution',
              'Use equipment to measure abiotic factors',
              'Describe how human activities affect distribution',
            ],
            aiPrompt: "Explain ecological factors affecting organism distribution. Cover: abiotic and biotic factors. Nigerian ecosystems: rainforest, savanna, mangrove. Human impact on Nigerian biodiversity. Conservation efforts in Nigeria.",
          },
          {
            id: 'C.2',
            title: '2. Symbiotic Interactions and Energy Flow',
            content: [
              'Symbiosis, parasitism, saprophytism, commensalism, mutualism, competition, predation',
              'Food chains, food webs, trophic levels',
              'Nutrient cycles: carbon, water, nitrogen',
            ],
            objectives: [
              'Determine examples of symbiotic interactions',
              'Explain distribution with food chains and webs',
              'Define chains and webs',
              'Describe carbon cycle and global warming',
              'Assess effects of water cycle',
              'Relate roles of bacteria and legumes in nitrogen cycle',
            ],
            aiPrompt: "Explain ecological interactions and energy flow. Cover: symbiotic relationships, food chains/webs. Biogeochemical cycles. Nigerian examples: farmer-herder conflicts (competition), nitrogen-fixing crops in Nigerian agriculture, carbon sequestration in Nigerian forests.",
          },
          {
            id: 'C.3',
            title: '3. Natural Habitats',
            content: [
              'Aquatic habitats: ponds, streams, lakes, seashores, mangrove swamps',
              'Terrestrial/arboreal habitats',
            ],
            objectives: [
              'Associate plants and animals with habitats',
              'Relate adaptive features to habitats',
            ],
            aiPrompt: "Explain Nigerian natural habitats. Cover: freshwater ecosystems, marine ecosystems, terrestrial ecosystems. Adaptations of organisms in each habitat. Nigerian conservation areas: Yankari, Cross River National Park, Chad Basin.",
          },
          {
            id: 'C.4',
            title: '4. Local (Nigerian) Biomes',
            content: [
              'Tropical rainforest',
              'Guinea savanna (southern and northern)',
              'Sudan Savanna',
              'Desert',
              'Highlands and plateaus',
            ],
            objectives: [
              'Locate biomes in regions',
              'Apply knowledge of biome features to determine Nigerian regional characteristics',
            ],
            aiPrompt: "Explain Nigerian biomes. Cover: characteristics, flora, fauna, adaptations. Distribution across Nigeria. Climate change impact on Nigerian biomes. Conservation status of each biome.",
          },
          {
            id: 'C.5',
            title: '5. Ecology of Populations',
            content: [
              'Population density and overcrowding',
              'Competition and succession',
              'Factors affecting population sizes',
              'Ecological succession',
            ],
            objectives: [
              'Determine reasons for rapid human population changes',
              'Compute population density',
              'Relate population increase to competition',
              'Determine niche differentiation',
              'Relate competition to succession',
              'Deduce effects on population size',
              'Determine biotic-abiotic interactions',
              'Trace succession to climax stage',
            ],
            aiPrompt: "Explain population ecology. Cover: population dynamics, carrying capacity, succession. Nigerian context: population growth rate, urbanization effects, agricultural land succession. Human population issues in Nigeria.",
          },
          {
            id: 'C.6',
            title: '6. Soil',
            content: [
              'Characteristics of soil types: sandy, loamy, clayey',
              'Components of soil',
              'Soil fertility and conservation',
            ],
            objectives: [
              'Identify physical properties of soil types',
              'Determine air, water, humus content',
              'Relate soil characteristics to plant growth',
              'Relate factors causing soil fertility loss',
              'Apply soil conservation practices',
            ],
            aiPrompt: "Explain soil science. Cover: soil composition, types, fertility. Nigerian soil types and their distribution. Soil degradation issues in Nigeria. Sustainable agricultural practices for Nigerian farmers.",
          },
          {
            id: 'C.7',
            title: '7. Humans and Environment',
            content: [
              'Common and endemic diseases',
              'Pollution and its control',
              'Conservation of natural resources',
              'Game reserves and national parks',
            ],
            objectives: [
              'Identify conditions favouring disease spread',
              'Relate vector biology to disease spread',
              'Use knowledge for disease prevention',
              'Apply inoculation and vaccination principles',
              'Categorize pollution types',
              'Relate pollutants to health and environment',
              'Determine pollution control methods',
              'Explain sanitation importance',
              'Assess roles of health agencies',
              'Apply conservation methods',
              'Outline benefits of conservation',
              'Identify conservation bodies',
              'Identify location and importance of Nigerian reserves and parks',
            ],
            aiPrompt: "Explain human-environment interactions. Cover: Nigerian diseases (malaria, cholera, HIV/AIDS). Pollution issues in Nigeria (oil pollution, air pollution in cities). Conservation efforts in Nigeria. Role of Nigerian health and environmental agencies.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'D: HEREDITY AND VARIATIONS',
        topics: [
          {
            id: 'D.1',
            title: '1. Variation in Population',
            content: [
              'Morphological variations: size, color, fingerprints',
              'Physiological variations: tongue rolling, PTC tasting, blood groups',
              'Application in crime detection, blood transfusion, paternity',
            ],
            objectives: [
              'Differentiate continuous and discontinuous variations',
              'Relate environmental and genetic factors to variation',
              'Measure heights and weights',
              'Plot frequency distribution graphs',
              'Observe color patterns',
              'Apply fingerprint classification',
              'Identify physiological variations',
              'Categorize people by physiological variation',
              'Apply blood group knowledge',
              'Use discontinuous variation in crime detection',
            ],
            aiPrompt: "Explain genetic variation. Cover: types of variation, genetic basis. Human traits in Nigerian population. Forensic applications. Blood transfusion compatibility in Nigerian medical practice. Paternity testing methods.",
          },
          {
            id: 'D.2',
            title: '2. Heredity',
            content: [
              'Inheritance of characters',
              'Chromosomes as basis of heredity',
              'Probability in genetics and sex determination',
              'Application in agriculture and medicine',
              'Sex-linked characters',
            ],
            objectives: [
              'Determine heritable and non-heritable characters',
              'Illustrate DNA structure',
              'Illustrate gene segregation and recombination',
              'Deduce segregation during gamete formation',
              'Analyze cross-breeding data',
              'Apply heredity principles in crop and livestock improvement',
              'Deduce advantages/disadvantages of breeding methods',
              'Analyze GMO and gene therapy issues',
              'Apply heredity knowledge in marriage counseling',
              'Describe recombinant DNA applications',
              'Identify sex-linked characters',
            ],
            aiPrompt: "Explain genetics and heredity. Cover: Mendelian inheritance, DNA structure, genetic engineering. Nigerian context: genetic diseases (sickle cell anemia), agricultural biotechnology in Nigeria, genetic counseling in Nigerian hospitals.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'E: EVOLUTION',
        topics: [
          {
            id: 'E.1',
            title: '1. Theories of Evolution',
            content: [
              'Lamarck\'s theory',
              'Darwin\'s theory',
              'Organic evolution',
            ],
            objectives: [
              'Relate organic evolution to adaptive changes',
              'Explain contributions of Lamarck and Darwin',
              'State evidences for evolution',
            ],
            aiPrompt: "Explain evolution theories. Cover: Lamarckism, Darwinism, modern synthesis. Evidence for evolution. Nigerian examples: evolutionary adaptations in Nigerian species, fossil records in Nigeria.",
          },
          {
            id: 'E.2',
            title: '2. Evidence of Evolution',
            content: [
              'Fossil records',
              'Comparative anatomy, physiology, embryology',
              'Genetic studies and mutation',
            ],
            objectives: [
              'Mention evidences for evolution',
              'Trace evolutionary trends',
              'State evidence from modern theories',
            ],
            aiPrompt: "Explain evidence for evolution. Cover: fossil evidence, homologous/analogous structures, embryological evidence, molecular evidence. Nigerian context: archaeological sites with fossils, comparative anatomy of Nigerian mammals.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Ndu, F.O. C. Ndu, Abun A. and Aina J.O. (2001) Senior Secondary School Biology: Books 1-3, Lagos: Longman',
          'Odunfa, S.A. (2001) Essential of Biology, Ibadan: Heinemann',
          'Ogunniyi M.B. Adebisi A.A. and Okojie J.A. (2000) Biology for Senior Secondary Schools: Books 1 – 3, Macmillan',
          'Ramalingam, S.T. (2018) Modern Biology, SS Science Series. New Edition, AFP',
          'Stan. (2004) Biology for Senior Secondary Schools. Revised Edition, Ibadan: Heinemann',
          'Stone R.H. and Cozens, A.B.C. (1982) Biology for West African Schools. Longman',
          'Usua, E.J. (1997) Handbook of practical Biology 2nd Edition, University Press, Limited',
          'Idodo – Umeh, G (2015) College Biology. Idodo – Umeh Publishers Ltd.',
          'Micheal, M.C. (2018) Essential Biology for Senior Secondary Schools. TONAD Publishers Ltd.',
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
        AsyncStorage.getItem('biology_ai_explanations'),
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
    const systemPrompt = 'You are an expert Biology tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and practical applications. Use proper biological terminology. Format in markdown.';
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
      await AsyncStorage.setItem('biology_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Biology explanations.',
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
      const prompt = `As a Biology expert, explain "${topic.title}" for UTME/JAMB Biology preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Biology:
1. Start with a clear definition in ## H2 heading
2. Use Nigerian biological examples and local species
3. Explain concepts with biological diagrams where applicable
4. Include practical applications in Nigerian context
5. Highlight key biological principles with **bold**
6. Provide comparative analysis with Nigerian ecosystems
7. Include current biological research relevant to Nigeria
8. Provide practical laboratory procedures
9. Connect theoretical concepts with Nigerian health and environmental issues

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key biological terms
- Use > for important biological principles or facts
- Include Nigerian species examples where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian biological context and practical applications.`;

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
              content: 'You are an expert Biology tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and practical applications. Use proper biological terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('biology_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Biology explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "biotech" : "lock"} 
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
            color="#2980b9" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#2980b9" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#2980b9" style={styles.bulletIcon} />
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
                        color="#3498db" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#2980b9" />
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
                              <Icon name="school" size={16} color="#2980b9" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#3498db" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Biology</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#2980b9" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Biology</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian biological context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#2980b9" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practical Biology</Text>
                <Text style={styles.featureDescription}>Laboratory procedures and practical applications</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#2980b9" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Species Focus</Text>
                <Text style={styles.featureDescription}>Examples from Nigerian flora and fauna</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#2980b9" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Health Applications</Text>
                <Text style={styles.featureDescription}>Connect biology to Nigerian health issues</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Biology</Text>
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
          <Icon name="biotech" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>BIOLOGY</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Biology Focus</Text>
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
            <Icon name="info" size={20} color="#2980b9" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#2980b9" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "biotech" : "lock"} size={16} color={isPremiumActivated ? "#3498db" : "#999"} />
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
              <Icon name="nature" size={16} color="#2980b9" />
              <Text style={styles.tipText}>Includes Nigerian species and practical biology</Text>
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
                <Icon name="biotech" size={20} color="#2980b9" />
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
                  <ActivityIndicator size="large" color="#2980b9" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian biological context...
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
                <Icon name="share" size={20} color="#2980b9" />
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

// Markdown styles for Biology
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
    color: '#154360',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2980b9',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3498db',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#154360',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#E8F4F8',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#AED6F1',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#E8F4F8',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#AED6F1',
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
    color: '#2980b9',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#2980b9',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#2980b9',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#E8F4F8',
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
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
    backgroundColor: '#2980b9',
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
    color: '#2980b9',
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
    backgroundColor: '#E8F4F8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#154360',
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
    backgroundColor: '#F8FBFD',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#AED6F1',
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
    color: '#2980b9',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#154360',
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
    color: '#2980b9',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#2980b9',
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
    color: '#2980b9',
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
    borderColor: '#2980b9',
  },
  saveButton: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2980b9',
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
    backgroundColor: '#2980b9',
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
    backgroundColor: '#E8F4F8',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2980b9',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2980b9',
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
    backgroundColor: '#2980b9',
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
    backgroundColor: "rgba(41, 128, 185, 0.9)",
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

export default BiologySyllabusScreen;