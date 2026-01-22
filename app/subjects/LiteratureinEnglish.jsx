// LiteratureSyllabusScreen.js
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

const LiteratureSyllabusScreen = () => {
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

  // Literature in English Syllabus Data from PDF
  const literatureSyllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Stimulate and sustain interest in Literature in English',
          'Create awareness of general principles of Literature and language functions',
          'Appreciate literary works of all genres across all cultures',
          'Apply literature knowledge to understand cultural, political and economic activities',
        ],
      },
      {
        id: 'section1',
        title: '1. DRAMA',
        topics: [
          {
            id: 'D1',
            title: 'Types of Drama',
            content: [
              'Tragedy',
              'Comedy',
              'Tragicomedy',
              'Melodrama',
              'Farce',
              'Opera',
            ],
            objectives: [
              'Identify various types of drama',
              'Analyze contents of different drama types',
              'Compare and contrast features of drama types',
            ],
            aiPrompt: "Explain each type of drama with examples. What defines tragedy? (e.g., Shakespeare's Hamlet). Comedy characteristics. Tragicomedy blend. Compare Greek tragedy vs modern tragedy. Nigerian examples: Wole Soyinka's plays. Key elements that differentiate each type.",
          },
          {
            id: 'D2',
            title: 'Dramatic Techniques',
            content: [
              'Characterization',
              'Dialogue',
              'Flashback',
              'Mime',
              'Costume',
              'Music/Dance',
              'Décor/scenery',
              'Acts/Scenes',
              'Soliloquy/aside',
              'Figures of Speech',
            ],
            objectives: [
              'Demonstrate knowledge of dramatic techniques',
              'Differentiate styles of selected playwrights',
              'Analyze stage directions in prescribed texts',
            ],
            aiPrompt: "Explain dramatic techniques with examples from prescribed texts. How does characterization develop in drama? Purpose of soliloquy vs aside. Use of flashback in plays. Importance of costume and scenery. Figures of speech in dramatic dialogue. Compare Soyinka's style with Osborne's.",
          },
          {
            id: 'D3',
            title: 'Interpretation of Prescribed Texts',
            content: [
              'Theme analysis',
              'Plot identification',
              'Socio-political context',
              'Setting (spatial and temporal)',
              'Application to social reality',
            ],
            objectives: [
              'Determine theme of prescribed texts',
              'Identify plot structure',
              'Relate plays to social reality',
              'Identify setting and period',
            ],
            aiPrompt: "Analyze 'The Lion and the Jewel' by Wole Soyinka. Themes: tradition vs modernity. Plot summary. Socio-political context: post-colonial Nigeria. Setting: Ilujinle village. Relate to contemporary Nigerian society. Compare with 'Look Back in Anger' by John Osborne.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. PROSE',
        topics: [
          {
            id: 'P1',
            title: 'Types of Prose',
            content: [
              'Fiction: Novel, Novella, Short Story',
              'Non-fiction: Biography, Autobiography, Memoir',
              'Faction: Combination of fact and fiction',
            ],
            objectives: [
              'Differentiate between types of novel',
              'Identify category of prescribed texts',
              'Analyze components of each prose type',
              'Identify balance in faction',
            ],
            aiPrompt: "Define each prose type with examples. Novel vs novella vs short story differences. Characteristics of biography vs autobiography. What is faction? Examples in literature. Categorize prescribed texts: 'Unexpected Joy at Dawn', 'Second Class Citizen', 'Wuthering Heights'.",
          },
          {
            id: 'P2',
            title: 'Narrative Techniques/Devices',
            content: [
              'Point of View: Omniscient, First Person, Second, Third, Stream of Consciousness, Epiphany',
              'Characterization: Round, flat, foil, hero, antihero, villain, heroine',
              'Language: Grammar, diction, clarity of expression',
            ],
            objectives: [
              'Identify narrative techniques in prescribed texts',
              'Determine authors narrative style',
              'Distinguish character types',
            ],
            aiPrompt: "Explain narrative techniques with examples. How point of view affects storytelling? Stream of consciousness in modern literature. Character types: round (complex) vs flat (simple). Hero vs antihero. Analyze narrative style in 'Wuthering Heights'. Diction analysis in prescribed texts.",
          },
          {
            id: 'P3',
            title: 'Textual Analysis of Prose',
            content: [
              'Theme analysis',
              'Plot identification',
              'Setting (temporal/spatial)',
              'Socio-political context',
            ],
            objectives: [
              'Determine thematic preoccupation',
              'Indicate plot structure',
              'Identify setting and period',
              'Relate texts to social reality',
            ],
            aiPrompt: "Analyze 'Second Class Citizen' by Buchi Emecheta. Themes: gender, immigration, identity. Plot summary. Setting: Nigeria and London. Socio-political context: post-colonial Nigeria, racism in UK. Relate to modern immigration issues. Feminist perspective analysis.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. POETRY',
        topics: [
          {
            id: 'PO1',
            title: 'Types of Poetry',
            content: [
              'Sonnet',
              'Ode',
              'Lyrics',
              'Elegy',
              'Ballad',
              'Panegyric',
              'Epic',
              'Blank Verse',
            ],
            objectives: [
              'Identify different types of poetry',
              'Identify distinctive features of poetic types',
            ],
            aiPrompt: "Explain each poetry type with examples. Sonnet: 14 lines, Shakespearean vs Petrarchan. Ode: praise poem. Elegy: mourning poem. Ballad: narrative folk song. Epic: long heroic poem. Blank verse: unrhymed iambic pentameter. Identify types in prescribed poems.",
          },
          {
            id: 'PO2',
            title: 'Poetic Devices',
            content: [
              'Imagery',
              'Sound: Rhyme, Rhythm, Repetition, Pun, Onomatopoeia',
              'Diction',
              'Persona',
            ],
            objectives: [
              'Determine devices used by various poets',
              'Show how devices create aesthetic effect',
              'Identify figures of speech',
              'Show how devices convey meaning',
            ],
            aiPrompt: "Analyze poetic devices in prescribed poems. Imagery in 'Black Woman' by Senghor. Rhyme and rhythm in 'The Good Morrow'. Diction analysis in 'Caged Bird'. Persona identification. Figures of speech: metaphor, simile, personification. How devices enhance theme and mood.",
          },
          {
            id: 'PO3',
            title: 'Poetry Appreciation',
            content: [
              'Thematic preoccupation',
              'Socio-political relevance',
              'Style analysis',
            ],
            objectives: [
              'Deduce poets thematic preoccupation',
              'Appraise poetry as art with moral values',
              'Apply lessons to social reality',
            ],
            aiPrompt: "Appreciate prescribed poems. Thematic analysis of 'The Leader and the Led'. Socio-political relevance of 'The Grieved Lands'. Style of Niyi Osundare vs Maya Angelou. Moral values in poetry. How poems reflect African experience. Relate to contemporary Nigerian society.",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. GENERAL LITERARY PRINCIPLES',
        topics: [
          {
            id: 'GL1',
            title: 'Literary Terms',
            content: [
              'Foreshadowing, Suspense, Theatre',
              'Monologue, Dialogue, Soliloquy',
              'Symbolism, Protagonist, Antagonist',
              'Figures of Speech',
              'Satire, Stream of Consciousness',
              'Synecdoche, Metonymy',
            ],
            objectives: [
              'Identify literary terms specific to genres',
              'Identify areas of overlap across genres',
            ],
            aiPrompt: "Define and explain key literary terms. Foreshadowing examples in literature. Symbolism in drama, prose and poetry. Difference: synecdoche vs metonymy. Stream of consciousness technique. Figures of speech across genres. How terms enhance literary analysis.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. LITERARY APPRECIATION',
        topics: [
          {
            id: 'LA1',
            title: 'Unseen Passages Analysis',
            content: [
              'Unseen extracts from Drama, Prose and Poetry',
              'Identification of literary devices',
              'Interpretation of passages',
              'Relation to life experiences',
            ],
            objectives: [
              'Identify literary devices in given passages',
              'Provide interpretation of extracts',
              'Relate extracts to true life experiences',
            ],
            aiPrompt: "How to analyze unseen passages? Step-by-step approach. Identify devices quickly. Interpretation techniques. Context clues analysis. Relating to personal experience. Practice with sample passages. Time management strategies for exams.",
          },
        ],
      },
      {
        id: 'section6',
        title: 'PRESCRIBED TEXTS',
        topics: [
          {
            id: 'PT1',
            title: 'Drama Prescriptions',
            content: [
              'African: Wole Soyinka - The Lion and the Jewel',
              'Non-African: John Osborne - Look Back in Anger',
            ],
            objectives: [
              'Detailed analysis of prescribed plays',
              'Comparative study',
              'Contextual understanding',
            ],
            aiPrompt: "Detailed analysis of 'The Lion and the Jewel'. Plot, characters, themes, dramatic techniques. Post-colonial themes. Comparison with 'Look Back in Anger'. Social contexts: 1950s Britain vs post-colonial Africa. Character analysis: Lakunle vs Jimmy Porter. Cultural conflicts.",
          },
          {
            id: 'PT2',
            title: 'Prose Prescriptions',
            content: [
              'African: Alex Agyei-Agyir - Unexpected Joy at Dawn',
              'African: Buchi Emecheta - Second Class Citizen',
              'Non-African: Emily Brontë - Wuthering Heights',
            ],
            objectives: [
              'Comprehensive novel analysis',
              'Thematic exploration',
              'Character development study',
            ],
            aiPrompt: "Analyze 'Unexpected Joy at Dawn': themes of hope, displacement. 'Second Class Citizen': feminist perspective, immigration. 'Wuthering Heights': Gothic elements, love and revenge. Compare African vs European novel traditions. Narrative techniques in each. Social commentary.",
          },
          {
            id: 'PT3',
            title: 'Poetry Prescriptions',
            content: [
              'African: Senghor, Osundare, Neto, Sesay, Wosomu, Chibuike',
              'Non-African: Donne, Angelou, Elliot, Lawrence',
            ],
            objectives: [
              'Poem-by-poem analysis',
              'Poetic devices identification',
              'Thematic connections',
            ],
            aiPrompt: "Analyze each prescribed poem. 'Black Woman' by Senghor: Negritude movement. 'The Leader and the Led' by Osundare: political commentary. 'Caged Bird' by Angelou: freedom theme. 'The Good Morrow' by Donne: metaphysical poetry. Compare African and non-African poetic traditions.",
          },
        ],
      },
      {
        id: 'section7',
        title: 'RECOMMENDED TEXTS & RESOURCES',
        topics: [
          {
            id: 'RT1',
            title: 'Anthologies',
            content: [
              'Of shadows and Rainbows (PEN Nigeria)',
              'The Penguin Book of English Verse',
              'New Poetry from Africa',
              'Oxford Anthology of English Literature',
              'Camouflage (New Nigerian writers)',
              'A Selection of African Poetry',
              'Poems of Black Africa',
            ],
            objectives: [
              'Familiarity with recommended anthologies',
              'Understanding their significance',
              'Using them for broader literary exposure',
            ],
            aiPrompt: "Overview of recommended anthologies. Importance of 'Poems of Black Africa' edited by Soyinka. 'A Selection of African Poetry' for African literature study. How to use anthologies for exam preparation. Key poems to focus on. Building literary appreciation skills.",
          },
          {
            id: 'RT2',
            title: 'Critical Texts',
            content: [
              "Abrams: A Glossary of Literary Terms",
              "Emeaba: A Dictionary of Literature",
              "Murphy: Understanding Unseen",
            ],
            objectives: [
              'Using critical texts for deeper understanding',
              'Mastering literary terminology',
              'Improving unseen passage analysis',
            ],
            aiPrompt: "How to use 'A Glossary of Literary Terms' effectively. Key terms from Abrams for UTME. Emeaba's dictionary for African literature context. Murphy's approach to unseen passages. Study strategies with critical texts. Building analytical skills.",
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
        AsyncStorage.getItem('literature_ai_explanations'),
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
    const systemPrompt = 'You are an expert literature tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with emphasis on African and European literary traditions. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and literary analysis.';
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
      await AsyncStorage.setItem('literature_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered literature analysis with clear examples.',
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
      const prompt = `As a literature tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide examples from prescribed texts (African and non-African)
4. Include literary analysis with quotations where relevant
5. Give Nigerian/African context for African literature
6. Highlight common mistakes in literary analysis with ❌ emoji
7. Provide practice analysis exercise at the end with ✅ solution
8. Connect to social reality and contemporary issues

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- *Italics* for book titles and quotations
- \`code blocks\` for literary terms
- Tables if helpful for comparison
- Clear section separation

Make it engaging and educational for JAMB literature preparation.`;

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
              content: 'You are an expert literature tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with emphasis on African and European literary traditions. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and literary analysis.'
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
              await AsyncStorage.removeItem('literature_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All literature explanations cleared');
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
              name={isSaved ? "auto-awesome" : "menu-book"} 
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
        <Icon name="menu-book" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>LITERATURE IN ENGLISH</Text>
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
        <Icon name="info" size={20} color="#1976d2" />
        <Text style={styles.infoTitle}>How to Use Literature Syllabus</Text>
      </View>
      <View style={styles.infoContent}>
        <View style={styles.tipItem}>
          <Icon name="touch-app" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name={"menu-book"} size={16} color={isPremiumActivated ? "#ff9800" : "#999"} />
          <Text style={styles.tipText}>
            {isPremiumActivated ? 'AI Explain for literary analysis' : 'Activate premium for AI explanations'}
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
          <Text style={styles.tipText}>AI literature analyses saved offline</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="import-contacts" size={16} color="#1976d2" />
          <Text style={styles.tipText}>Covers Drama, Prose, Poetry & Prescribed Texts</Text>
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
            color="#1976d2" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
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
                        color="#1565c0" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        <View style={styles.subsection}>
                          <View style={styles.subsectionHeader}>
                            <Icon name="list" size={16} color="#1976d2" />
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
                            <Icon name="school" size={16} color="#1976d2" />
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
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        {Object.keys(aiExplanations).length} literature topics have AI notes saved
      </Text>
      <Text style={styles.footerNote}>
        {isPremiumActivated ? `✓ Premium Activated • ${aiLimit.toLocaleString()} AI chars • ` : ''}
        Based on UTME Literature Syllabus • Powered by DeepSeek AI
      </Text>
      <Text style={styles.footerCopyright}>
        © Covers Drama, Prose, Poetry & Prescribed African/Non-African Texts
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

        {literatureSyllabusData.sections.map(section => renderSection(section))}

        {renderFooter()}
      </ScrollView>

      {/* AI Explanation Modal */}
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
                <Icon name="menu-book" size={20} color="#ff9800" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Literature AI Analysis
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
                  <ActivityIndicator size="large" color="#1976d2" />
                  <Text style={styles.loadingText}>
                    Generating literary analysis with examples...
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
                <Icon name="share" size={20} color="#1976d2" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Saved', 'Literature analysis saved successfully!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Save Literature Note
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {isCheckingLimit && (
        <View style={styles.checkingLimitPopup}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.checkingLimitText}>Checking AI credits...</Text>
        </View>
      )}
    </View>
  );
};

// Styles with literature theme colors (blue theme)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop:40,
    paddingLeft: 10,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
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
    marginTop: 35,
    marginLeft: -110,
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
    color: '#1976d2',
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
    backgroundColor: '#e3f2fd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565c0',
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
    backgroundColor: '#f5f9ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbdefb',
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
    color: '#1565c0',
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
    color: '#1976d2',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#1976d2',
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
  footerCopyright: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    fontStyle: 'italic',
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
    color: '#1565c0',
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
    borderColor: '#1976d2',
  },
  saveButton: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
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
    marginTop: -55,
    marginLeft:-30
  },
  aiLimitHeaderText: {
    color: '#b6f8c6ff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
    paddingLeft:5,
    paddingRight:5
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

// Markdown styles for literature
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1565c0',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2196f3',
    marginTop: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#1565c0',
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
    color: '#1976d2',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#1976d2',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default LiteratureSyllabusScreen;