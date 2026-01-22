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

const GovernmentSyllabusScreen = () => {
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
          'Appreciate the meaning of Government',
          'Analyse the framework and specify the institutions of Government',
          'Appreciate the basic principles of democratic governance and their application in Nigeria',
          'Explain the concept of citizenship and define the duties and obligations of a citizen',
          'Appreciate the process of political development in Nigeria',
          'Evaluate the political development and problems of governance in Nigeria',
          'Understand the determinants and dynamics of foreign policy as they relate to Nigeria',
          'Assess the role of Nigeria as a member of the international community and the workings of international organizations',
        ],
      },
      {
        id: 'part1',
        title: 'PART 1: ELEMENTS OF GOVERNMENT',
        topics: [
          {
            id: '1.1',
            title: 'Basic Concepts in Government',
            content: [
              'Power, Authority, Legitimacy, Sovereignty',
              'Society, State, Nation, Nation-State',
              'Political Processes: Political Socialization, Political Participation, Political Culture',
            ],
            objectives: [
              'Identify the fundamental concepts in governance',
              'Analyse various political processes',
            ],
            aiPrompt: "Explain basic concepts in government: Power, Authority, Legitimacy, Sovereignty, Society, State, Nation, Nation-State. Discuss political processes: Political Socialization, Political Participation, Political Culture. Provide Nigerian examples for each concept.",
          },
          {
            id: '1.2',
            title: 'Forms of Government',
            content: [
              'Monarchy, Aristocracy, Oligarchy, Autocracy',
              'Republicanism, Democracy',
              'Definitions, features, merits and demerits',
            ],
            objectives: [
              'Distinguish between different forms of government',
            ],
            aiPrompt: "Explain different forms of government: Monarchy, Aristocracy, Oligarchy, Autocracy, Republicanism, Democracy. Detail features, merits, and demerits of each. Provide historical and contemporary examples. Discuss which forms exist in modern Nigeria.",
          },
          {
            id: '1.3',
            title: 'Arms of Government',
            content: [
              'The Legislature – types, structure, functions, powers',
              'The Executive – types, functions, powers',
              'The Judiciary – functions, powers, components',
              'Their relationships',
            ],
            objectives: [
              'Identify the duties and obligations of the various arms of government and their agencies',
              'Relate each arm to its functions',
              'Appreciate how these arms interrelate',
            ],
            aiPrompt: "Explain the three arms of government: Legislature, Executive, Judiciary. Detail their types, structures, functions, powers, and interrelationships. Provide Nigerian examples: National Assembly, Presidency, Supreme Court. Discuss checks and balances.",
          },
          {
            id: '1.4',
            title: 'Structures of Governance',
            content: [
              'Unitary – features, reasons for adoption, merits and demerits',
              'Federal – features, reasons for adoption, merits and demerits',
              'Confederal - features, reasons for adoption, merits and demerits',
            ],
            objectives: [
              'Compare the various political structures of governance',
            ],
            aiPrompt: "Explain structures of governance: Unitary, Federal, Confederal. Detail features, reasons for adoption, merits, and demerits. Discuss why Nigeria adopted federalism. Compare with other countries like UK (unitary) and USA (federal).",
          },
          {
            id: '1.5',
            title: 'Systems of Governance',
            content: [
              'Presidential, Parliamentary and Monarchical',
            ],
            objectives: [
              'Distinguish between the different systems of governance',
            ],
            aiPrompt: "Explain systems of governance: Presidential, Parliamentary, Monarchical. Detail characteristics of each. Provide examples: USA (presidential), UK (parliamentary monarchy). Discuss Nigeria\'s presidential system under 1999 Constitution.",
          },
          {
            id: '1.6',
            title: 'Political Ideologies',
            content: [
              'Communalism, Feudalism, Capitalism, Socialism, Communism',
              'Totalitarianism, Fascism, Nazism',
            ],
            objectives: [
              'Differentiate between the major political ideologies',
              'Contrast their modes of production',
            ],
            aiPrompt: "Explain political ideologies: Communalism, Feudalism, Capitalism, Socialism, Communism, Totalitarianism, Fascism, Nazism. Detail characteristics, modes of production, and examples. Discuss which ideologies have influenced Nigeria\'s development.",
          },
          {
            id: '1.7',
            title: 'Constitution',
            content: [
              'Meaning, Sources, Functions',
              'Types - Written, Unwritten, Rigid and Flexible',
            ],
            objectives: [
              'Define and identify sources and functions of constitutions',
              'Compare the nature of constitutions',
            ],
            aiPrompt: "Explain constitutional concepts: meaning, sources, functions. Detail types: Written vs Unwritten, Rigid vs Flexible. Discuss Nigeria\'s 1999 Constitution. Compare with UK\'s unwritten constitution and USA\'s rigid constitution.",
          },
          {
            id: '1.8',
            title: 'Principles of Democratic Government',
            content: [
              'Ethics and Accountability in Public Office',
              'Separation of Power, Checks and Balances',
              'Individual and Collective Responsibility',
              'Constitutionalism, Rule of Law, Representative Government',
            ],
            objectives: [
              'Identify the principles of democratic government',
              'Determine the application of these principles',
            ],
            aiPrompt: "Explain principles of democratic government: Ethics, Accountability, Separation of Powers, Checks and Balances, Responsibility, Constitutionalism, Rule of Law, Representative Government. Discuss application in Nigeria\'s democracy with examples.",
          },
          {
            id: '1.9',
            title: 'Processes of Legislation',
            content: [
              'Legislative Enactments – Acts, Edicts, Bye-laws',
              'Delegated Legislation, Decrees',
            ],
            objectives: [
              'Analyse the processes involved in the making of laws',
            ],
            aiPrompt: "Explain legislative processes in Nigeria. Detail how bills become laws. Discuss types: Acts of National Assembly, State Laws, Local Government Bye-laws, Delegated Legislation. Explain military decrees vs democratic legislation.",
          },
          {
            id: '1.10',
            title: 'Citizenship',
            content: [
              'Meaning, types',
              'Citizenship rights',
              'Dual citizenship, renunciation, deprivation',
              'Duties and obligations of citizens',
              'Duties and obligations of the state',
            ],
            objectives: [
              'Differentiate between the various methods of acquiring citizenship',
              'Specify the rights and responsibilities of a citizen',
              'Assess the obligations of the state',
            ],
            aiPrompt: "Explain citizenship concepts: meaning, types (by birth, registration, naturalization). Detail rights and responsibilities of Nigerian citizens. Discuss dual citizenship issues. Explain Chapter II of 1999 Constitution (Fundamental Objectives).",
          },
          {
            id: '1.11',
            title: 'The Electoral Process',
            content: [
              'Suffrage – evolution, types',
              'Election – types, ingredients of free and fair election',
              'Electoral System - types, advantages and disadvantages',
              'Electoral Commission – functions, problems',
            ],
            objectives: [
              'Distinguish the different types of franchise',
              'Identify and explain the types of electoral systems',
              'Analyse the various electoral processes',
            ],
            aiPrompt: "Explain electoral processes: suffrage (universal, restricted), elections (direct, indirect), electoral systems (FPTP, proportional representation). Discuss INEC\'s role in Nigeria. Analyze challenges of Nigerian elections and solutions.",
          },
          {
            id: '1.12',
            title: 'Political Parties and Party Systems',
            content: [
              'Political parties – Definition, organization, functions',
              'Party Systems – Definition, organization, functions',
            ],
            objectives: [
              'Assess the role of political parties',
              'Distinguish between types of party systems',
            ],
            aiPrompt: "Explain political parties and party systems. Detail functions of parties in democracy. Discuss types: one-party, two-party, multi-party systems. Analyze Nigeria\'s multi-party system. Discuss party registration requirements by INEC.",
          },
          {
            id: '1.13',
            title: 'Pressure Groups',
            content: [
              'Definition, types, functions and modes of operation',
              'Differences between Pressure Groups and Political Parties',
            ],
            objectives: [
              'Evaluate the functions and the modus operandi of pressure groups',
              'Distinguish between pressure groups and political parties',
            ],
            aiPrompt: "Explain pressure groups: definition, types (sectional, promotional), functions, modes of operation. Distinguish from political parties. Provide Nigerian examples: NLC, NMA, NBA, ASUU, etc. Discuss their impact on governance.",
          },
          {
            id: '1.14',
            title: 'Public Opinion',
            content: [
              'Meaning, formation and measurement',
              'Functions and limitations',
            ],
            objectives: [
              'Compare methods of assessing public opinion',
              'Assess the functions of public opinion',
              'Analyse the limitations of public opinion',
            ],
            aiPrompt: "Explain public opinion: meaning, formation, measurement methods (polls, surveys, media analysis). Discuss functions in democracy. Analyze limitations and manipulation. Discuss role in Nigerian politics with examples.",
          },
          {
            id: '1.15',
            title: 'The Civil Service',
            content: [
              'Definition, characteristics, functions, structure',
              'Control and problems',
            ],
            objectives: [
              'Analyse the significance of civil service in governance',
            ],
            aiPrompt: "Explain the civil service: definition, characteristics (permanent, politically neutral, hierarchical). Detail structure, functions, and control mechanisms. Discuss problems in Nigerian civil service: corruption, inefficiency, politicization. Suggest reforms.",
          },
        ],
      },
      {
        id: 'part2',
        title: 'PART II: POLITICAL DEVELOPMENT IN NIGERIA',
        topics: [
          {
            id: '2.1',
            title: 'Pre-colonial Politics',
            content: [
              'Pre-jihad Hausa, Emirate, Tiv, Igbo, Yoruba',
              'Their structural organization',
              'The functions of their various political institutions',
            ],
            objectives: [
              'Appreciate the effectiveness of the pre-colonial political systems',
              'Compare pre-colonial systems of governance',
            ],
            aiPrompt: "Explain pre-colonial political systems in Nigeria: Hausa city-states, Emirate system, Tiv chieftaincy, Igbo village democracy, Yoruba monarchy. Detail structures and functions. Discuss effectiveness and relevance to modern governance.",
          },
          {
            id: '2.2',
            title: 'Imperialist Penetration',
            content: [
              'The British process of acquisition – trade, missionary activities, company rule, crown colony, protectorate',
              'The British colonial administrative policy – direct and indirect rule',
              'The French colonial administrative policy – assimilation and association',
              'Impact of British colonial rule-economic, political, socio-cultural',
              'Comparison of British and French colonial administration',
            ],
            objectives: [
              'Trace the processes of imperialist penetration',
              'Assess the impact of British and French policies',
              'Distinguish between British and French colonial practices',
            ],
            aiPrompt: "Explain imperialist penetration in Nigeria. Detail British acquisition processes. Compare direct vs indirect rule. Discuss French assimilation vs association policies. Analyze impacts: economic exploitation, political boundaries, cultural changes. Compare British and French approaches.",
          },
          {
            id: '2.3',
            title: 'Process of Decolonization',
            content: [
              'Nationalism – Meaning, Types',
              'Nationalist Movements – emergence, goals, strategies',
              'Nationalist Leaders – Herbert Macaulay, Nnamdi Azikiwe, Obafemi Awolowo, Ahmadu Bello, Ladipo Solanke, Aminu Kano, J. S. Tarka, Tafawa Balewa',
              'Emergence of nationalist parties',
              'Influence of external factors',
            ],
            objectives: [
              'Evaluate the process of decolonization',
              'Assess the roles of nationalist leaders and parties',
              'Assess the impact of external forces and ideas (Pan-Africanism, Back-to-Africa Movements, Second World War)',
            ],
            aiPrompt: "Explain decolonization process in Nigeria. Detail nationalist movements and leaders. Discuss roles of NCNC, AG, NPC. Analyze external influences: Pan-Africanism, WWII, UN Trusteeship. Evaluate contributions of key nationalist figures.",
          },
          {
            id: '2.4',
            title: 'Constitutional Development in Nigeria',
            content: [
              'Hugh Clifford Constitution (1922)',
              'Arthur Richards Constitution (1946)',
              'John Macpherson Constitution (1951)',
              'Oliver Lyttleton Constitution (1954)',
              'Independence Constitution (1960)',
              'Their features, merits and demerits',
            ],
            objectives: [
              'Compare the various constitutional developments',
            ],
            aiPrompt: "Explain Nigeria\'s constitutional development: Clifford (1922), Richards (1946), Macpherson (1951), Lyttleton (1954), Independence (1960). Detail features, merits, demerits. Analyze evolution towards self-government and federalism.",
          },
          {
            id: '2.5',
            title: 'Post-Independence Constitutions',
            content: [
              '1963, 1979, 1989 and 1999 Constitutions',
              'Characteristics and shortcomings',
            ],
            objectives: [
              'Assess the workings of the various constitutions',
            ],
            aiPrompt: "Explain post-independence constitutions: 1963 (Republican), 1979 (Presidential), 1989 (Aborted), 1999 (Current). Detail characteristics, strengths, weaknesses. Discuss suspended 1993 constitution. Analyze 1999 constitution amendments.",
          },
          {
            id: '2.6',
            title: 'Institutions of Government in Post-Independence Nigeria',
            content: [
              'The Legislative – structures, functions and workings',
              'The Executive – structure, functions and workings',
              'The Judiciary – structure, functions and workings',
            ],
            objectives: [
              'Evaluate the operations of the arms of government and their agencies',
            ],
            aiPrompt: "Explain institutions of government in Nigeria: National/State Assemblies, Presidency/Governorship, Supreme Court/High Courts. Detail structures, functions, workings. Discuss challenges: legislative-executive conflicts, judicial independence issues.",
          },
          {
            id: '2.7',
            title: 'Public Commissions',
            content: [
              'Established by the 1979 and Subsequent Constitutions',
              'Civil Service Commission, Public Complaints Commission',
              'Electoral Commissions, National Boundary Commission',
              'Objectives, functions and problems',
            ],
            objectives: [
              'Evaluate the operations of public commissions',
              'Assess the problems of the Public Commissions and their constraints',
            ],
            aiPrompt: "Explain public commissions in Nigeria: CSC, PCC, INEC, NBC, etc. Detail constitutional basis, objectives, functions. Analyze operational challenges: funding, independence, political interference. Discuss reforms needed.",
          },
          {
            id: '2.8',
            title: 'Political Parties and Party Politics',
            content: [
              'First Republic',
              'Second Republic',
              'Third Republic',
              'Fourth Republic',
              'Evolution, membership spread, structure',
            ],
            objectives: [
              'Contrast political processes in the republics',
              'Evaluate the ideologies, structure and composition of the political parties',
            ],
            aiPrompt: "Explain party politics across Nigeria\'s republics: 1st (NCNC, AG, NPC), 2nd (NPN, UPN, etc), 3rd (aborted), 4th (PDP, APC, etc). Analyze evolution, ideologies, regional bases. Discuss impact on national unity and development.",
          },
          {
            id: '2.9',
            title: 'Structure and Workings of Nigerian Federalism',
            content: [
              'Rationale for a Federal System',
              'Tiers of government and their relationship',
              'Creation of States – 1963, 1967, 1976, 1987, 1991, 1996',
              'Problems of Nigerian Federalism – census, revenue allocation, conflicts',
              'Solutions e.g. the Federal character, etc',
            ],
            objectives: [
              'Examine the workings of Nigerian federalism',
              'Identify its problems',
              'Evaluate the corrective measures to be adopted',
            ],
            aiPrompt: "Explain Nigerian federalism: rationale, structure (federal, state, local). Detail state creation history. Analyze problems: revenue allocation (Derivation Principle), census controversies, inter-governmental conflicts. Discuss solutions: Federal Character Principle, fiscal federalism reforms.",
          },
          {
            id: '2.10',
            title: 'Public Corporations and Parastatals',
            content: [
              'Definition, types, purpose and functions',
              'Finance, control and problems',
              'Deregulation, privatization, and commercialization – objectives, features, merits and demerits',
              'Comparison between public corporations and parastatals',
            ],
            objectives: [
              'Examine the operations of public corporations and parastatals',
              'Identify the processes involved in privatization and commercialization',
              'Assess the economic importance of privatization and commercialization',
            ],
            aiPrompt: "Explain public corporations in Nigeria: NEPA, NITEL, NNPC, etc. Detail types, functions, problems. Analyze privatization/commercialization under OBJ and subsequent governments. Discuss successes and failures. Compare with parastatals.",
          },
          {
            id: '2.11',
            title: 'Local Government',
            content: [
              'Local government administration prior to 1976',
              'Features of local government reforms (1976, 1989) – structure, functions, finance and inter-governmental relations',
              'Traditional rulers and local governments',
              'Problems of local government administration in Nigeria',
            ],
            objectives: [
              'Trace the evolution and structure of local government',
              'Identify the major problems faced by local governments',
            ],
            aiPrompt: "Explain local government in Nigeria: pre-1976 systems, 1976 reforms, 1989 reforms. Detail structure, functions, funding (Federal Allocation). Discuss problems: state government interference, corruption, inefficiency. Analyze role of traditional rulers.",
          },
          {
            id: '2.12',
            title: 'The Military in Nigerian Politics',
            content: [
              'Factors that led to military intervention',
              'Structure of military regimes',
              'Impact of military rule – political, economic',
              'Processes of military disengagement',
            ],
            objectives: [
              'Evaluate the reasons given for military intervention',
              'Assess the achievements of military rule',
              'Determine the conditions that necessitated withdrawal from governance',
            ],
            aiPrompt: "Explain military intervention in Nigeria: coups of 1966, 1975, 1983, 1985, 1993. Detail factors, regime structures (SC, AFRC, PRC). Analyze impacts: state creation, unitary decree, SAP, corruption. Discuss transition programs back to democracy.",
          },
        ],
      },
      {
        id: 'part3',
        title: 'PART III: FOREIGN POLICY AND NIGERIA\'S RELATIONSHIP',
        topics: [
          {
            id: '3.1',
            title: 'Foreign Policy',
            content: [
              'Definition, purpose, determining factors',
              'Formulation and implementation',
            ],
            objectives: [
              'Define foreign policy, identify and explain its determinants',
            ],
            aiPrompt: "Explain foreign policy: definition, purpose, determinants (geography, economy, history, ideology). Discuss formulation and implementation processes. Use Nigeria\'s foreign policy as case study.",
          },
          {
            id: '3.2',
            title: 'Nigeria\'s Foreign Policy',
            content: [
              'Relations with major powers',
              'Relations with developing countries, e.g. the Technical Aid Corps (TAC)',
              'Nigeria\'s Non-Alignment Policy',
            ],
            objectives: [
              'Identify the major objectives of Nigeria\'s foreign policy',
              'Analyse Nigeria\'s non-aligned posture',
            ],
            aiPrompt: "Explain Nigeria\'s foreign policy: relations with US, UK, China, Russia. Discuss Technical Aid Corps (TAC) as soft power. Analyze non-alignment during Cold War and current multi-alignment. Detail key objectives: African leadership, economic diplomacy.",
          },
          {
            id: '3.3',
            title: 'Nigeria\'s Relations with African Countries',
            content: [
              'Africa as the "centre piece" of Nigeria\'s foreign policy – guiding principles, implementation and implications',
              'NEPAD – origin, objectives and implications',
            ],
            objectives: [
              'Evaluate the role of Nigeria in continental affairs',
              'Assess the role of NEPAD in developing Africa',
            ],
            aiPrompt: "Explain Nigeria\'s Africa-centered foreign policy. Detail roles in ECOWAS, OAU/AU, peacekeeping (Liberia, Sierra Leone, Sudan). Discuss NEPAD: origin (OBJ, Mbeki, Bouteflika), objectives, achievements, challenges. Analyze costs and benefits of Nigeria\'s African leadership.",
          },
          {
            id: '3.4',
            title: 'Nigeria in International Organizations',
            content: [
              'The United Nations',
              'The Commonwealth',
              'The Organization of African Unity',
              'The African Union',
              'The Economic Community of West African States (ECOWAS)',
              'The Organization of Petroleum Exporting Countries (OPEC)',
            ],
            objectives: [
              'Analyse the dynamics of Nigeria\'s involvement in international organizations',
              'Assess their contribution to the development of Nigeria',
            ],
            aiPrompt: "Explain Nigeria\'s role in international organizations: UN (Security Council bids, peacekeeping), Commonwealth (suspension and readmission), OAU/AU (founding member), ECOWAS (leadership), OPEC (quota compliance). Analyze benefits and costs to Nigeria.",
          },
        ],
      },
      {
        id: 'part4',
        title: 'PART IV: INTERNATIONAL ORGANIZATIONS',
        topics: [
          {
            id: '4.1',
            title: 'International Organizations',
            content: [
              'ECOWAS, OAU, AU, Commonwealth, OPEC, UNO, African Petroleum Producers Association',
              'Origin, objectives, structure, functions, achievements, problems and prospects',
            ],
            objectives: [
              'Evaluate the operations of these international organizations',
              'Assess the role of these organizations in world affairs',
              'Appreciate the challenges of these organizations and how they can be overcome',
            ],
            aiPrompt: "Explain major international organizations: UN (origin, structure, achievements, problems), Commonwealth (evolution, functions), OAU/AU (transition, challenges), ECOWAS (integration efforts), OPEC (influence, challenges). Discuss reform proposals for each.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Adigwe, F (1985) Essentials of Government for West Africa, Ibadan: University Press Plc.',
          'Anifowose, R and Enemuo, F. C. (eds)(1999) Elements of Politics, Lagos; Malthouse Press Limited.',
          'Appadorai, A. (1978) The Substance of Politics, London: Oxford University Press.',
          'Ball, A. R. (1983) Modern Politics and Government, London: Macmillan.',
          'Ofoegbu, R. (1977) Government for the Certificate Year, London: George Allen and Unwin.',
          'Olawale, J. B (1987) New Topics on Ordinary Level Government, Ilesha: Jola Publishing.',
          'Oyediran, O. Nwosu, H., Takaya, B., Anifowo she, R., Femi, B., Godwill, O. and Adigun, A. (1990) Government for Senior Secondary Schools, Books 1, 2 and 3, Ibadan: Longman.',
          'Oyeneye, I., Onyenwenu, M. and Olusunde, B. E. (2000) Round-Up Government for Senior Secondary School Certificate Examination: A Complete Guide, Ibadan: Longman.',
          'Oyovbaire, S., Ogunna, A. E. C., Amucheazi, E. C., Coker, H. O. and Oshuntuyi, O. (2001) Countdown to Senior Secondary Certificate Examination: Government, Ibadan: Evans.',
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
        AsyncStorage.getItem('government_ai_explanations'),
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
    const systemPrompt = 'You are an expert Government and Political Science tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current context. Use proper political terminology. Format in markdown.';
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
      await AsyncStorage.setItem('government_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with current Nigerian political context.',
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
      const prompt = `As a Government and Political Science expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Government Studies:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian examples and context
3. Explain concepts with reference to Nigerian political system
4. Include historical context where relevant
5. Highlight key learning points with **bold**
6. Provide comparative analysis with other countries where applicable
7. Include current issues and debates
8. Provide practice questions with solutions
9. Connect theoretical concepts with practical governance

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key political terms
- Use > for important quotes or principles
- Include current data and statistics where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian political context and current affairs.`;

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
              content: 'You are an expert Government and Political Science tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current context. Use proper political terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('government_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Government explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "school" : "lock"} 
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
            color="#800000" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#800000" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#800000" style={styles.bulletIcon} />
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
                        color="#990000" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#800000" />
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
                              <Icon name="school" size={16} color="#800000" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#FF6600" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Government Studies</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#800000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Government Explanations</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with current Nigerian political context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#800000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Political Science Concepts</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of government, politics, and governance</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#800000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Political History</Text>
                <Text style={styles.featureDescription}>Detailed analysis of Nigeria\'s political development and institutions</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#800000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Character Credits</Text>
                <Text style={styles.featureDescription}>Access AI explanations with character-based credit system</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Government Studies</Text>
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
          <Icon name="account-balance" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>GOVERNMENT</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Political System & Governance</Text>
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
            <Icon name="info" size={20} color="#800000" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#800000" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "school" : "lock"} size={16} color={isPremiumActivated ? "#FF6600" : "#999"} />
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
              <Icon name="history-edu" size={16} color="#800000" />
              <Text style={styles.tipText}>Includes Nigerian political context and current affairs</Text>
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
                <Icon name="school" size={20} color="#800000" />
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
                  <ActivityIndicator size="large" color="#800000" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian political context...
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
                <Icon name="share" size={20} color="#800000" />
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

// Markdown styles for Government
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
    color: '#600000',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800000',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#990000',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#600000',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#FFF0F0',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#FFF0F0',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCCCC',
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
    color: '#800000',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#800000',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#800000',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 4,
    borderLeftColor: '#800000',
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
    backgroundColor: '#800000',
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
    color: '#800000',
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
    backgroundColor: '#FFF0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#600000',
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
    backgroundColor: '#FFF8F8',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFCCCC',
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
    color: '#800000',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#800000',
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
    color: '#800000',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#800000',
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
    color: '#800000',
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
    borderColor: '#800000',
  },
  saveButton: {
    backgroundColor: '#800000',
    borderColor: '#800000',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#800000',
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
    backgroundColor: '#800000',
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
    backgroundColor: '#FFF0F0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#800000',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#800000',
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
    backgroundColor: '#800000',
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
    backgroundColor: "rgba(128, 0, 0, 0.9)",
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

export default GovernmentSyllabusScreen;