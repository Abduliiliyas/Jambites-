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

const PhysicalHealthEducationSyllabusScreen = () => {
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
          'Acquire basic knowledge and practical skills in motor activities, fitness, body maintenance and self-awareness',
          'Acquire basic knowledge required to practice positive health habits and maintenance of health',
          'Understand relationship between human movement and biological, physical and social sciences',
          'Appreciate ecological relationship between man and his environment with a view to preventing the spread of diseases',
          'Stimulate and sustain interest in Physical and Health Education',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: FOUNDATIONS AND PRINCIPLES',
        topics: [
          {
            id: 'A1',
            title: 'Principles of Physical Education',
            content: [
              'Definition, nature, scope and objectives of PE',
              'Philosophy of Founding Fathers: Hetherington, Dudley Sergent, Thomas Wood, John Dewey',
              'History and Development: Ancient Greece (Sparta, Athens) and Rome',
              'Pre-colonial, colonial and post-colonial eras in Nigeria',
              'Ancient Greek festivals: Isthmian, Pythian, Nemian, Olympian',
            ],
            objectives: [
              'State meaning, nature, objectives and scope of PE',
              'Narrate philosophy of Founding Fathers',
              'Trace historical development in Greece, Rome and Nigeria',
              'Trace origin of ancient Greek festivals',
            ],
            aiPrompt: "Explain the foundations and principles of Physical Education. Define Physical Education, its nature, scope and objectives. Discuss the philosophy of Founding Fathers: Hetherington, Dudley Sergent, Thomas Wood, John Dewey. Trace historical development in ancient Greece (Sparta vs Athens), Rome. Discuss PE in Nigeria: pre-colonial, colonial, post-colonial eras. Explain ancient Greek festivals: Isthmian, Pythian, Nemian, Olympian. Provide Nigerian examples of PE development.",
          },
          {
            id: 'A2',
            title: 'Health Education',
            content: [
              'Meaning, philosophy and objectives of Health Education',
              'Settings: home-based, school-based, community-based, health facility-based, workplace-based',
              'Meaning of Health Promotion',
              'Differentiation between health promotion and health education',
            ],
            objectives: [
              'Define health education',
              'State philosophy and objectives',
              'Differentiate health promotion and health education',
              'Identify various settings',
            ],
            aiPrompt: "Explain Health Education. Define health education, its philosophy and objectives. Differentiate between health promotion and health education. Discuss various settings: home-based, school-based, community-based, health facility-based, workplace-based. Provide Nigerian examples of health education programs in different settings.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: HUMAN ANATOMY AND PHYSIOLOGY',
        topics: [
          {
            id: 'B1',
            title: 'Cells, Tissues and Body Systems',
            content: [
              'Structure and functions of typical human cell',
              'Types of cell and tissue: Epithelial, connective, muscle, nerve',
              'Cell division: mitosis, meiosis',
              'Organs and systems of human body',
              'Cell differentiation',
            ],
            objectives: [
              'Identify cell structures and functions',
              'Identify types of cell, tissue, organ, system',
              'Differentiate mitosis and meiosis',
              'Explain cell differentiation',
              'List organs and systems',
            ],
            aiPrompt: "Explain human anatomy: cells, tissues, systems. Describe structure and functions of typical human cell. Discuss cell types: epithelial, connective, muscle, nerve. Differentiate mitosis vs meiosis. Explain cell differentiation. List and briefly describe major organ systems. Relate to physical education applications.",
          },
          {
            id: 'B2',
            title: 'Skeletal System',
            content: [
              'Axial and appendicular skeletons and functions',
              'Structure and types of bone',
              'Structure and types of joints',
              'Movements at joints',
            ],
            objectives: [
              'Identify human skeleton structure and functions',
              'Identify types of bone',
              'Differentiate joint types with examples',
              'Identify movements permitted at joints',
            ],
            aiPrompt: "Explain skeletal system. Differentiate axial vs appendicular skeletons. Describe bone structure and types. Discuss joint types: fibrous, cartilaginous, synovial with examples. Explain movements: flexion, extension, abduction, adduction, rotation, circumduction. Show relationship to physical activities.",
          },
          {
            id: 'B3',
            title: 'Muscular System',
            content: [
              'Major muscles of body and functions',
              'Isometric and isotonic contractions',
            ],
            objectives: [
              'Identify major muscles by name and location',
              'State functions of major muscles',
              'Differentiate isometric and isotonic contractions',
            ],
            aiPrompt: "Explain muscular system. Identify major muscles: biceps, triceps, quadriceps, hamstrings, pectorals, etc. with locations and functions. Differentiate isometric vs isotonic contractions with exercise examples. Discuss muscle types: skeletal, cardiac, smooth.",
          },
          {
            id: 'B4',
            title: 'Nervous System and Sense Organs',
            content: [
              'Structures and functions of central nervous system',
              'Types of nerve: voluntary, involuntary (reflex action)',
              'Structure and functions of sense organs',
            ],
            objectives: [
              'Identify CNS structures',
              'Explain CNS functions',
              'State types of nerve',
              'Describe reflex action with examples',
              'Describe sense organs structure and functions',
            ],
            aiPrompt: "Explain nervous system and sense organs. Describe brain and spinal cord structures and functions. Differentiate voluntary vs involuntary nerves. Explain reflex arc with examples. Discuss sense organs: skin (touch), nose (smell), tongue (taste), ear (hearing), eye (sight). Relate to sports performance.",
          },
          {
            id: 'B5',
            title: 'Circulatory System',
            content: [
              'Structure and functions of heart and vessels',
              'Composition and functions of blood',
              'Types of blood circulation: systemic and pulmonary',
            ],
            objectives: [
              'Draw and label heart',
              'Compare functions of arteries, veins, capillaries',
              'Identify blood components',
              'State blood functions',
              'Describe systemic and pulmonary circulations',
            ],
            aiPrompt: "Explain circulatory system. Draw and label human heart. Differentiate arteries, veins, capillaries. Describe blood composition: plasma, RBCs, WBCs, platelets. Explain systemic vs pulmonary circulation. Discuss relationship to exercise and fitness.",
          },
          {
            id: 'B6',
            title: 'Respiratory System',
            content: [
              'Structure and functions: nose, trachea, lungs',
              'Process of respiration: inspiration and expiration',
              'Tissue and cellular respiration',
            ],
            objectives: [
              'Describe respiratory organs structure and functions',
              'Explain inspiration and expiration',
              'Explain cellular and tissue respiration',
            ],
            aiPrompt: "Explain respiratory system. Describe nose, trachea, lungs structure and functions. Explain breathing mechanism: inspiration vs expiration. Discuss tissue respiration (internal respiration) vs cellular respiration. Relate to aerobic exercise and endurance.",
          },
          {
            id: 'B7',
            title: 'Excretory System',
            content: [
              'Structure and functions: kidney, skin, lungs',
              'Formation of excretory products: urine, sweat, carbon-dioxide',
            ],
            objectives: [
              'Identify kidney and skin structure',
              'State functions of kidney, skin, lungs',
              'Explain formation of urine, sweat, carbon-dioxide',
            ],
            aiPrompt: "Explain excretory system. Describe kidney structure and urine formation. Discuss skin structure and sweat production. Explain lungs\' role in CO2 excretion. Relate to exercise: sweating, hydration importance.",
          },
          {
            id: 'B8',
            title: 'Somatotypes and Posture',
            content: [
              'Body types: endomorph, mesomorph, ectomorph',
              'Relationship between body types and physical activities',
              'Definition and characteristics of correct posture',
              'Postural defects: flatfoot, scoliosis, kyphosis, lordosis',
              'Causes and corrective measures',
            ],
            objectives: [
              'Describe various body types',
              'Relate body types to physical activities',
              'Define and state characteristics of good posture',
              'Explain types of postural defects',
              'State causes and corrective measures',
            ],
            aiPrompt: "Explain somatotypes and posture. Describe endomorph, mesomorph, ectomorph body types. Which sports suit each type? Define correct posture characteristics. Discuss postural defects: flatfoot, scoliosis, kyphosis, lordosis. Causes: poor habits, accident, heredity, disease. Corrective measures: exercise, nutrition, habits, medical intervention.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: THEORY AND PRACTICE OF SPORTS',
        topics: [
          {
            id: 'C1',
            title: 'Athletics (Track Events)',
            content: [
              'Short distance races: 50m, 100m, 200m, 400m, hurdles, relays',
              'Sprint start styles: bullet/bunch, medium, elongated',
              'Visual and non-visual baton take-over',
              'Hurdle events: flight over hurdles, distancing',
              'Middle distance: 800m, 1500m',
              'Long distance: 3000m, 5000m, 10000m, marathon, cross-country',
              'Rules, regulations and officiating',
            ],
            objectives: [
              'Name sprint events',
              'Identify starting styles',
              'Differentiate baton take-over types',
              'Explain relay take-over zone',
              'Explain hurdle distances and clearance',
              'Describe start, stride, finish in middle/long distance',
              'Name middle/long distance events',
              'Differentiate rules and officiating',
            ],
            aiPrompt: "Explain track athletics. Discuss sprint events: 100m, 200m, 400m. Starting styles: bullet/bunch, medium, elongated. Relay techniques: visual vs non-visual baton exchange, take-over zone. Hurdle events: flight technique, spacing. Middle distance: 800m, 1500m pacing strategies. Long distance: 3000m, 5000m, 10000m, marathon training. Rules and officiating for each event. Nigerian athletes examples.",
          },
          {
            id: 'C2',
            title: 'Athletics (Field Events)',
            content: [
              'Throwing events: discus, javelin, shotput',
              'Facilities, equipment specifications',
              'Styles and techniques',
              'Safety measures',
              'Jumping events: high jump, long jump, pole vault, triple jump',
            ],
            objectives: [
              'Name throwing and jumping events',
              'Identify facilities, equipment, specifications',
              'Explain styles and techniques',
              'Explain rules and regulations',
              'Discuss safety precautions',
            ],
            aiPrompt: "Explain field events. Throwing: discus, javelin, shotput techniques, facilities, safety measures. Jumping: high jump (Fosbury flop, scissors), long jump (hang, hitch-kick), pole vault, triple jump (hop, step, jump). Equipment specifications. Rules and officiating. Safety precautions especially in throwing events.",
          },
          {
            id: 'C3',
            title: 'Ball Games (Football & Basketball)',
            content: [
              'Skills in football and basketball',
              'Facilities and equipment',
              'Rules, regulations and officiating',
            ],
            objectives: [
              'Describe skills in football and basketball',
              'Identify facilities and equipment',
              'Identify officials and functions',
              'Differentiate rules and regulations',
            ],
            aiPrompt: "Explain football and basketball. Football: skills (passing, shooting, dribbling, tackling), positions, formations, rules, officials. Basketball: skills (dribbling, shooting, passing, rebounding), positions, rules, officials. Compare facilities and equipment. Nigerian teams and players examples.",
          },
          {
            id: 'C4',
            title: 'Racket Games (Table Tennis & Badminton)',
            content: [
              'Skills in table tennis and badminton',
              'Facilities and equipment specifications',
              'Rules, regulations and officiating',
            ],
            objectives: [
              'Describe skills in table tennis and badminton',
              'Identify facilities and equipment',
              'Identify officials and functions',
              'Differentiate rules and regulations',
            ],
            aiPrompt: "Explain racket games. Table tennis: skills (forehand, backhand, serve, spin), equipment, rules, scoring. Badminton: skills (serves, clears, drops, smashes), court dimensions, equipment, rules, scoring. Compare both games. Nigerian players achievements.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: FOOD, NUTRITION AND DRUGS',
        topics: [
          {
            id: 'D1',
            title: 'Food and Nutrition',
            content: [
              'Classes, sources and importance of food nutrients',
              'Definition and composition of balanced diet',
              'Diet planning for different groups',
              'Food preservation, hygiene, storage',
            ],
            objectives: [
              'Indicate sources and importance of nutrients',
              'Define balanced diet and importance',
              'Draw up dietary requirements for different groups',
              'Explain food preparation, preservation, storage',
              'Explain food hygiene principles',
            ],
            aiPrompt: "Explain food and nutrition. Food classes: carbohydrates, proteins, fats, vitamins, minerals, water with sources and functions. Balanced diet composition. Diet planning for: children, adolescents, athletes, pregnant women, elderly. Food preservation methods. Food hygiene principles. Nigerian food examples.",
          },
          {
            id: 'D2',
            title: 'Nutritional Aspects',
            content: [
              'Definition and nutritional values of beverages',
              'Common nutritional deficiencies and remedies',
              'Importance of water in human nutrition',
            ],
            objectives: [
              'Define nutrition and state beverage values',
              'State common deficiencies and remedies',
              'Highlight importance of water',
            ],
            aiPrompt: "Explain nutrition. Nutritional values of beverages: milk, fruit juices, tea, coffee. Common deficiencies in Nigeria: protein-energy malnutrition, iron-deficiency anemia, vitamin A deficiency, iodine deficiency disorders. Remedies. Importance of water: hydration, digestion, temperature regulation. Daily water requirements.",
          },
          {
            id: 'D3',
            title: 'Drugs',
            content: [
              'Meaning and types: stimulants, narcotics, hallucinogens, sedatives, ergogenic aids',
              'Use, misuse and abuse',
              'Causes and prevention of drug misuse',
              'Effects on body',
            ],
            objectives: [
              'Define drug and state types',
              'Differentiate misuse and abuse',
              'State causes and prevention',
              'Explain effects on body',
            ],
            aiPrompt: "Explain drugs in sports and health. Types: stimulants (caffeine, amphetamines), narcotics (opioids), hallucinogens (LSD), sedatives (barbiturates), ergogenic aids (anabolic steroids). Differentiate use, misuse, abuse. Causes of drug abuse. Prevention strategies. Effects on health and sports performance. Nigerian context of drug abuse.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'SECTION E: PHYSICAL FITNESS AND CONDITIONING',
        topics: [
          {
            id: 'E1',
            title: 'Physical Fitness',
            content: [
              'Definition of physical fitness',
              'Components: health-related and performance/skill-related',
              'Benefits of physical activity and exercise',
            ],
            objectives: [
              'Define physical fitness',
              'Outline and explain components',
              'Give examples of components',
              'State benefits of physical activity',
            ],
            aiPrompt: "Explain physical fitness. Define physical fitness. Health-related components: cardiovascular endurance, muscular strength, muscular endurance, flexibility, body composition. Performance components: agility, balance, coordination, power, reaction time, speed. Benefits: physical, mental, social. Exercise recommendations.",
          },
          {
            id: 'E2',
            title: 'Conditioning Programmes',
            content: [
              'Aerobic programme',
              'Anaerobic programme',
              'Strength training programme',
              'Endurance training programme',
            ],
            objectives: [
              'Differentiate aerobic and anaerobic programmes',
              'Differentiate strength and endurance training',
            ],
            aiPrompt: "Explain conditioning programmes. Aerobic training: continuous, interval, fartlek with examples. Anaerobic training: sprint intervals, plyometrics. Strength training: isotonic, isometric, isokinetic. Endurance training: methods and principles. Sample programmes for beginners.",
          },
        ],
      },
      {
        id: 'sectionF',
        title: 'SECTION F: RECREATION, LEISURE AND DANCE',
        topics: [
          {
            id: 'F1',
            title: 'Recreation and Leisure',
            content: [
              'Definition and importance: recreation, leisure, work, rest',
              'Types: outdoor and indoor activities',
              'Differences between recreational and competitive sports',
            ],
            objectives: [
              'Differentiate recreation, leisure, work, rest',
              'State importance',
              'Mention types with examples',
              'Differentiate recreational and competitive sports',
              'State safety measures',
            ],
            aiPrompt: "Explain recreation and leisure. Define and differentiate: recreation, leisure, work, rest. Importance of each. Outdoor activities: jogging, swimming, cycling, hiking, camping. Indoor activities: TV, games, music, billiards, traditional games (Ayo, draught). Differences from competitive sports. Safety measures in recreation. Nigerian traditional games.",
          },
          {
            id: 'F2',
            title: 'Dance',
            content: [
              'Definition and importance of dance',
              'Traditional dances and steps from Nigeria',
              'Costumes for traditional dances',
            ],
            objectives: [
              'Define dance and state importance',
              'Identify traditional dances from Nigeria',
              'Describe dance steps',
              'Identify costumes',
            ],
            aiPrompt: "Explain dance in Nigerian culture. Importance of dance. Traditional dances: Bata (Yoruba), Atilogwu (Igbo), Swange (Tiv), Koroso (Hausa), Ekombi (Efik), etc. Describe dance steps. Traditional costumes and significance. Role in cultural preservation.",
          },
        ],
      },
      {
        id: 'sectionG',
        title: 'SECTION G: FIRST AID AND SAFETY EDUCATION',
        topics: [
          {
            id: 'G1',
            title: 'First Aid',
            content: [
              'Definition of first aid',
              'Aims and principles',
              'Qualities of first aider',
              'First aid box contents',
              'Common injuries and conditions',
              'Agencies involved',
            ],
            objectives: [
              'Define first aid',
              'State aims and principles',
              'Outline qualities of first aider',
              'List first aid box contents and uses',
              'Identify common injuries and conditions',
              'Identify agencies',
            ],
            aiPrompt: "Explain first aid. Definition, aims (preserve life, prevent worsening, promote recovery), principles. Qualities of good first aider. First aid box contents: bandages, antiseptics, scissors, etc. Common injuries: cuts, wounds, sprains, strains, dislocations, fractures. Conditions: bleeding, burns, shock, poisoning. Agencies: St. John Ambulance, Red Cross. DRABC procedure.",
          },
          {
            id: 'G2',
            title: 'Safety Education',
            content: [
              'Meaning and types of accident and disaster',
              'Causes and prevention',
              'Disaster relief activities',
              'Safety at home, workplace, school, community',
            ],
            objectives: [
              'Define accident and disaster',
              'Identify types',
              'State causes and prevention',
              'Identify disaster relief activities',
              'Explain safety measures in various settings',
            ],
            aiPrompt: "Explain safety education. Define accident vs disaster. Types: natural disasters (floods, earthquakes), man-made (fires, accidents). Causes and prevention strategies. Disaster relief: emergency services, NGOs. Safety measures: home (fire safety, electrical), workplace (ergonomics, PPE), school (playground safety), community (road safety). Nigerian disaster examples and responses.",
          },
        ],
      },
      {
        id: 'sectionH',
        title: 'SECTION H: NATIONAL AND INTERNATIONAL SPORTS',
        topics: [
          {
            id: 'H1',
            title: 'National Sports Competitions',
            content: [
              'Types: Federations/Associations, Corporate organizations',
              'Importance of National Sports Festival',
              'Organization and administration',
            ],
            objectives: [
              'Identify competitions by name',
              'State importance of National Sports Festival',
              'Highlight organizational structures',
            ],
            aiPrompt: "Explain Nigerian sports competitions. Sports Federations/Associations competitions. Corporate competitions: Nestlé Milo Basketball, Shell Cup, etc. National Sports Festival: history, importance, organization. Administrative structures in Nigerian sports.",
          },
          {
            id: 'H2',
            title: 'Institutional Games',
            content: [
              'University Games (NUGA)',
              'Polytechnic Games (NIPOGA)',
              'Colleges of Education Games (NATCEGA)',
              'National School Sports (NSSF)',
            ],
            objectives: [
              'State names and roles of institutional games',
            ],
            aiPrompt: "Explain institutional games in Nigeria. NUGA: history, objectives, impact. NIPOGA: for polytechnics. NATCEGA: for colleges of education. NSSF: for secondary schools. Roles in talent development.",
          },
          {
            id: 'H3',
            title: 'International Competitions',
            content: [
              'All Africa Games: history, evolution, aims',
              'International governing bodies',
            ],
            objectives: [
              'Narrate history of All Africa Games',
              'Identify aims',
              'Identify international governing bodies',
              'Describe administrative structures',
            ],
            aiPrompt: "Explain international sports. All Africa Games: history since 1965, evolution, aims, Nigerian participation. International bodies: IOC (Olympics), FIFA (football), IAAF (athletics), FIBA (basketball), ITTF (table tennis), BWF (badminton). Their administrative structures and roles.",
          },
        ],
      },
      {
        id: 'sectionI',
        title: 'SECTION I: CORRECTIVE AND ADAPTED PHYSICAL EDUCATION',
        topics: [
          {
            id: 'I1',
            title: 'Disability and Special Needs',
            content: [
              'Meaning and types of disability',
              'Adapted physical activities',
              'Social and emotional problems',
              'Prevention of disability',
              'Corrective exercises',
            ],
            objectives: [
              'Define disability and describe special needs',
              'Identify types',
              'Identify physical activities for disabilities',
              'State social and emotional problems',
              'State preventive measures',
              'State corrective exercises',
            ],
            aiPrompt: "Explain adapted physical education. Define disability and special needs. Types: physical, sensory, intellectual, developmental. Adapted activities for each. Social/emotional challenges. Prevention: immunization, safety, prenatal care. Corrective exercises: stretching, strengthening, balance. Inclusive education in Nigeria.",
          },
        ],
      },
      {
        id: 'sectionJ',
        title: 'SECTION J: PERSONAL, COMMUNITY AND ENVIRONMENTAL HEALTH',
        topics: [
          {
            id: 'J1',
            title: 'Personal Health',
            content: [
              'Meaning and importance of personal health',
              'Personal hygiene: care of body parts',
              'Promotion and maintenance',
              'Health screening: eye, ear, dental',
            ],
            objectives: [
              'Define personal health and importance',
              'Differentiate care of body parts',
              'State promotion methods',
              'State screening outcomes',
            ],
            aiPrompt: "Explain personal health. Importance of personal health. Personal hygiene: teeth, mouth, hair, skin, hands, nails care. Promotion: exercise, nutrition, medical check-ups. Health screening: eye defects (myopia, hypermetropia, astigmatism), ear defects (otitis media, deafness), dental diseases (caries, gingivitis). Correction methods.",
          },
          {
            id: 'J2',
            title: 'Community Health',
            content: [
              'Community health services: orthodox and traditional',
              'Family health: maternal and child health',
              'Aging and death education',
            ],
            objectives: [
              'Differentiate orthodox and traditional services',
              'Differentiate maternal and child health services',
              'Identify elderly characteristics and relating ways',
              'Identify common causes of death',
            ],
            aiPrompt: "Explain community health. Health services: orthodox (hospitals, clinics) vs traditional (bone setters, birth attendants). Maternal and child health: antenatal care, immunization, breastfeeding, safe motherhood. Aging: characteristics, relating respectfully. Common causes of death in Nigeria.",
          },
          {
            id: 'J3',
            title: 'Environmental Health',
            content: [
              'Housing: characteristics, town planning',
              'Water supply: importance, sources, purification',
              'Waste disposal: types, methods',
              'Pollution: meaning, types, prevention',
              'Pest and vector control',
            ],
            objectives: [
              'State characteristics of good housing',
              'State town planning regulations',
              'State importance and sources of water',
              'Explain water purification methods',
              'Differentiate refuse and sewage disposal',
              'Define pollution and types',
              'Outline prevention and control measures',
              'Differentiate pest and vector',
              'Explain harmful effects and control',
            ],
            aiPrompt: "Explain environmental health. Good housing: location, ventilation, lighting, sanitation. Town planning regulations. Water: importance, sources (surface, ground), purification (boiling, filtration, chlorination). Waste disposal: refuse (landfill, incineration), sewage (septic tanks, treatment plants). Pollution: air, water, soil, noise - causes, effects, prevention. Pest vs vector control: mosquitoes, flies, rodents. Nigerian environmental challenges.",
          },
        ],
      },
      {
        id: 'sectionK',
        title: 'SECTION K: COMMUNICABLE AND NON-COMMUNICABLE DISEASES',
        topics: [
          {
            id: 'K1',
            title: 'Diseases',
            content: [
              'Meaning and causes of disease',
              'Communicable diseases: definition, classification',
              'Non-communicable diseases: definition, examples',
            ],
            objectives: [
              'Define disease and state causes',
              'Define communicable disease and classify',
              'Highlight prevention and control measures',
              'Define non-communicable diseases',
              'Highlight prevention and control',
            ],
            aiPrompt: "Explain diseases. Define disease and causes (pathogens, lifestyle, environment). Communicable diseases classification: airborne (measles, TB, meningitis), water/food-borne (cholera, typhoid), insect-borne (malaria, yellow fever), worm infections, animal-borne (rabies), contact diseases (STIs, AIDS, leprosy). Prevention: immunization, sanitation, vector control. Non-communicable: hypertension, sickle cell, cancer, epilepsy, ulcer, asthma, diabetes. Prevention: healthy lifestyle, screening. Nigerian disease patterns.",
          },
        ],
      },
      {
        id: 'sectionL',
        title: 'SECTION L: FAMILY LIFE AND HUMAN SEXUALITY',
        topics: [
          {
            id: 'L1',
            title: 'Family and Sexuality',
            content: [
              'Definition and types of family',
              'Characteristics of happy family',
              'Human sexuality education: meaning, importance',
              'Reproductive health rights',
              'Family planning: definition, importance, methods',
              'Challenges in Nigeria',
              'Promoting agencies',
            ],
            objectives: [
              'Define family and explain types',
              'State characteristics of happy family',
              'Explain human sexuality and importance',
              'Highlight reproductive rights',
              'Define family planning and importance',
              'Identify methods and advantages',
              'State challenges facing family life',
              'Identify promoting agencies',
            ],
            aiPrompt: "Explain family life and sexuality. Family types: nuclear (monogamous, polygamous, single parent, adoption), extended. Happy family characteristics. Human sexuality: meaning, importance in education. Reproductive rights: number of children, consent, gender equality, privacy. Family planning: methods (condom, pills, IUD, abstinence), advantages/disadvantages. Challenges: pre-marital sex, extra-marital affairs, widowhood issues. Promoting agencies: schools, NGOs, religious organizations. Nigerian cultural perspectives.",
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
        AsyncStorage.getItem('phe_ai_explanations'),
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
    const systemPrompt = 'You are an expert Physical and Health Education tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown.';
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
      await AsyncStorage.setItem('phe_ai_explanations', JSON.stringify(updated));
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
      const prompt = `As a Physical and Health Education tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 practical examples with step-by-step explanations
4. Include relevant diagrams or descriptions
5. Give practical applications with Nigerian context
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice questions at the end with ✅ solutions
8. Use Nigerian examples, athletes, diseases, and cultural references

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- Tables for comparisons where helpful
- Clear section separation
- Practical exercise recommendations

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
              content: 'You are an expert Physical and Health Education tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use practical examples, sports techniques, health guidelines, and format your response in markdown with proper headings and bullet points.'
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
              await AsyncStorage.removeItem('phe_ai_explanations');
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
    <Icon name="fitness-center" size={32} color="white" style={styles.headerIcon} />
    <View>
      <Text style={styles.headerTitle}>PHYSICAL & HEALTH EDUCATION</Text>
      <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
    </View>
  </View>
  <View style={styles.headerRight}>
    {isPremiumActivated && aiLimit > 0 ? (
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
          <Icon name="sports" size={16} color="#9c27b0" />
          <Text style={styles.tipText}>Covers sports, health, anatomy, fitness, nutrition</Text>
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
                    Generating AI explanation with practical examples...
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

// Reuse the exact same styles from previous screens
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
header: {
  backgroundColor: '#3f51b5',
  padding: 20,
  paddingTop: 40,
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
  flex: 1, // Take available space
},
headerRight: {
  alignItems: 'flex-end',
  justifyContent: 'center',
  minWidth: 80, // Ensure minimum width for alignment
},
headerRightStack: {
  alignItems: 'flex-end',
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
aiLimitContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
  marginBottom: 4,
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
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 20,
  minHeight: 30,
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
    marginLeft: 50,
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

export default PhysicalHealthEducationSyllabusScreen;