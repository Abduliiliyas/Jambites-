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
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Markdown from 'react-native-markdown-display';
import NetInfo from '@react-native-community/netinfo'; // Add this import
import { useNavigation, useRoute } from "@react-navigation/native";

// API Configuration
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api'; // Add your backend URL

const MathematicsSyllabusScreen = () => {
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
          'Acquire computational and manipulative skills',
          'Develop precise, logical and formal reasoning skills',
          'Develop deductive skills in interpretation of graphs, diagrams and data',
          'Apply mathematical concepts to resolve issues in daily living',
        ],
      },
      {
        id: 'section1',
        title: 'SECTION I: NUMBER AND NUMERATION',
        topics: [
          {
            id: '1.1',
            title: 'Number bases',
            content: [
              'Operations in different number bases from 2 to 10',
              'Conversion from one base to another including fractional parts',
            ],
            objectives: [
              'Perform four basic operations (×, +, -, ÷)',
              'Convert one base to another',
              'Perform operations in modulo arithmetic',
            ],
            aiPrompt: "Explain number bases with examples: Convert decimal 45 to binary and octal. Perform addition in binary: 1011 + 1101. Show step-by-step conversions between bases 2, 8, and 10.",
          },
          {
            id: '1.2',
            title: 'Fractions, Decimals, Approximations and Percentages',
            content: [
              'Fractions and decimals',
              'Significant figures',
              'Decimal places',
              'Percentage errors',
              'Simple interest',
              'Profit and loss percent',
              'Ratio, proportion and rate',
              'Shares and valued added tax (VAT)',
            ],
            objectives: [
              'Perform basic operations on fractions and decimals',
              'Express to specified number of significant figures',
              'Calculate simple interest, profit and loss per cent',
              'Solve problems involving share and VAT',
            ],
            aiPrompt: "Explain fractions, decimals, and percentages with real-world examples. Calculate 15% VAT on ₦2500. Find simple interest on ₦5000 at 8% for 3 years. Convert 3/8 to decimal and percentage. Round 0.04567 to 3 significant figures.",
          },
        ],
      },
      {
        id: 'section2',
        title: 'SECTION II: ALGEBRA',
        topics: [
          {
            id: '2.1',
            title: 'Polynomials',
            content: [
              'Change of subject of formula',
              'Multiplication and division of polynomials',
              'Factorization of polynomials',
              'Roots of polynomials',
              'Factor and remainder theorems',
              'Simultaneous equations',
              'Graphs of polynomials',
            ],
            objectives: [
              'Find subject of formula',
              'Apply factor and remainder theorem',
              'Multiply and divide polynomials',
              'Solve simultaneous equations',
              'Interpret polynomial graphs',
            ],
            aiPrompt: "Explain polynomials with examples: Factorize x³ - 2x² - 5x + 6. Solve simultaneous equations: 2x + y = 7 and x² + y = 5. Graph y = x² - 4x + 3 showing vertex and intercepts.",
          },
          {
            id: '2.2',
            title: 'Quadratic Equations',
            content: [
              'Solution by factorization',
              'Solution by completing the square',
              'Solution by formula method',
              'Nature of roots',
              'Word problems',
            ],
            objectives: [
              'Solve quadratic equations using all methods',
              'Determine nature of roots',
              'Solve real-life problems',
            ],
            aiPrompt: "Solve 2x² - 5x - 3 = 0 by all three methods. Find roots of x² + 4x + 5 = 0 and determine their nature. A rectangle has area 24cm² and perimeter 20cm. Find dimensions.",
          },
        ],
      },
      {
        id: 'section3',
        title: 'SECTION III: GEOMETRY AND TRIGONOMETRY',
        topics: [
          {
            id: '3.1',
            title: 'Euclidean Geometry',
            content: [
              'Properties of angles and lines',
              'Polygons and triangles',
              'Circle theorems',
              'Geometric constructions',
            ],
            objectives: [
              'Identify types of angles',
              'Solve polygon problems',
              'Apply circle theorems',
              'Construct special angles',
            ],
            aiPrompt: "Explain angle properties with diagrams: alternate angles, corresponding angles, vertically opposite angles. Prove sum of angles in triangle = 180°. Calculate angles in cyclic quadrilateral ABCD where ∠A = 70°, ∠B = 110°. Construct 60° angle without protractor.",
          },
          {
            id: '3.2',
            title: 'Trigonometry',
            content: [
              'Trigonometric ratios',
              'Angles of elevation and depression',
              'Bearings',
              'Sine and cosine rules',
              'Trigonometric graphs',
            ],
            objectives: [
              'Calculate trig ratios',
              'Solve bearing problems',
              'Apply sine and cosine rules',
              'Interpret trig graphs',
            ],
            aiPrompt: "Explain SOH CAH TOA with examples. A ladder leans against wall at 60° angle, length 10m. How high does it reach? From point A, bearing of B is 045°. From B, bearing of C is 135°. Find bearing of A from C. Solve triangle with sides 7cm, 8cm, 9cm.",
          },
        ],
      },
      {
        id: 'calculus',
        title: 'SECTION IV: CALCULUS',
        topics: [
          {
            id: '4.1',
            title: 'Differentiation',
            content: [
              'Limits of functions',
              'Differentiation rules',
              'Chain rule',
              'Product and quotient rules',
              'Applications to motion',
            ],
            objectives: [
              'Find limits',
              'Differentiate functions',
              'Apply to rate of change',
              'Find maxima/minima',
            ],
            aiPrompt: "Explain differentiation with examples: Differentiate y = 3x² + 2x - 5. Find derivative of (2x+1)/(x-3). A particle moves with s = t³ - 6t² + 9t. Find velocity and acceleration at t=2. Find maximum volume of open box from 12cm square sheet.",
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
        AsyncStorage.getItem('math_ai_explanations'),
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

  // Add AI limit check function
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

  // Add calculate AI usage function
  const calculateAiUsage = (prompt, aiResponse) => {
    const systemPrompt = 'You are an expert mathematics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for equations.';
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
      await AsyncStorage.setItem('math_ai_explanations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
  };

  // Add internet check function
  const checkInternetConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected;
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  };

  // Add AI limit alert
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

  // Updated handleAIButtonPress function
  const handleAIButtonPress = async (topic) => {
    // Check if premium is activated
    if (!isPremiumActivated) {
      Alert.alert(
        'Premium Feature Required',
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations based on jambites level with clear examples.',
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

  // Updated generateAIExplanation function
  const generateAIExplanation = async (topic) => {
    setSelectedTopic(topic);
    setAiLoadingTopics(prev => ({ ...prev, [topic.id]: true }));
    setIsLoading(true);

    try {
      const prompt = `As a mathematics tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important steps
4. Include relevant formulas using \`code blocks\` for equations
5. Give practical applications or real-world examples
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice problem at the end with ✅ solution
8. Use Nigerian context where applicable (prices in Naira, local examples)

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- \`code blocks\` for equations
- Tables if needed
- Clear section separation

Make it engaging and educational.`;

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
              content: 'You are an expert mathematics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for equations.'
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
              await AsyncStorage.removeItem('math_ai_explanations');
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

  // Updated renderAIButton to show AI limit
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

  // Update header to show AI limit
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerMain}>
        <Icon name="calculate" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>MATHEMATICS</Text>
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

  // Update info card to show AI limit
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

  // Update footer to show AI limit
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
                    Generating AI explanation with markdown formatting...
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

// Add new styles for AI limit
const styles = StyleSheet.create({
  // ... all existing styles remain the same ...
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
  header: {
    backgroundColor: '#3f51b5',
    padding: 20,
    paddingTop:40,
    paddingLeft:7,
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
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
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
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop:30,
    marginLeft:-95
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
    backgroundColor: '#3f51b5',
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
    backgroundColor: '#f5f7ff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#283593',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3f51b5',
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
    backgroundColor: '#3f51b5',
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
  // Add these new styles
  aiLimitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 50,
    marginTop:-40,
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

// Markdown styles remain exactly the same
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

export default MathematicsSyllabusScreen;

