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

const PrinciplesOfAccountsSyllabusScreen = () => {
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
          'Stimulate and sustain interest in Principles of Accounts',
          'Use basic knowledge and practical skills in Accounting',
          'Apply knowledge and interpretation of accounting information to decision making',
          'Determine relevance of accounting information to business and governments',
          'Use information and communication technology for present and future challenges',
          'Use current accounting principles in financial reporting',
        ],
      },
      {
        id: 'section1',
        title: '1. NATURE AND SIGNIFICANCE OF BOOKKEEPING AND ACCOUNTING',
        topics: [
          {
            id: '1.1',
            title: 'Nature and Development of Accounting',
            content: [
              'Development of Accounting',
              'Branches of accounting',
              'Objectives of Book Keeping and Accounting',
              'Users and characteristics of Accounting information',
              'Principles, concepts and conventions',
              'Role of Accounting records and information',
            ],
            objectives: [
              'Differentiate between Book Keeping and Accounting',
              'Understand historical background of Book Keeping and Accounting',
              'Apply right principles, concepts and conventions',
              'Understand role of Accounting information in decision making',
              'Identify types/branches of Accounting',
            ],
            aiPrompt: "Explain the nature and significance of bookkeeping and accounting. Differentiate between bookkeeping and accounting. Discuss the development of accounting historically. Explain the branches of accounting: Cost Accounting, Management Accounting, Auditing, Financial Accounting, Forensic Accounting, Social and Environmental Accounting, Government Accounting and Taxation. Provide Nigerian examples of each branch.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. PRINCIPLES OF DOUBLE ENTRY',
        topics: [
          {
            id: '2.1',
            title: 'Double Entry System',
            content: [
              'Source documents',
              'Books of original entry',
              'Accounting equation',
              'Ledger and its classifications',
              'Trial balance',
              'Types and correction of errors',
              'Suspense Account',
            ],
            objectives: [
              'Identify various source documents and their uses',
              'Relate source documents to books of original entry',
              'Determine effect of changes in Accounting equation',
              'Understand role of double entry principles',
              'Extract trial balance from ledger accounts',
              'Identify types of errors and their corrections',
              'Correct errors using suspense account',
            ],
            aiPrompt: "Explain the principles of double entry accounting. What are source documents? Show the accounting equation: Assets = Liabilities + Capital. Demonstrate how to record transactions in ledger accounts. How to prepare a trial balance? Identify different types of errors: errors of omission, commission, principle, original entry, compensating errors. Show how to use suspense account. Provide Nigerian business examples.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. ETHICS IN ACCOUNTING',
        topics: [
          {
            id: '3.1',
            title: 'Accounting Ethics',
            content: [
              'Objectives of ethics in accounting',
              'Qualities of an Accountant',
            ],
            objectives: [
              'Understand ethics in preparing and presenting Accounting information',
              'Understand qualities of an Accountant: honesty, integrity, transparency, accountability, fairness',
            ],
            aiPrompt: "Explain ethics in accounting. Why are ethics important for accountants? Discuss the qualities of a professional accountant: honesty, integrity, transparency, accountability, fairness. Provide examples of ethical dilemmas in Nigerian accounting practice. How does ICAN enforce ethical standards?",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. CASH BOOK',
        topics: [
          {
            id: '4.1',
            title: 'Cash Book Management',
            content: [
              'Columnar Cash Books: single, double, three column',
              'Discounts: trade and cash discounts',
              'Petty Cash Book and interest system',
              'Determining cash float',
            ],
            objectives: [
              'Determine the cash float',
              'Differentiate between two and three columnar cash books',
              'Differentiate between trade and cash discounts',
              'Examine effects of trade and cash discounts',
              'Identify various petty cash expenses',
            ],
            aiPrompt: "Explain cash book management. Differentiate between single, double, and three column cash books. How to record transactions in each? What is cash float? Differentiate between trade discount and cash discount with examples. How to maintain a petty cash book using the interest system? Provide Nigerian business examples.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. BANK TRANSACTIONS AND RECONCILIATION',
        topics: [
          {
            id: '5.1',
            title: 'Bank Transactions',
            content: [
              'Instruments of bank transactions',
              'E-banking system',
              'Causes of discrepancies between cash book and bank statement',
              'Bank reconciliation statement',
            ],
            objectives: [
              'Identify instruments: cheques, pay-in-slips, credit cards, debit cards, internet banking',
              'Assess impact of automated credit system',
              'Identify factors causing discrepancies',
              'Determine adjusted cash book balance',
            ],
            aiPrompt: "Explain bank transactions and reconciliation. What are the instruments of bank transactions? Discuss e-banking in Nigeria. Why do differences occur between cash book and bank statement? How to prepare a bank reconciliation statement? Provide step-by-step examples with Nigerian bank scenarios.",
          },
        ],
      },
      {
        id: 'section6',
        title: '6. FINAL ACCOUNTS OF A SOLE TRADER',
        topics: [
          {
            id: '6.1',
            title: 'Sole Trader Accounts',
            content: [
              'Income statement (Trading and profit and loss account)',
              'Statement of financial position (Balance sheet)',
              'Adjustments: provision for bad debts, discounts, depreciation',
              'Accruals and prepayment',
            ],
            objectives: [
              'Determine cost of sales, gross profit and net profit',
              'Identify non-current assets, current assets, liabilities',
              'Compute adjustable items',
              'Differentiate between bad debts and provision',
            ],
            aiPrompt: "Explain final accounts for a sole trader. How to prepare trading account, profit and loss account, and balance sheet? Show adjustments: provision for bad debts, provision for discounts, depreciation (straight-line and reducing balance), accruals, prepayments. Differentiate between bad debts and provision for doubtful debts. Provide complete example with Nigerian Naira amounts.",
          },
        ],
      },
      {
        id: 'section7',
        title: '7. STOCK VALUATION',
        topics: [
          {
            id: '7.1',
            title: 'Stock Valuation Methods',
            content: [
              'Methods: FIFO, LIFO, simple average',
              'Advantages and disadvantages of methods',
              'Importance of stock valuation',
            ],
            objectives: [
              'Determine value of materials using FIFO, LIFO, average',
              'Calculate closing stock',
              'Compare advantages and disadvantages',
              'Determine effects on income statement',
            ],
            aiPrompt: "Explain stock valuation methods. Demonstrate FIFO (First In First Out), LIFO (Last In First Out), and simple average methods with calculations. What are the advantages and disadvantages of each method? How does stock valuation affect profit calculation? Provide Nigerian business examples with calculations.",
          },
        ],
      },
      {
        id: 'section8',
        title: '8. CONTROL ACCOUNTS',
        topics: [
          {
            id: '8.1',
            title: 'Control Accounts System',
            content: [
              'Meaning and uses of control accounts',
              'Purchases ledger control account',
              'Sales ledger control account',
            ],
            objectives: [
              'Understand meaning of control accounts',
              'Identify uses in business',
              'Differentiate between sales and purchases ledger control accounts',
              'Identify entries in control accounts',
            ],
            aiPrompt: "Explain control accounts. What are control accounts and why are they used? How to prepare purchases ledger control account and sales ledger control account? Show typical entries and balancing. Provide examples showing reconciliation with individual debtor/creditor accounts.",
          },
        ],
      },
      {
        id: 'section9',
        title: '9. INCOMPLETE RECORDS',
        topics: [
          {
            id: '9.1',
            title: 'Incomplete Records and Single Entry',
            content: [
              'Determination of missing figures',
              'Preparation of final accounts from incomplete records',
              'Conversion of single entry to double entry',
            ],
            objectives: [
              'Determine proprietor\'s capital using statement of affairs',
              'Determine sales, purchases, balances by conversion',
              'Use accounting equations and profit percentages',
            ],
            aiPrompt: "Explain how to handle incomplete records. How to prepare final accounts when records are incomplete? Demonstrate statement of affairs method. How to convert single entry to double entry? Use accounting equation and profit percentages to find missing figures. Provide step-by-step Nigerian example.",
          },
        ],
      },
      {
        id: 'section10',
        title: '10. MANUFACTURING ACCOUNTS',
        topics: [
          {
            id: '10.1',
            title: 'Manufacturing Accounting',
            content: [
              'Cost classification',
              'Cost apportionment',
              'Preparation of manufacturing account',
            ],
            objectives: [
              'Identify reason for preparing manufacturing account',
              'Calculate prime cost, overhead cost, production cost',
              'Determine basis of cost apportionment',
            ],
            aiPrompt: "Explain manufacturing accounts. How to prepare manufacturing account? Define and calculate: prime cost, factory overhead, production cost, total cost. How to apportion costs among production, administration, selling and distribution? Provide Nigerian manufacturing company example.",
          },
        ],
      },
      {
        id: 'section11',
        title: '11. NOT-FOR-PROFIT ORGANIZATIONS',
        topics: [
          {
            id: '11.1',
            title: 'Non-Profit Organization Accounts',
            content: [
              'Objectives of non-profit organizations',
              'Receipts and payments account',
              'Income and expenditure account',
              'Statement of financial position',
            ],
            objectives: [
              'Distinguish between profit and non-profit organizations',
              'Determine annual subscription, arrears and advance',
              'Compute cash balances, accumulated funds, surplus/deficit',
            ],
            aiPrompt: "Explain accounting for non-profit organizations. How do accounts differ from business accounts? Prepare receipts and payments account, income and expenditure account, and statement of financial position. How to handle subscriptions, donations, life membership fees? Provide example of a Nigerian church or club accounts.",
          },
        ],
      },
      {
        id: 'section12',
        title: '12. DEPARTMENTAL ACCOUNTS',
        topics: [
          {
            id: '12.1',
            title: 'Departmental Accounting',
            content: [
              'Objectives of departmental accounts',
              'Apportionment of expenses',
              'Departmental trading and profit and loss account',
            ],
            objectives: [
              'Identify reasons for departmental accounts',
              'Determine expenses and incomes attributable to departments',
              'Compute departmental profit or loss',
            ],
            aiPrompt: "Explain departmental accounts. Why do businesses prepare departmental accounts? How to apportion common expenses to departments? Prepare departmental trading and profit and loss accounts. Show basis for apportionment: floor area, sales value, number of employees, etc. Provide Nigerian supermarket example.",
          },
        ],
      },
      {
        id: 'section13',
        title: '13. BRANCH ACCOUNTS',
        topics: [
          {
            id: '13.1',
            title: 'Branch Accounting',
            content: [
              'Objectives of branch accounts',
              'Branch account in head office books',
              'Head office account',
              'Reconciliation of branch and head office books',
            ],
            objectives: [
              'Understand reasons for branch accounts',
              'Calculate profit or loss from branches',
              'Reconcile differences between branch and head office',
            ],
            aiPrompt: "Explain branch accounts. How does head office account for branches? Different methods: debtor system, stock and debtor system, wholesale basis. Prepare branch accounts and reconcile with head office. Provide example of Nigerian company with branches.",
          },
        ],
      },
      {
        id: 'section14',
        title: '14. JOINT VENTURE ACCOUNTS',
        topics: [
          {
            id: '14.1',
            title: 'Joint Venture Accounting',
            content: [
              'Objectives and features of joint venture',
              'Personal accounts of venturers',
              'Memorandum joint venture accounts',
            ],
            objectives: [
              'Identify objectives and features of joint venture',
              'Determine profit or loss of joint venture',
              'Determine profit or loss of each venturer',
            ],
            aiPrompt: "Explain joint venture accounts. What is a joint venture? How is it different from partnership? Prepare memorandum joint venture account and personal accounts of venturers. Show profit sharing. Provide Nigerian construction joint venture example.",
          },
        ],
      },
      {
        id: 'section15',
        title: '15. PARTNERSHIP ACCOUNTS',
        topics: [
          {
            id: '15.1',
            title: 'Partnership Accounting',
            content: [
              'Formation of partnership',
              'Profit or loss account',
              'Appropriation account',
              'Partners current and capital accounts',
              'Treatment of goodwill',
              'Admission/retirement of a partner',
              'Dissolution of partnership',
              'Conversion to a company',
            ],
            objectives: [
              'Understand procedures for formation',
              'Identify accounts maintained',
              'Determine effects of admission and retirement',
              'Determine profit/loss on revaluation',
              'Determine partners\' share on dissolution',
            ],
            aiPrompt: "Explain partnership accounts. How to form a partnership? Prepare profit and loss appropriation account, partners\' capital and current accounts. Handle goodwill on admission/retirement. Revaluation of assets. Dissolution of partnership. Conversion to company. Provide Nigerian partnership example.",
          },
        ],
      },
      {
        id: 'section16',
        title: '16. COMPANY ACCOUNTS',
        topics: [
          {
            id: '16.1',
            title: 'Company Accounting',
            content: [
              'Formation and classification of companies',
              'Issue of shares and debentures',
              'Final accounts of companies',
              'Accounting ratios',
              'Capital and revenue reserves',
            ],
            objectives: [
              'Differentiate between types of companies',
              'Identify procedures for issue of shares and debentures',
              'Compute elements of final accounts',
              'Compute and interpret accounting ratios',
            ],
            aiPrompt: "Explain company accounts. Types of companies in Nigeria. Issue of shares: at par, premium, discount. Prepare company final accounts. Calculate and interpret ratios: current ratio, acid test ratio, stock turnover. Differentiate capital and revenue reserves. Provide Nigerian company example.",
          },
        ],
      },
      {
        id: 'section17',
        title: '17. PUBLIC SECTOR ACCOUNTING',
        topics: [
          {
            id: '17.1',
            title: 'Government Accounting',
            content: [
              'Comparison of cash and accrual basis',
              'Sources of government revenue',
              'Capital and recurrent expenditure',
              'Consolidated Revenue Fund',
              'Statement of assets and liabilities',
              'Responsibilities of officials',
              'Instruments of financial regulation',
            ],
            objectives: [
              'Differentiate public and private sector accounting',
              'Identify sources of government revenue',
              'Differentiate capital and recurrent expenditure',
              'Calculate consolidated revenue fund',
              'Identify duties of officials',
              'Distinguish elements of control',
            ],
            aiPrompt: "Explain public sector accounting in Nigeria. Cash vs accrual basis. Sources of government revenue. Capital vs recurrent expenditure. Consolidated Revenue Fund. Duties of Accountant General, Auditor General, Minister of Finance, Local Government Treasurer. Instruments: warrant, votes, budget, due process certificate.",
          },
        ],
      },
      {
        id: 'section18',
        title: '18. INFORMATION TECHNOLOGY IN ACCOUNTING',
        topics: [
          {
            id: '18.1',
            title: 'IT in Accounting',
            content: [
              'Manual vs computerized systems',
              'Procedures in data processing',
              'Computer hardware and software',
              'Advantages and disadvantages',
            ],
            objectives: [
              'Differentiate manual and computerized systems',
              'Identify procedures in data processing',
              'Relate computer components',
              'Identify advantages and disadvantages',
            ],
            aiPrompt: "Explain IT in accounting. Compare manual and computerized accounting systems. Data processing cycle. Computer hardware and software for accounting. Advantages: speed, accuracy, reports. Disadvantages: cost, training, security. Popular accounting software in Nigeria. Future trends.",
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
        AsyncStorage.getItem('accounts_ai_explanations'),
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
    const systemPrompt = 'You are an expert Accounting tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown.';
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
      await AsyncStorage.setItem('accounts_ai_explanations', JSON.stringify(updated));
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
      const prompt = `As an Accounting tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important steps
4. Include relevant formulas and calculations using \`code blocks\` for equations
5. Give practical applications with Nigerian business examples
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice problem at the end with ✅ solution
8. Use Nigerian context (Naira amounts, local businesses, Nigerian accounting standards)

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- \`code blocks\` for calculations
- Tables for comparisons
- Clear section separation

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
              content: 'You are an expert Accounting tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples with calculations and format your response in markdown with proper headings and bullet points.'
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
              await AsyncStorage.removeItem('accounts_ai_explanations');
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
        <Icon name="account-balance" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>PRINCIPLES OF ACCOUNTS</Text>
          <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        {isPremiumActivated && aiLimit > 0 ? (
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
          <Icon name="calculate" size={16} color="#9c27b0" />
          <Text style={styles.tipText}>Includes calculations and worked examples</Text>
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
                    Generating AI explanation with calculations...
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
    marginBottom:35,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 30,
    marginLeft: -110
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
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 0,
    marginTop: -50,
  },
  aiLimitHeaderText: {
    color: '#a8cab0ff',
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

export default PrinciplesOfAccountsSyllabusScreen;