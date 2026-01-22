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

const HistorySyllabusScreen = () => {
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
          'Impart knowledge of Nigerian history from earliest times to the present',
          'Identify the similarities and relationships among the peoples of Nigeria as they relate to the issues of national unity and integration',
          'Appreciate Nigerian history as the basis to understand West African and African history',
          'Apply history to understand Nigerian and Africa\'s relationship with the wider world',
          'Analyse issues of modernization and development',
          'Relate the past to the present and plan for the future',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: THE NIGERIA AREA UP TO 1800',
        topics: [
          {
            id: 'A.1',
            title: '1. Land and Peoples of the Nigeria Area',
            content: [
              'Geographical zones and the people',
              'The people\'s relationship with the environment',
              'Relations and integration among the peoples of different zones',
            ],
            objectives: [
              'Identify the geographical zones and the people within them',
              'Establish the relationship between the people and the environment',
              'Comprehend the relationships among the various peoples of the Nigeria area',
            ],
            aiPrompt: "Explain the geographical zones of Nigeria and their peoples. Discuss the relationship between people and environment in pre-colonial Nigeria. How did different ethnic groups interact and integrate? Provide specific examples from major ethnic groups.",
          },
          {
            id: 'A.2',
            title: '2. Early Centres of Civilization',
            content: [
              'Nok, Daima, Ife, Benin, Igbo Ukwu and Iwo Eleru',
              'Monuments and shelter systems: Kuyambana, Durbi-ta-Kusheyi, city walls and palaces',
            ],
            objectives: [
              'Examine the significance of various centres',
              'Establish the historical significance of the various monuments such as caves and rocky formations',
            ],
            aiPrompt: "Explain early Nigerian civilizations: Nok, Ife, Benin, Igbo Ukwu. Discuss archaeological significance. What do monuments like city walls and palaces reveal about these societies? Compare and contrast these early centers.",
          },
          {
            id: 'A.3',
            title: '3. Origin and Formation of States in the Nigeria Area',
            content: [
              'Central Sudan – Kanuri and Hausa states',
              'Niger-Benue Valley – Nupe, Jukun, Igala, Idoma, Tiv and Ebira',
              'Eastern Forest Belt – Igbo and Ibibio',
              'Western Forest Belt – Yoruba and Edo',
              'Coastal and Niger-Delta - Effk, Ijo, Itsekiri and Urhobo',
              'Factors influencing their origin and migration',
              'Social and political organizations',
              'Inter-State relations, religion, war and peace',
            ],
            objectives: [
              'Relate the different groups of people occupying the various zones to their traditions of origin',
              'Determine the inter-state relations',
              'Account for their social and political organizations',
            ],
            aiPrompt: "Explain state formation in different Nigerian regions. Discuss Hausa states, Yoruba kingdoms, Benin Empire, Igbo village systems, Niger Delta city-states. What factors influenced their development? Compare their political systems.",
          },
          {
            id: 'A.4',
            title: '4. Economic Activities and Growth of States',
            content: [
              'Agriculture – hunting, farming, fishing, animal husbandry and horticulture',
              'Industries – pottery, salt-making, iron-smelting, blacksmithing, leather-working, wood-carving, cloth-making, dyeing and food processing',
              'Trade and trade routes: local, regional, long distance, including trans-Saharan trade',
              'Expansion of states',
            ],
            objectives: [
              'Identify the various economic activities of the people',
              'Differentiate the economic activities and specialties of the people',
              'Relate trade and other economic activities to the growth of the states',
            ],
            aiPrompt: "Explain pre-colonial Nigerian economies. Discuss agricultural practices, craft industries, and trade networks. How did trans-Saharan trade affect Nigerian states? Connect economic activities to political expansion.",
          },
          {
            id: 'A.5',
            title: '5. External Influences',
            content: [
              'North Africans/Arabs: introduction, spread and impact of Islam; trans-Saharan trade',
              'Europeans: early European trade with the coastal states; the trans-Atlantic slave trade (origin, organization and impact)',
            ],
            objectives: [
              'Assess the impact of the contact with North Africa on the people and states South of the Sahara',
              'Examine the impact of early European contact with the coastal people',
              'Trace the origin, organization and impact of the trans-Atlantic slave trade',
            ],
            aiPrompt: "Explain external influences on pre-1800 Nigeria. Discuss: 1) Arab/North African influence through Islam and trans-Saharan trade. 2) European contact and the trans-Atlantic slave trade. Compare these influences and their impacts.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: THE NIGERIA AREA 1800 – 1900',
        topics: [
          {
            id: 'B.1',
            title: '1. The Sokoto Caliphate',
            content: [
              'The Sokoto Jihad – causes, courses and consequence',
              'The causes and the process of the jihad',
              'The establishment and administration of the caliphate and relations with neighbours',
              'The achievements and impact of the caliphate',
              'The collapse of the caliphate',
            ],
            objectives: [
              'Examine the causes, and the processes of the Jihad',
              'Determine the factors that led to the rise of the caliphate',
              'Examine the administrative set-up of the caliphate and its relations with its neighbours',
              'Examine the impact of the caliphate',
              'Trace the internal and external factors that led to the collapse of the caliphate',
            ],
            aiPrompt: "Explain the Sokoto Caliphate comprehensively. Discuss: Causes of the jihad, leaders (Usman dan Fodio), administration, impact on Northern Nigeria, reasons for collapse. Compare with other Islamic reform movements in West Africa.",
          },
          {
            id: 'B.2',
            title: '2. Kanem-Borno',
            content: [
              'The collapse of the Saifawa dynasty',
              'Borno under the Shehus',
              'Borno under Rabeh',
            ],
            objectives: [
              'Determine the factors that led to the collapse of the Saifawa dynasty',
              'Examine Borno under the administration of the Shehus',
              'Assess the role of Rabeh in Borno\'s history',
            ],
            aiPrompt: "Explain Kanem-Borno in the 19th century. Discuss: Decline of Saifawa dynasty, Shehu administration, Rabeh\'s conquest and rule. How did Borno relate to the Sokoto Caliphate?",
          },
          {
            id: 'B.3',
            title: '3. Yorubaland',
            content: [
              'The fall of the Old Oyo Empire',
              'The Yoruba wars and their impact',
              'The peace treaty of 1886 and its aftermath',
            ],
            objectives: [
              'Examine the causes of the fall of the Old Oyo',
              'Examine the causes and effects of the Yoruba wars',
              'Assess the impact of the 1886 peace treaty',
            ],
            aiPrompt: "Explain 19th century Yorubaland. Discuss: Collapse of Old Oyo Empire, causes and consequences of Yoruba wars (Kiriji, etc.), 1886 peace treaty. How did these events shape modern Yorubaland?",
          },
          {
            id: 'B.4',
            title: '4. Benin',
            content: [
              'Internal political development',
              'Relations with neighbours',
              'Relations with the Europeans',
            ],
            objectives: [
              'Examine the internal political development',
              'Examine her relations with her neighbours',
              'Assess her relationship with the Europeans',
            ],
            aiPrompt: "Explain Benin Kingdom in the 19th century. Discuss internal politics, relations with neighboring states, and European interactions leading up to the 1897 British expedition.",
          },
          {
            id: 'B.5',
            title: '5. European Penetration and Impact',
            content: [
              'European exploration of the interior',
              'The suppression of the trans-Atlantic slave trade',
              'The development of commodity trade and rise of consular authority',
              'Christian missionary activities',
              'The activities of the trading companies',
              'Impact of European activities on the coast and the hinterland',
            ],
            objectives: [
              'Examine the motive for the exploration of the interior',
              'Give reasons for the suppression of the trans-Atlantic slave trade',
              'Trace the development of commodity trade',
              'Examine missionary and European activities in the area',
              'Assess the activities of the European trading companies',
              'Account for the rise of consular authority',
            ],
            aiPrompt: "Explain European penetration into Nigeria (1800-1900). Discuss: Explorers (Mungo Park, Lander brothers), end of slave trade, rise of 'legitimate' trade (palm oil, etc.), missionary activities, trading companies (Royal Niger Company), establishment of consular authority.",
          },
          {
            id: 'B.6',
            title: '6. British Conquest of the Nigeria Area',
            content: [
              'Motives for the conquest',
              'Methods of the conquest and its result',
              'Resistance to and aftermath of the conquest',
            ],
            objectives: [
              'Determine the reasons for the conquest and the methods used',
              'Examine the various resistance to the conquest',
              'Evaluate the results and the aftermath of the conquest',
            ],
            aiPrompt: "Explain British conquest of Nigeria. Discuss: Motives (economic, strategic), methods (treaties, force), major resistance movements (Benin, Sokoto, Aro, etc.), consequences of colonization.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: NIGERIA 1900 – 1960',
        topics: [
          {
            id: 'C.1',
            title: '1. The Establishment of Colonial Rule up to 1914',
            content: [
              'Administration of the protectorates',
            ],
            objectives: [
              'Examine the administrative set-up of the protectorates',
            ],
            aiPrompt: "Explain early colonial administration in Nigeria. Discuss: Protectorates of Northern and Southern Nigeria, administrative structures, challenges of establishing colonial rule.",
          },
          {
            id: 'C.2',
            title: '2. The Amalgamation of 1914',
            content: [
              'Reasons',
              'Effects',
            ],
            objectives: [
              'Examine the reasons for the 1914 Amalgamation and its effects',
            ],
            aiPrompt: "Explain the 1914 Amalgamation of Nigeria. Discuss: Reasons (administrative efficiency, economic factors), role of Lord Lugard, immediate and long-term effects on Nigerian unity and development.",
          },
          {
            id: 'C.3',
            title: '3. Colonial Administration After the Amalgamation',
            content: [
              'Central Administration: Legislative and Executive Councils',
              'Indirect Rule – reasons, working and effects',
              'Local administrative institutions, Native Authorities, Native Courts and Native Treasuries',
              'Resistance to colonial rule – Ekumeku Movement, Satiru uprising, Egba Anti-tax Agitation, Aba Women Movement',
            ],
            objectives: [
              'Relate the composition of the central administrative set-up to its consequences',
              'Identify the reasons for the introduction and workings of the indirect rule system',
              'Assess the effects of indirect rule',
              'Examine the local administrative units',
              'Account for the anti-colonial movements and their significance',
            ],
            aiPrompt: "Explain colonial administration in Nigeria (1914-1960). Discuss: Central government structures, indirect rule system (theory vs practice), local administration, major anti-colonial resistance movements with specific examples.",
          },
          {
            id: 'C.4',
            title: '4. The Colonial Economy',
            content: [
              'Currency, taxation and forced labour',
              'Infrastructure (transportation, post and telecommunication)',
              'Agriculture',
              'Mining',
              'Industry',
              'Commerce',
              'Banking',
            ],
            objectives: [
              'Examine the nature of the economy as it affects taxation, currency, infrastructures, agriculture, mining, industry, commerce and banking',
            ],
            aiPrompt: "Explain the colonial economy of Nigeria. Discuss: Economic policies, taxation systems, infrastructure development (railways, ports), cash crop agriculture, mining (tin, coal), limited industrialization, commercial systems, banking development.",
          },
          {
            id: 'C.5',
            title: '5. Social Development under Colonial Rule',
            content: [
              'Western education',
              'Urbanization/social integration',
              'Improvement unions',
              'Health institutions',
            ],
            objectives: [
              'Identify the areas of social development under colonial rule',
              'Examine the impact of urbanization on the people',
              'Examine the level of social integration among the people',
            ],
            aiPrompt: "Explain social changes in colonial Nigeria. Discuss: Spread of Western education, growth of cities (Lagos, Ibadan, etc.), social integration challenges, role of improvement unions, development of health services.",
          },
          {
            id: 'C.6',
            title: '6. Nationalism, Constitutional Developments and Independence',
            content: [
              'The rise of nationalist movements',
              'The 1922 Clifford Constitution and the rise of Nigeria\'s first political party',
              'World War II and the agitation for independence',
              'The Richards Constitution of 1946',
              'The Macpherson Constitution of 1951',
              'Party politics – regionalism, federalism and minorities agitations',
              'Lyttleton Constitution of 1954',
              'Constitutional conferences in Lagos in 1957 and London in 1958',
              'The general elections of 1959 and independence in 1960',
            ],
            objectives: [
              'Trace the emergence of the nationalist movement',
              'Assess the roles of the different constitutions in constitutional development',
              'Examine the effect of World War II in the agitation for independence and the constitutional developments',
              'Trace the development of party politics and its impact on regionalism and minority question',
              'Examine the impact of the constitutional conferences',
              'Determine the factors that aided the attainment of independence',
            ],
            aiPrompt: "Explain Nigeria's road to independence. Discuss: Early nationalism, impact of WWII, constitutional developments (Clifford, Richards, Macpherson, Lyttleton), political parties (NCNC, NPC, AG), regionalism, minority issues, independence negotiations, 1959 elections.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: NIGERIA SINCE INDEPENDENCE',
        topics: [
          {
            id: 'D.1',
            title: '1. The Politics of the First Republic and Military Intervention',
            content: [
              'Struggle for the control of the centre',
              'Issue of revenue allocation',
              'Minority question',
              'The 1962/63 census controversies',
              'The Action Group crisis and the General Elections of 1964/65',
              'The coup d\'etat of January 1966 and the Ironsi Regime',
            ],
            objectives: [
              'Give reasons behind the struggle for the control of the centre',
              'Account for the controversies in revenue allocation',
              'Account for the controversies generated by the minority question and the creation of states',
              'Account for the controversies generated by the 1962/63 census',
              'Examine the problems created by the Action Group crisis and the General Elections of 1964/65',
              'Assess the significance of military intervention and the Ironsi Regime',
            ],
            aiPrompt: "Explain Nigeria's First Republic (1960-1966). Discuss: Political crises, revenue allocation disputes, minority agitations, census controversies, Action Group crisis, 1964/65 elections, January 1966 coup, Ironsi's regime and Unification Decree.",
          },
          {
            id: 'D.2',
            title: '2. The Civil War',
            content: [
              'Causes',
              'Course',
              'Effects',
            ],
            objectives: [
              'Examine the remote and immediate causes of the war',
              'Examine the course',
              'Assess the effects of the war',
            ],
            aiPrompt: "Explain the Nigerian Civil War (1967-1970). Discuss: Remote causes (colonial legacy, regionalism), immediate causes (1966 coups, massacres, secession), major events, role of international community, effects (human cost, national unity, reconstruction).",
          },
          {
            id: 'D.3',
            title: '3. Post-Civil War Military Regimes',
            content: [
              'The Gowon Regime',
              'The Murtala/Obasanjo Regime',
              'The Buhari Regime',
              'The Babangida Regime',
              'The Interim National Government (ING)',
              'The Abacha Regime',
            ],
            objectives: [
              'Assess the challenges and achievements of the Gowon Regime',
              'Assess the challenges and achievements of the Murtala/Obasanjo Regime',
              'Assess the challenges and achievements of the Buhari Regime',
              'Assess the challenges and achievements of the Babangida Regime',
              'Examine the role and challenges of the Interim National Government',
              'Assess the challenges and achievements of the Abacha Regime',
            ],
            aiPrompt: "Explain post-civil war military regimes in Nigeria. Discuss each regime's: Key policies, economic programs, political developments, human rights record, transition programs, challenges and achievements.",
          },
          {
            id: 'D.4',
            title: '4. Nigeria in International Organizations',
            content: [
              'Economic Community of West African States (ECOWAS)',
              'African Union (AU)',
              'Commonwealth of Nations',
              'Organization of Petroleum Exporting Countries (OPEC)',
              'United Nations Organization',
              'The role of Nigeria in Conflict Resolution',
            ],
            objectives: [
              'Examine the role of Nigeria in ECOWAS',
              'Assess the role of Nigeria in the AU',
              'Evaluate the role of Nigeria in the Commonwealth of Nations',
              'Assess the role of Nigeria in OPEC',
              'Examine the role of Nigeria in the UN',
              'Examine the role of Nigeria in conflict resolutions in the Congo, Chad, Liberia, Sierra Leone, Guinea and the Sudan',
            ],
            aiPrompt: "Explain Nigeria's role in international affairs. Discuss membership and contributions to: ECOWAS, AU, Commonwealth, OPEC, UN. Analyze Nigeria's peacekeeping roles in African conflicts with specific examples.",
          },
        ],
      },
      {
        id: 'partII',
        title: 'PART II: AFRICA AND THE WIDER WORLD SINCE 1800',
        topics: [
          {
            id: 'PII.1',
            title: '1. Islamic Reform Movements and State Building in West Africa',
            content: [
              'Relationship between Sokoto and other Jihads',
              'The Jihads of Seku Ahmadu and Al-Haji Umar',
              'The activities of Samori Toure',
            ],
            objectives: [
              'Establish the relationship between the Sokoto Jihad and other Jihads in West Africa',
              'Compare the achievements of the Jihads of Seku Ahmadu and Al-Haji Umar',
              'Examine the activities of Samori Toure of the Madinka Empire',
            ],
            aiPrompt: "Explain Islamic reform movements in 19th century West Africa. Compare Sokoto Jihad with Seku Ahmadu's jihad in Macina and Al-Hajj Umar's jihad in Tukulor Empire. Discuss Samori Toure's resistance and state-building.",
          },
          {
            id: 'PII.2',
            title: '2. Sierra Leone, Liberia and Christian Missionary Activities in West Africa',
            content: [
              'The foundation of Sierra Leone and Liberia and the spread of Christianity',
              'The activities and impact of Christian missionaries',
            ],
            objectives: [
              'Determine the factors that led to the founding of Sierra Leone and Liberia',
              'Examine the importance of Sierra Leone and Liberia in the spread and impact of Christianity in West Africa',
              'Assess the impact of Christian missionary activities in West Africa',
            ],
            aiPrompt: "Explain Sierra Leone and Liberia as foundations for Christianity in West Africa. Discuss: Founding of Freetown and Monrovia, role of recaptives and freed slaves, missionary activities and their social, educational impacts.",
          },
          {
            id: 'PII.3',
            title: '3. Egypt under Mohammed Ali and Khedive Ismail',
            content: [
              'The rise of Mohammad Ali and his reforms',
              'Mohammad Ali\'s relations with the Europeans',
              'Ismail\'s fiscal policies',
              'The British occupation of Egypt',
            ],
            objectives: [
              'Determine the factors that aided Mohammad Ali\'s rise to power and his reforms',
              'Establish the relationship between Mohammad Ali\'s Empire and the Europeans',
              'Account for the fiscal policies of Ismail',
              'Examine the reasons for the British occupation of Egypt',
            ],
            aiPrompt: "Explain modernization of Egypt under Muhammad Ali and Ismail. Discuss Muhammad Ali's reforms (military, economic), European relations, Ismail's ambitious projects and debt crisis, British occupation (1882) and its causes.",
          },
          {
            id: 'PII.4',
            title: '4. The Mahdi and Mahdiyya Movement in the Sudan',
            content: [
              'Causes',
              'Course',
              'Consequences',
            ],
            objectives: [
              'Examine the causes, the course and consequences of the Mahdiyya Movement in the Sudan',
            ],
            aiPrompt: "Explain the Mahdist revolt in Sudan (1881-1899). Discuss: Causes (Egyptian misrule, religious revival), leadership of Muhammad Ahmad al-Mahdi, establishment of Mahdist state, defeat by Kitchener, consequences for Sudan.",
          },
          {
            id: 'PII.5',
            title: '5. Imperialism, Colonialism and Problems of Nation-Building in Africa',
            content: [
              'The New Imperialism and European Occupation of Africa',
              'Patterns of Colonial Rule in Africa: British, French, Portuguese, Belgians',
              'The Politics of Decolonization',
              'Apartheid in South Africa',
              'Problems of Nation-building in Africa',
            ],
            objectives: [
              'Assess the causes of the New Imperialism',
              'Examine the causes of the scramble',
              'Account for the significance of the Berlin Conference',
              'Examine African resistance to the occupation',
              'Examine and compare the patterns of colonial rule by the various European powers',
              'Examine the policies employed by the colonial masters and the magnitude of African discontent',
              'Assess the impact of the First and Second World Wars on African nationalism',
              'Determine the strategies used in the attainment of independence',
              'Trace the origin of apartheid in South Africa',
              'Give reasons for the rise of Afrikaner nationalism',
              'Evaluate apartheid laws',
              'Relate the internal reactions to apartheid to the African struggle for majority rule',
              'Relate the contributions of African states and international organizations to the fight against apartheid',
              'Identify the steps taken towards the dismantling of apartheid in South Africa',
              'Assess the post-apartheid development in South Africa',
              'Examine the political and economic problems faced by African countries in nation-building',
              'Assess the effects of natural disasters on Africa',
              'Determine the role of ethnic and religious problems in Africa',
              'Examine the role of the military in African politics',
              'Examine the role of neo-colonialism in Africa',
              'Assess the problems of boundary disputes',
              'Establish the relationship between civil wars and refugee problems in Africa',
            ],
            aiPrompt: "Explain 19th-20th century African history comprehensively. Cover: Scramble for Africa and Berlin Conference, different colonial systems, decolonization processes, apartheid in South Africa, and post-independence challenges across Africa.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Abba, A (2006) The Politics of Mallam Aminu Kano, Kaduna Vanguard and Publishers',
          'Ayandele, A. E. et al (1986) The Making of Modern Africa, The Twentieth Century Vol 2., Longman',
          'Ajayi and Crowther (1971) History of West Africa Vol. I, London, Longman',
          'Ajayi and Crowther (1974) History of West Africa Vol. II, London, Longman',
          'Akinlove, S. A. (1976) Emergent African States: Topics in Twentieth Century African History, Longman',
          'Akinyemi, A. B., Agbi, S. O. and Otunbanjo, A. O. (eds) (1989) Nigeria since Independence: The First 25 years. (International Relations) Vol x, Heinemann. Ibadan',
          'Anene J. C. and Brown, G (1966) African in the 19th and 20th centuries, Ibadan: University Press',
          'Boahen, A (1969) The Revolutionary years: Africa since 1800 Longman publishers',
          'Coleman, J. S. (1986) Nigeria: Background to Nationalism, Benin: Broburg and Wistrom',
          'Crowther, M. Nigeria: An introduction to its History, London:Longman,1979',
          'Falola, T. et al (1989) History of Nigeria Vol. I, Lagos: Longman',
          'Falola T. et al (1989) History of Nigeria Vols. 2 and 3, Lagos: Longman',
          'Ikime, O. (ed) (1980) Ground work of Nigerian History, Ibadan: Heinemann',
          'Iseihei, E. (1983) A History of Nigeria, London: Longman',
          'Omolewa, M. (1986) Certificate History of Nigeria, Lagos: Longman',
          'Onwubiko, K. (1983) School Certificate History of West Africa, Onitsha: African - First Publishers',
          'Wisdomline Pass at Once JAMB (2012)',
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
        AsyncStorage.getItem('history_ai_explanations'),
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
    const systemPrompt = 'You are an expert History tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian and African context. Use chronological organization and analyze cause-effect relationships. Format in markdown with proper headings and bullet points.';
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
      await AsyncStorage.setItem('history_ai_explanations', JSON.stringify(updated));
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
          onPress: () => navigation.navigate('Subscription')
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered historical analysis with chronological context.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate Premium',
            style: 'default',
            onPress: () => navigation.navigate('Subscription')
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
      const prompt = `As a History tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for History:
1. Start with a clear historical context in ## H2 heading
2. Organize chronologically where applicable
3. Analyze cause-effect relationships
4. Compare and contrast different historical developments
5. Use specific dates, names, and events
6. Highlight key historical significance with **bold**
7. Include primary source analysis where relevant
8. Connect historical events to modern Nigeria/Africa
9. Provide historical debates or interpretations
10. Include timeline for major events

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key terms and historical figures
- Use > for important quotes or primary sources
- Include tables for comparisons where helpful
- Organize chronologically
- Make it engaging for Nigerian students

Write in clear, analytical historical style with proper context.`;

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
              content: 'You are an expert History tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian and African context. Use chronological organization and analyze cause-effect relationships. Format in markdown with proper headings and bullet points.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
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
              await AsyncStorage.removeItem('history_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All History explanations cleared');
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
              name={isSaved ? "auto-awesome" : "history"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'AI Notes' : isPremiumActivated ? 'AI Analyze' : 'Locked'}
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
            color="#8B0000" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#8B0000" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#8B0000" style={styles.bulletIcon} />
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
                        color="#B22222" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#8B0000" />
                              <Text style={styles.subsectionTitle}>Historical Topics:</Text>
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
                              <Icon name="school" size={16} color="#8B0000" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#DC143C" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Advanced History AI Tutor</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B0000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Historical Analysis</Text>
                <Text style={styles.featureDescription}>Get detailed chronological analysis with cause-effect relationships</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B0000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian & African History</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage from pre-colonial to modern history</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B0000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Comparative Analysis</Text>
                <Text style={styles.featureDescription}>Compare historical developments across regions and periods</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B0000" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Primary Source Analysis</Text>
                <Text style={styles.featureDescription}>Learn historical interpretation and source evaluation</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for all History topics</Text>
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
          <Icon name="history" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>HISTORY</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Complete Nigerian & African History</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {!isPremiumActivated ? (
            <TouchableOpacity 
              style={styles.premiumButton}
              onPress={() => navigation.navigate('Subscription')}
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
            <Icon name="delete-sweep" size={20} color="white" />
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
            <Icon name="info" size={20} color="#8B0000" />
            <Text style={styles.infoTitle}>How to Use</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#8B0000" />
              <Text style={styles.tipText}>Tap section headers to expand/collapse topics</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "history" : "lock"} size={16} color={isPremiumActivated ? "#DC143C" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Analyze for historical context' : 'Activate premium for AI analysis'}
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
              <Text style={styles.tipText}>AI analyses are saved for offline use</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="timeline" size={16} color="#8B0000" />
              <Text style={styles.tipText}>Chronological organization for better understanding</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} topics with saved AI analyses
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
                <Icon name="history" size={20} color="#8B0000" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - AI Historical Analysis
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
                  <ActivityIndicator size="large" color="#8B0000" />
                  <Text style={styles.loadingText}>
                    Generating historical analysis with chronological context...
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
                <Icon name="share" size={20} color="#8B0000" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Saved', 'Historical analysis saved successfully!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Save Analysis
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

// Markdown styles for History
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
    color: '#8B0000',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A52A2A',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B22222',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#8B0000',
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
    borderColor: '#FFB6C1',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#FFF0F0',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFB6C1',
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
    color: '#A52A2A',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#A52A2A',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#8B0000',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#FFF0F0',
    borderLeftWidth: 4,
    borderLeftColor: '#8B0000',
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
    marginBottom:35,
  },
  header: {
    backgroundColor: '#8B0000',
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
    marginTop: -55,
    marginLeft:55
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
    marginLeft:-90
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
    color: '#8B0000',
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
    color: '#8B0000',
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
    borderColor: '#FFD6D6',
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
    color: '#8B0000',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC143C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#8B0000',
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
    color: '#8B0000',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#8B0000',
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
    color: '#8B0000',
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
    borderColor: '#8B0000',
  },
  saveButton: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B0000',
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
    backgroundColor: '#8B0000',
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
    color: '#8B0000',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B0000',
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
    backgroundColor: '#8B0000',
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
    backgroundColor: "rgba(139, 0, 0, 0.9)",
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

export default HistorySyllabusScreen;