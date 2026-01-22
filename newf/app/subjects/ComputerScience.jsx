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

const ComputerStudiesSyllabusScreen = () => {
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

  // Computer Studies Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Evolution of Computing Systems',
          'Basic concepts of computer and its operations',
          'Problem solving skills, data processing and practical skills in Computing',
          'System software and Application Software',
          'Operations of Basic computer hardware – Input, Output, Memory and Central Processing Unit',
          'Application of Online resources and Online skills',
          'Ethics and human issues in computing',
          'Career Prospects in Computing',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: EVOLUTION OF COMPUTING',
        topics: [
          {
            id: 'A.1',
            title: 'History of Computing',
            content: [
              'Pre-Computing Age (19th Century): Abacus, Slide Rule, Napier\'s Bones',
              'Pascal Calculator, Leibnitz Multiplier, Jacquard Loom',
              'Charles Babbage\'s Analytical Engine, Hollerith Census machine',
              '20th Century: ENIAC, EDVAC, UNIVAC 1, Desktop Personal Computers',
            ],
            objectives: [
              'Identify various computing devices since beginning of counting',
              'Discuss contributions and uses of founders of computing devices',
            ],
            aiPrompt: "Explain the history of computing from ancient devices to modern computers. Cover: Abacus, Slide Rule, Napier's Bones, Pascal's calculator, Charles Babbage's Analytical Engine, Hollerith Census machine, ENIAC, EDVAC, UNIVAC. Discuss importance for Nigerian students.",
          },
          {
            id: 'A.2',
            title: 'Classification of Computing Devices',
            content: [
              'By Generation: 1st to current generation (characteristics, components)',
              'By Size: Micro, Mini, Mainframe, Super computers',
              'By Purpose: Digital, Analog, Hybrid, Special purpose, General purpose',
              'Modern computers: PCs, Laptops, Tablets, Servers, Workstations, Wearable',
            ],
            objectives: [
              'Relate each generation with characteristic features',
              'Describe each generation (year, components, speed, storage)',
              'Explain differences in classification by size',
              'Differentiate among modern computer systems',
              'State importance and uses of computing systems',
            ],
            aiPrompt: "Explain classification of computers: by generation (1st-5th), by size (micro to super), by purpose (analog, digital, hybrid). Detail characteristics of each generation. Discuss Nigerian computer market trends and commonly used devices.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: FUNDAMENTALS OF COMPUTING',
        topics: [
          {
            id: 'B.1',
            title: 'Overview of Computing Systems',
            content: [
              'Hardware and Software components',
              'Characteristics of computers (Electronic, Accuracy, Speed, Reliability)',
              'Computer hardware types and examples',
              'Logic circuits and gates (AND, OR, NOT, NAND, NOR)',
              'Software types (System and Application)',
            ],
            objectives: [
              'Define computer system and list functional parts',
              'Explain characteristics of computers',
              'Differentiate between hardware and software',
              'Define hardware devices and list components',
              'Explain input/output devices and their functions',
              'Describe CPU components (ALU, CU, Registers)',
              'Differentiate between primary and secondary memory',
              'Explain logic gates and construct truth tables',
            ],
            aiPrompt: "Explain computer fundamentals: hardware vs software, computer characteristics. Detail CPU components (ALU, CU, registers), memory types (RAM, ROM, secondary storage). Cover logic gates (AND, OR, NOT) with truth tables. Use Nigerian educational context.",
          },
          {
            id: 'B.2',
            title: 'Data and Information',
            content: [
              'Differences between data and information',
              'Data representation methods',
              'Data types: integers, real numbers, strings, multimedia',
              'Number bases: binary, decimal, hexadecimal',
              'Digitization process and formats',
            ],
            objectives: [
              'Define data and information',
              'List properties of information',
              'Identify data types and representation methods',
              'Explain digitization process',
              'List digitized data formats',
            ],
            aiPrompt: "Explain data vs information with Nigerian examples. Cover data representation: binary, decimal, hexadecimal conversions. Discuss digitization process and importance in Nigerian digital economy. Include practical examples.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: COMPUTER APPLICATION PACKAGES',
        topics: [
          {
            id: 'C.1',
            title: 'Word Processing Package',
            content: [
              'MS Word concepts and features',
              'Creating, editing, saving documents',
              'Formatting, insertion, printing operations',
              'Application areas: Office, Publishing, Education',
            ],
            objectives: [
              'Define word processing and give examples',
              'Identify features of word processing packages',
              'List application areas',
              'Perform MS Word basic operations',
              'Carry out advanced operations',
            ],
            aiPrompt: "Explain MS Word for UTME Computer Studies. Cover: creating documents, formatting, saving, printing. Include Nigerian educational applications. Provide practical exercises relevant to Nigerian students.",
          },
          {
            id: 'C.2',
            title: 'Spreadsheet Package',
            content: [
              'MS Excel concepts and features',
              'Worksheet, workbook, cells, ranges',
              'Data types: Numbers, Labels, Formulas',
              'Arithmetic calculations and functions',
              'Chart creation and formatting',
            ],
            objectives: [
              'Define spreadsheet and give examples',
              'Identify spreadsheet features',
              'List application areas',
              'Perform basic Excel operations',
              'Use formulas and functions',
              'Create charts and graphs',
            ],
            aiPrompt: "Explain MS Excel for UTME. Cover: worksheets, formulas, functions, charts. Include Nigerian business and educational applications. Provide sample problems with Nigerian data.",
          },
          {
            id: 'C.3',
            title: 'Database Package',
            content: [
              'Database concepts: MS Access',
              'Database organization: Hierarchical, Network, Relational',
              'Files, records, fields, keys',
              'Creating and managing databases',
              'Searching, modifying, sorting operations',
            ],
            objectives: [
              'Define database and give examples',
              'Define database terms',
              'List types of database organization',
              'List application areas in Nigeria',
              'Create and manage databases',
              'Perform database operations',
            ],
            aiPrompt: "Explain databases using MS Access. Cover: tables, relationships, queries, forms, reports. Include Nigerian examples: student records, business inventory. Provide practical database exercises.",
          },
          {
            id: 'C.4',
            title: 'Graphics Package',
            content: [
              'Graphics concepts: CorelDraw',
              'Features: LiveSketch, Healing Clone Tools',
              'Design creation: Logos, Cards, Certificates',
              'Business card, school logo, national flag design',
            ],
            objectives: [
              'Define graphics and give examples',
              'Explain CorelDraw features',
              'Use CorelDraw for design work',
              'Create various graphic designs',
            ],
            aiPrompt: "Explain graphics packages with focus on CorelDraw. Cover: basic tools, design principles. Include Nigerian design examples: business cards, school logos. Provide step-by-step design tutorials.",
          },
          {
            id: 'C.5',
            title: 'Presentation Package',
            content: [
              'Presentation concepts: PowerPoint',
              'Features: Animation, Transitions, Sections',
              'Creating and running presentations',
              'Inserting multimedia elements',
            ],
            objectives: [
              'Define presentation packages',
              'Explain PowerPoint features',
              'Activate and run presentations',
              'Create multimedia presentations',
            ],
            aiPrompt: "Explain PowerPoint for UTME. Cover: slide creation, animations, transitions. Include Nigerian educational presentation examples. Provide tips for effective presentations.",
          },
          {
            id: 'C.6',
            title: 'Web Design Package',
            content: [
              'Web design concepts',
              'Packages: HTML, Dreamweaver, Google Web Designer',
              'Elements: Navigation, Visual design, Content',
              'Website design and development',
            ],
            objectives: [
              'Define web design packages',
              'List elements of web design',
              'Use Dreamweaver for web development',
              'Design basic websites',
            ],
            aiPrompt: "Explain web design fundamentals. Cover: HTML basics, Dreamweaver, responsive design. Include Nigerian website examples. Discuss web design career opportunities in Nigeria.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: MANAGING COMPUTER FILES',
        topics: [
          {
            id: 'D.1',
            title: 'Concept of Computer Files',
            content: [
              'Basic terms: File, Record, Field, Data item',
              'File organizations: Serial, Sequential, Indexed, Random',
              'File classifications: Master, Transaction, Reference',
              'Access methods and criteria',
            ],
            objectives: [
              'Define basic file terms',
              'Identify data types',
              'Explain file structure relationships',
              'Classify files by organization',
              'Access files appropriately',
              'Explain classification criteria',
            ],
            aiPrompt: "Explain computer file management. Cover: file organization methods, access methods, file types. Include Nigerian business file management examples. Discuss importance of proper file management.",
          },
          {
            id: 'D.2',
            title: 'Handling Computer Files',
            content: [
              'Basic file operations: Create, Delete, Retrieve',
              'Data loss causes and prevention',
              'Security methods: Backup, Antivirus, Passwords',
              'Computer vs manual file comparison',
            ],
            objectives: [
              'Perform basic file operations',
              'Identify causes of data loss',
              'Use data security methods',
              'Compare computer and manual files',
            ],
            aiPrompt: "Explain file handling and security. Cover: file operations, data backup strategies, security measures. Include Nigerian cybersecurity context. Discuss data protection laws in Nigeria.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'SECTION E: COMPUTER MAINTENANCE AND SAFETY',
        topics: [
          {
            id: 'E.1',
            title: 'Booting and Shutting Down',
            content: [
              'Booting process definition',
              'Types: Cold and Warm booting',
              'Steps in booting and shutdown',
            ],
            objectives: [
              'Define booting',
              'List booting process types',
              'Explain differences',
              'Explain booting steps',
            ],
            aiPrompt: "Explain computer booting process. Cover: cold vs warm boot, POST, boot sequence. Include troubleshooting common Nigerian power-related boot issues.",
          },
          {
            id: 'E.2',
            title: 'Computer Maintenance',
            content: [
              'General cleaning procedures',
              'Battery charging and replacement',
              'Hardware and software maintenance',
              'Data recovery from crashed systems',
            ],
            objectives: [
              'Perform general cleaning',
              'Charge and replace batteries',
              'Perform simple maintenance',
              'Recover data from crashes',
            ],
            aiPrompt: "Explain computer maintenance procedures. Cover: hardware cleaning, software updates, preventive maintenance. Include Nigerian environmental factors (dust, power fluctuations).",
          },
          {
            id: 'E.3',
            title: 'Computer Room Management',
            content: [
              'Proper sitting arrangement',
              'Equipment positioning',
              'Environmental controls',
              'Laboratory rules and regulations',
            ],
            objectives: [
              'Define proper sitting arrangement',
              'Position equipment appropriately',
              'Ensure proper illumination',
              'Maintain dust-free environment',
              'Follow laboratory rules',
            ],
            aiPrompt: "Explain computer laboratory management. Cover: ergonomics, environmental controls, safety measures. Include Nigerian school computer lab setup guidelines.",
          },
        ],
      },
      {
        id: 'sectionF',
        title: 'SECTION F: INFORMATION & COMMUNICATION TECHNOLOGY',
        topics: [
          {
            id: 'F.1',
            title: 'Communication Systems',
            content: [
              'ICT definition and acronym',
              'Types: Broadcasting, Telecommunication, Data Networks',
              'Examples: Radio, TV, Satellite, Internet',
              'Information Systems types',
            ],
            objectives: [
              'State ICT full meaning',
              'Define ICT',
              'List ICT types',
              'Give examples of each type',
            ],
            aiPrompt: "Explain ICT concepts. Cover: broadcasting, telecommunications, data networks. Include Nigerian ICT infrastructure examples (Glo, MTN, Airtel networks).",
          },
          {
            id: 'F.2',
            title: 'Application Areas of ICT',
            content: [
              'Teleconferencing, Video conferencing',
              'E-Learning, E-Commerce, E-Government',
              'Telemedicine, E-Library',
              'ICT devices: Mobile phones, ATMs, POS',
            ],
            objectives: [
              'Define ICT application areas',
              'List ICT devices',
              'Explain uses of each',
            ],
            aiPrompt: "Explain ICT applications in Nigeria. Cover: e-government (NIMC, JAMB), e-commerce (Jumia, Konga), fintech (Paystack, Flutterwave). Discuss ICT's impact on Nigerian society.",
          },
          {
            id: 'F.3',
            title: 'Internet',
            content: [
              'Internet definitions and terms',
              'Browsers: Chrome, Firefox, Edge',
              'Browser features and functions',
              'Internet services: Email, FTP, WWW',
            ],
            objectives: [
              'Define Internet terms',
              'Access Internet through browsers',
              'Explain browser features',
              'Describe Internet services',
            ],
            aiPrompt: "Explain Internet fundamentals. Cover: browsers, URLs, HTTP/HTTPS. Include Nigerian Internet usage statistics and popular Nigerian websites.",
          },
          {
            id: 'F.4',
            title: 'Electronic Mail',
            content: [
              'Email definition and features',
              'Email services and creation',
              'Steps in email management',
              'Chatting and mailing lists',
            ],
            objectives: [
              'Define email and chatting',
              'List email services',
              'Explain email address components',
              'Create and manage emails',
            ],
            aiPrompt: "Explain email fundamentals. Cover: email creation, sending, attachments, etiquette. Include Nigerian email services and professional email practices.",
          },
          {
            id: 'F.5',
            title: 'Networking',
            content: [
              'Network definitions and types',
              'Topologies: Star, Bus, Ring',
              'Network devices: Routers, Switches, Modems',
              'Network cables and connectors',
            ],
            objectives: [
              'Define computer network',
              'List network types',
              'Explain network topologies',
              'Define network devices',
              'Identify cables and connectors',
            ],
            aiPrompt: "Explain computer networking. Cover: network types (LAN, WAN), topologies, devices. Include Nigerian networking examples (cyber cafes, office networks).",
          },
          {
            id: 'F.6',
            title: 'World Wide Web',
            content: [
              'WWW definitions and history',
              'Protocols: HTTP, HTTPS, FTP',
              'Advantages and disadvantages',
              'Website navigation and development',
            ],
            objectives: [
              'Give full meanings of web acronyms',
              'Explain WWW history',
              'Define protocols',
              'List WWW uses and benefits',
              'Navigate websites',
              'Differentiate email and website',
            ],
            aiPrompt: "Explain World Wide Web. Cover: web protocols, website development, navigation. Include Nigerian web development companies and popular Nigerian websites.",
          },
          {
            id: 'F.7',
            title: 'Cables and Connectors',
            content: [
              'Network cables: Twisted pair, Coaxial, Fibre optics',
              'Computer cables: USB, Power, Data',
              'Connectors: RJ45, RJ11, USB types',
              'Male and female connectors',
            ],
            objectives: [
              'Identify network cables and connectors',
              'Identify computer cables and connectors',
              'Explain uses of each',
            ],
            aiPrompt: "Explain computer cables and connectors. Cover: network cables, USB standards, connector types. Include practical wiring diagrams and Nigerian market availability.",
          },
        ],
      },
      {
        id: 'sectionG',
        title: 'SECTION G: DEVELOPING PROBLEM-SOLVING SKILLS',
        topics: [
          {
            id: 'G.1',
            title: 'Programming Languages',
            content: [
              'PL definition and classification',
              'Levels: Machine, Assembly, High-level',
              'Advantages and disadvantages',
              'High-level language classifications',
            ],
            objectives: [
              'Define programming language',
              'Identify PL classifications',
              'Give advantages/disadvantages',
              'Classify high-level languages',
              'Explain characteristics',
            ],
            aiPrompt: "Explain programming languages. Cover: machine vs assembly vs high-level languages. Include Nigerian programming language preferences and job market demands.",
          },
          {
            id: 'G.2',
            title: 'Translators',
            content: [
              'Translator definition and types',
              'Interpreters vs Compilers',
              'Functions and differences',
            ],
            objectives: [
              'Define translators',
              'Explain types of translators',
              'Differentiate interpreters and compilers',
            ],
            aiPrompt: "Explain programming translators. Cover: compilers, interpreters, assemblers. Include examples and when each is used in software development.",
          },
          {
            id: 'G.3',
            title: 'Algorithms and Flowcharts',
            content: [
              'Algorithm definition and properties',
              'Flowchart symbols and drawing',
              'Problem-solving using flowcharts',
              'Programming problem representation',
            ],
            objectives: [
              'Define algorithm and flowchart',
              'State algorithm functions',
              'Explain algorithm properties',
              'Identify flowchart symbols',
              'Draw flowcharts for problems',
            ],
            aiPrompt: "Explain algorithms and flowcharts. Cover: algorithm properties, flowchart symbols, problem-solving steps. Include Nigerian educational examples and practical exercises.",
          },
          {
            id: 'G.4',
            title: 'Programming Language Structure',
            content: [
              'Basic statements and syntax',
              'Arithmetic and string operators',
              'Data types: Primitive and non-primitive',
              'Complex data structures',
            ],
            objectives: [
              'Identify language features',
              'Use basic statements',
              'Apply operators and expressions',
              'Differentiate data types',
              'Understand data structures',
            ],
            aiPrompt: "Explain programming language structure. Cover: variables, data types, operators, control structures. Use Python or BASIC examples relevant to UTME syllabus.",
          },
          {
            id: 'G.5',
            title: 'Program Development',
            content: [
              'Program definition and characteristics',
              'Development steps and precautions',
              'Examples: Interpreted and Compiled programs',
              'Good programming practices',
            ],
            objectives: [
              'Define program',
              'List program characteristics',
              'State development precautions',
              'Explain development steps',
              'Give program examples',
            ],
            aiPrompt: "Explain program development lifecycle. Cover: problem definition, design, coding, testing, documentation. Include Nigerian software development examples.",
          },
          {
            id: 'G.6',
            title: 'System Development Life Cycle',
            content: [
              'SDLC definition and stages',
              'Feasibility, Analysis, Design',
              'Implementation and Maintenance',
              'SDLC diagram representation',
            ],
            objectives: [
              'Define SDLC',
              'Describe SDLC stages',
              'Explain each stage',
              'Draw SDLC diagram',
            ],
            aiPrompt: "Explain System Development Life Cycle. Cover: waterfall model stages with Nigerian software project examples. Discuss SDLC importance in system development.",
          },
        ],
      },
      {
        id: 'sectionH',
        title: 'SECTION H: ARTIFICIAL INTELLIGENCE & ROBOTICS',
        topics: [
          {
            id: 'H.1',
            title: 'Artificial Intelligence',
            content: [
              'AI definition and branches',
              'Machine Learning, Neural Networks',
              'Expert Systems, Natural Language Processing',
              'AI applications in various sectors',
            ],
            objectives: [
              'Define AI',
              'Identify AI branches',
              'List AI application areas',
              'Explain AI uses in Nigeria',
            ],
            aiPrompt: "Explain Artificial Intelligence fundamentals. Cover: machine learning, neural networks, expert systems. Include Nigerian AI applications (agriculture, finance, healthcare).",
          },
          {
            id: 'H.2',
            title: 'Robotics',
            content: [
              'Robotics definition and components',
              'Types: Humanoid, Autonomous, Teleoperated',
              'Application areas: Manufacturing, Healthcare',
              'Advantages and disadvantages',
            ],
            objectives: [
              'Define robotics and robots',
              'Identify robot components',
              'Mention robot types',
              'Itemize application areas',
              'State advantages/disadvantages',
            ],
            aiPrompt: "Explain robotics fundamentals. Cover: robot components, types, applications. Discuss robotics potential in Nigerian industries and education.",
          },
        ],
      },
      {
        id: 'sectionI',
        title: 'SECTION I: COMPUTER ETHICS & HUMAN ISSUES',
        topics: [
          {
            id: 'I.1',
            title: 'Ethical Issues',
            content: [
              'Computer-related crimes',
              'Responsibility for computer failure',
              'Protection of computer property',
              'Privacy protection methods',
            ],
            objectives: [
              'Define computer-related crime',
              'State crime examples',
              'List prevention methods',
              'Protect computer resources',
              'Protect individual privacy',
            ],
            aiPrompt: "Explain computer ethics and cybercrime. Cover: hacking, data theft, prevention. Include Nigerian cybercrime laws (Cybercrime Act 2015) and prevention strategies.",
          },
          {
            id: 'I.2',
            title: 'Computer Security',
            content: [
              'Security types: Network, Internet, Data',
              'Security tools: Firewalls, Antivirus, Encryption',
              'Information Security dimensions (CIA)',
              'Network security methods',
            ],
            objectives: [
              'Define computer security',
              'Identify security types',
              'Use appropriate security tools',
              'Understand CIA triad',
              'Apply network security methods',
            ],
            aiPrompt: "Explain computer security concepts. Cover: firewalls, encryption, antivirus. Include Nigerian cybersecurity challenges and solutions. Discuss security best practices.",
          },
          {
            id: 'I.3',
            title: 'Cyber Risks and Protection',
            content: [
              'Cyber threats: Malware, Phishing, Ransomware',
              'Security safety tips',
              'Prevention and protection measures',
              'Safe Internet practices',
            ],
            objectives: [
              'List cyber security threats',
              'Identify threat types',
              'Apply safety tips',
              'Practice safe computing',
            ],
            aiPrompt: "Explain cyber risks and protection. Cover: malware types, phishing, ransomware. Include Nigerian cyber attack examples and prevention. Provide practical safety guidelines.",
          },
          {
            id: 'I.4',
            title: 'Career Prospects in Computing',
            content: [
              'Software Developer, Web Developer',
              'Database Administrator, Network Engineer',
              'AI and Robotics careers',
              'Digital Forensics, Cybersecurity',
              'ICT entrepreneurship opportunities',
            ],
            objectives: [
              'List computing career paths',
              'Identify required skills',
              'Understand job roles',
              'Explore Nigerian IT job market',
            ],
            aiPrompt: "Explain computing career prospects in Nigeria. Cover: software development, cybersecurity, data science, AI careers. Discuss Nigerian IT industry trends and salary ranges.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Bibhya Sharma et al: A Textbook for Year 11 - Computer Studies',
          'Addan Emmanuel: My Computer for Senior Secondary Schools 1, 2, 3',
          'Adebisi, A. J.: Fundamentals of Computer Studies',
          'Adedapo F. O. et al: Online with Computer Senior Secondary 2',
          'Brookshear, J. G.: Computer Science: An Overview',
          'Chiemeke Stella C. et al: Computer Studies for Senior Secondary Schools',
          'Doyle, S: Computer Studies for You (2nd Edition)',
          'Driscoll, T. & Dolden R.: Computer Studies and Information Technology',
          'Henderson, P.: Modern Introductory Computer Science',
          'HiIT@School: Computer Studies for Senior Secondary Education',
          'Ojo D. J.: Senior Secondary School Certificate Examination on Data Processing',
          'Otuka J. O. E. et al: New Computer Studies 1-3',
          'SSCE/NECO Past Questions and Answers on Computer Studies',
          'Sloan, R. H., & Troy, P.: CS 0.5: introductory computer science for majors',
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
        AsyncStorage.getItem('computer_studies_ai_explanations'),
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
    const systemPrompt = 'You are an expert Computer Science tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current tech context. Use proper computing terminology. Format in markdown.';
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
      await AsyncStorage.setItem('computer_studies_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered Computer Studies explanations.',
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
      const prompt = `As a Computer Science expert, explain "${topic.title}" for UTME/JAMB Computer Studies preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Computer Studies:
1. Start with a clear definition in ## H2 heading
2. Use current Nigerian tech examples and context
3. Explain concepts with reference to Nigerian IT industry
4. Include diagrams/code where relevant
5. Highlight key learning points with **bold**
6. Provide comparative analysis where applicable
7. Include current tech trends in Nigeria
8. Provide practice questions with solutions
9. Connect theoretical concepts with practical applications

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key computing terms
- Use > for important principles or facts
- Include Nigerian tech statistics where available
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian tech context and practical computer skills.`;

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
              content: 'You are an expert Computer Science tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current tech context. Use proper computing terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('computer_studies_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Computer Studies explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "computer" : "lock"} 
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
            color="#0066CC" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#0066CC" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#0066CC" style={styles.bulletIcon} />
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
                        color="#0099FF" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#0066CC" />
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
                              <Icon name="school" size={16} color="#0066CC" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#00CCFF" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Computer Studies</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0066CC" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Computer Studies</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian tech context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0066CC" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Programming & Software</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of programming concepts</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0066CC" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Hardware & Networking</Text>
                <Text style={styles.featureDescription}>Detailed hardware and networking explanations</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0066CC" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI & Career Guidance</Text>
                <Text style={styles.featureDescription}>AI concepts and Nigerian IT career prospects</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Computer Studies</Text>
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
          <Icon name="computer" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>COMPUTER STUDIES</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Tech & ICT Focus</Text>
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
            <Icon name="info" size={20} color="#0066CC" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#0066CC" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "computer" : "lock"} size={16} color={isPremiumActivated ? "#00CCFF" : "#999"} />
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
              <Icon name="code" size={16} color="#0066CC" />
              <Text style={styles.tipText}>Includes Nigerian tech context and practical computer skills</Text>
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
                <Icon name="computer" size={20} color="#0066CC" />
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
                  <ActivityIndicator size="large" color="#0066CC" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian tech context...
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
                <Icon name="share" size={20} color="#0066CC" />
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

// Markdown styles for Computer Studies
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
    color: '#003366',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066CC',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0099FF',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#003366',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F0F8FF',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#B0E0E6',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F0F8FF',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B0E0E6',
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
    color: '#0066CC',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#0066CC',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
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
    backgroundColor: '#0066CC',
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
    color: '#0066CC',
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
    backgroundColor: '#F0F8FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
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
    backgroundColor: '#F8FFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B0E0E6',
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
    color: '#0066CC',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00CCFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#003366',
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
    color: '#0066CC',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#0066CC',
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
    color: '#0066CC',
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
    borderColor: '#0066CC',
  },
  saveButton: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066CC',
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
    backgroundColor: '#0066CC',
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
    backgroundColor: '#F0F8FF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0066CC',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
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
    backgroundColor: '#0066CC',
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
    backgroundColor: "rgba(0, 102, 204, 0.9)",
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

export default ComputerStudiesSyllabusScreen;