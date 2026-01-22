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

const FrenchSyllabusScreen = () => {
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

  // French Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Assess written comprehension in French',
          'Apply the principles governing the structure and use of written French',
          'Identify how French sounds work in speech production',
          'Examine the culture of Francophone West Africa and France in relation (where possible) to home country',
        ],
      },
      {
        id: 'part1',
        title: 'PART I: WRITTEN COMPREHENSION IN FRENCH',
        topics: [
          {
            id: '1.1',
            title: 'Comprehension Topics',
            content: [
              'Topics of general and emergent interest',
              'Love, life, death, politics, marriage, health, communication',
              'Child trafficking, autism, travel, corruption, money-laundering',
            ],
            objectives: [
              'Deduce answers to questions on content, intent and style of texts',
              'Apply reasoning skills',
            ],
            aiPrompt: "Explain French reading comprehension strategies for UTME. Cover how to approach texts on various topics including social issues like child trafficking, health topics, and contemporary issues. Include sample comprehension questions and answer techniques. Provide French vocabulary lists for common topics.",
          },
        ],
      },
      {
        id: 'part2',
        title: 'PART II: GRAMMAR AND STRUCTURE OF FRENCH',
        topics: [
          {
            id: '2.1',
            title: 'Basic Form Classes - Nouns',
            content: [
              'Simple and compound nouns',
              'Singular and plural forms',
              'Masculine and feminine genders',
            ],
            objectives: [
              'Identify and use different types of nouns',
              'Apply gender and number agreement rules',
            ],
            aiPrompt: "Explain French nouns: simple vs compound nouns, gender determination (masculine/feminine), plural formation rules. Include common patterns and exceptions. Provide Nigerian French learners' common mistakes and how to avoid them.",
          },
          {
            id: '2.2',
            title: 'Basic Form Classes - Pronouns',
            content: [
              'Personal pronouns (je, tu, il/elle, nous, vous, ils/elles)',
              'Impersonal pronouns (il, on)',
              'Demonstrative pronouns (celui, celle, ceux, celles)',
              'Possessive pronouns (le mien, la tienne, les nôtres)',
              'Relative pronouns (qui, que, dont, où)',
            ],
            objectives: [
              'Identify and use different types of pronouns',
              'Apply pronoun agreement rules',
            ],
            aiPrompt: "Explain French pronouns comprehensively. Cover: subject pronouns, object pronouns (direct/indirect), reflexive pronouns, demonstrative, possessive, and relative pronouns. Include pronoun placement rules and agreement. Provide examples with Nigerian context.",
          },
          {
            id: '2.3',
            title: 'Basic Form Classes - Verbs',
            content: [
              'Reflexive and non-reflexive verbs',
              'Verb moods: indicative, subjunctive, conditional, imperative',
              'Verb tenses: present, past (passé composé, imparfait), future',
              'Tense usage except: imparfait du subjonctif, passé composé du subjonctif, plus-que-parfait du subjonctif',
            ],
            objectives: [
              'Conjugate verbs in all required tenses',
              'Use appropriate verb moods',
              'Distinguish between reflexive and non-reflexive verbs',
            ],
            aiPrompt: "Explain French verb system for UTME. Cover: regular and irregular verb conjugations in all required tenses. Discuss reflexive vs non-reflexive verbs. Explain verb moods usage. Include common verbs essential for Nigerian French learners.",
          },
          {
            id: '2.4',
            title: 'Basic Form Classes - Adjectives',
            content: [
              'Qualifying adjectives (grand, petit, beau)',
              'Possessive adjectives (mon, ton, son)',
              'Interrogative adjectives (quel, quelle)',
              'Demonstrative adjectives (ce, cet, cette)',
              'Indefinite adjectives (nul, chaque, plusieurs)',
              'Numeral adjectives: cardinal (dix) and ordinal (dixième)',
            ],
            objectives: [
              'Identify and use different types of adjectives',
              'Apply adjective agreement rules',
            ],
            aiPrompt: "Explain French adjectives: types, agreement rules (gender/number), position. Cover irregular adjectives (beau, nouveau, vieux), comparative and superlative forms. Provide practice exercises for Nigerian learners.",
          },
          {
            id: '2.5',
            title: 'Basic Form Classes - Adverbs',
            content: [
              'Formation with -ment (lentement)',
              'Formation with preposition + noun (par avion, à cheval, en voiture)',
              'Special forms: bien, vite, mal, mieux, le mieux, pire, le pis, ne…que',
              'Types: manner, purpose, cause/consequence, concession, place, time',
            ],
            objectives: [
              'Form and use different types of adverbs',
              'Place adverbs correctly in sentences',
            ],
            aiPrompt: "Explain French adverbs: formation rules, types, and usage. Cover adverb placement, comparative forms, and special adverbs. Include common mistakes by Nigerian French learners and corrections.",
          },
          {
            id: '2.6',
            title: 'Basic Form Classes - Prepositions',
            content: [
              'Simple prepositions: à, de, avec, avant, sur, dans',
              'Compound prepositions: à côté de, au milieu de',
              'Usage with geographical names, time expressions',
            ],
            objectives: [
              'Use prepositions correctly',
              'Distinguish between similar prepositions',
            ],
            aiPrompt: "Explain French prepositions comprehensively. Cover usage with places, time, verbs, and nouns. Include common prepositional phrases. Discuss Nigerian learners' common preposition errors.",
          },
          {
            id: '2.7',
            title: 'Basic Form Classes - Conjunctions',
            content: [
              'Co-ordinating conjunctions: mais, ou, et, donc, car, cependant, ne…ni',
              'Subordinating conjunctions: afin que, quoique, à condition que, pour que, parce que',
            ],
            objectives: [
              'Use conjunctions to connect ideas',
              'Apply appropriate conjunction for relationship',
            ],
            aiPrompt: "Explain French conjunctions: coordinating vs subordinating. Cover usage with indicative vs subjunctive moods. Include examples of complex sentence construction relevant to UTME.",
          },
          {
            id: '2.8',
            title: 'Basic Form Classes - Articles',
            content: [
              'Definite articles: le, la, les',
              'Indefinite articles: un, une, des',
              'Partitive articles: du, de la, des',
              'Contractions: à+le=au, à+les=aux, de+le=du, de+les=des',
            ],
            objectives: [
              'Use articles appropriately',
              'Apply contraction rules',
            ],
            aiPrompt: "Explain French articles: definite, indefinite, partitive. Cover usage rules, contractions, and when to omit articles. Include practice for Nigerian learners.",
          },
          {
            id: '2.9',
            title: 'Vocabulary Assessment',
            content: [
              'Words in contemporary contexts',
              'Meaning, use, opposites, synonyms',
              'Contextual vocabulary usage',
            ],
            objectives: [
              'Identify word meanings',
              'Use vocabulary in appropriate contexts',
              'Recognize synonyms and antonyms',
            ],
            aiPrompt: "Explain French vocabulary building for UTME. Cover: thematic vocabulary lists, word families, synonyms/antonyms. Include contemporary vocabulary relevant to Nigerian context. Provide learning strategies.",
          },
          {
            id: '2.10',
            title: 'Word Order and Sentence Structure',
            content: [
              'Affirmative sentence structure',
              'Interrogative sentence formation',
              'Imperative sentence construction',
              'Passive voice formation',
            ],
            objectives: [
              'Construct grammatically correct sentences',
              'Transform sentence types',
            ],
            aiPrompt: "Explain French sentence structure: affirmative, negative, interrogative, imperative, passive. Cover inversion questions, est-ce que, intonation questions. Provide transformation exercises.",
          },
          {
            id: '2.11',
            title: 'Language Structure Processes - Conjugation',
            content: [
              'Conjugation in all required tenses',
              'Regular and irregular verb patterns',
              'Auxiliary verb usage (être/avoir)',
            ],
            objectives: [
              'Conjugate verbs correctly',
              'Identify verb patterns',
            ],
            aiPrompt: "Explain French verb conjugation systematically. Cover: present tense patterns, past tenses (passé composé with être/avoir), imperfect, future, conditional. Include irregular verbs essential for UTME.",
          },
          {
            id: '2.12',
            title: 'Language Structure Processes - Negation',
            content: [
              'Basic negation: ne...pas',
              'Other negatives: ne...plus, ne...rien, ne...personne',
              'Combined negatives: ne...ni...ni',
              'Negative pronouns: nul ne, personne...ne, aucun...ne',
            ],
            objectives: [
              'Form negative sentences correctly',
              'Use appropriate negative expressions',
            ],
            aiPrompt: "Explain French negation comprehensively. Cover all negative forms with examples. Discuss placement of negative particles. Include common errors by Nigerian learners.",
          },
          {
            id: '2.13',
            title: 'Language Structure Processes - Agreement',
            content: [
              'Adjective-noun agreement',
              'Past participle agreement',
              'Subject-verb agreement',
            ],
            objectives: [
              'Apply agreement rules correctly',
              'Identify agreement errors',
            ],
            aiPrompt: "Explain French agreement rules: gender/number agreement, past participle agreement with être/avoir. Cover complex cases and exceptions. Provide practice exercises.",
          },
          {
            id: '2.14',
            title: 'Language Structure Processes - Pluralization',
            content: [
              'Regular plural formation',
              'Irregular plurals: cheval/chevaux, beau/beaux, bel/belle/belles',
              'Plural of compound nouns',
            ],
            objectives: [
              'Form plurals correctly',
              'Identify irregular plurals',
            ],
            aiPrompt: "Explain French plural formation rules. Cover regular patterns, irregular plurals, compound noun plurals. Include exercises for Nigerian learners.",
          },
          {
            id: '2.15',
            title: 'Language Structure Processes - Derivation',
            content: [
              'Adjective to adverb: lent → lentement',
              'Adjective to adjective: un → premier',
              'Adjective to noun: bon → bonté, riche → richesse',
              'Comparison: plus...que, moins...que, aussi...que',
              'Special forms: bon/meilleur, mauvais/pire',
            ],
            objectives: [
              'Form derived words correctly',
              'Use comparison structures',
            ],
            aiPrompt: "Explain French word derivation and comparison. Cover adjective formation, adverb formation, comparative/superlative structures. Include irregular comparisons.",
          },
          {
            id: '2.16',
            title: 'Set Expressions and Speech Acts',
            content: [
              'Proverbs: tel père tel fils, petit à petit l\'oiseau fait son nid',
              'Idioms: avoir une faim de loup, crier sur le toit',
              'Conventional expressions: enchanté, c\'est dommage, stationnement interdit',
              'Figures of speech: metaphor, simile, hyperbole',
              'Speech acts: proposer, conseiller, regretter, admirer',
            ],
            objectives: [
              'Complete common proverbs and idioms',
              'Deduce meanings of expressions',
              'Use expressions appropriately',
            ],
            aiPrompt: "Explain French idioms, proverbs, and expressions for UTME. Cover common French sayings, their meanings, and usage. Include speech acts and figurative language. Provide Nigerian-French cultural comparisons.",
          },
        ],
      },
      {
        id: 'part3',
        title: 'PART III: FRENCH PHONETICS AND SOUNDS',
        topics: [
          {
            id: '3.1',
            title: 'French Phonetics',
            content: [
              'Sound discrimination: tout/tu, fais/fée',
              'Letter-sound correspondence: ai-/e/, eau-/o/',
              'Syllabification: con/ten/te/ment',
              'Liaison: trois animaux, des enfants',
              'Sense groups in reading',
              'Faux amis (false friends): librairie/library, rester/to rest',
              'Sound similarity: maison/saison, dents/don',
            ],
            objectives: [
              'Discriminate between French sounds',
              'Deduce meanings from sound combinations',
              'Use phonetic knowledge for effective communication',
              'Assess sound groupings affected by features',
            ],
            aiPrompt: "Explain French phonetics for UTME. Cover: sound discrimination, pronunciation rules, liaison, elision, syllabification. Discuss false friends (faux amis) and homophones. Include pronunciation exercises for Nigerian learners.",
          },
        ],
      },
      {
        id: 'part4',
        title: 'PART IV: FRENCH CULTURE AND CIVILIZATION',
        topics: [
          {
            id: '4.1',
            title: 'Francophone Culture',
            content: [
              'Educational systems in Francophone Africa and France',
              'Socio-economic life',
              'Political organization',
              'Cultural life: greetings, dressing, food, leisure',
              'Marriage customs, festivals, arts, professions',
              'Comparison with Nigerian culture',
            ],
            objectives: [
              'Identify features of Francophone culture',
              'Compare with Nigerian culture',
              'Apply reasoning skills to cultural analysis',
            ],
            aiPrompt: "Explain Francophone culture for UTME. Cover: French and Francophone African cultures, with comparison to Nigeria. Include: education systems, social customs, festivals, arts, daily life. Discuss cultural similarities and differences.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Adeleke,J.(2018) A Short French Grammar, 5th Edition',
          'Adeniyi,E.A (2006) Contes NIGERIANS II Revised Edition',
          'Ajiboye, T. (2014) Companion to French Grammar (4th Edition)',
          'Ajiboye, T. (2012) Nouvel Horizon, Book 4, New Revised Edition',
          'Hatier (1980) Le Nouveau Bescherelle: L\'Art de Conjuguer',
          'Maice et Merlo (1998) Grammaire progressive du français (Niveau intermédiaire)',
          'Mazauric et Sirejols (2006) On y va! Book 3',
          'Ojo, S. A.(2000) A Comprehensive Revision Handbook of French Grammar',
          'Ajiboye, T. (2010) An Introduction to Practice in Oral French',
          'Girod R and Grand-Clement, F. (1979) Comment vivent les Français',
          'Mbuko, L. (2000) French Essays on Culture and Civilisation for Schools and Colleges',
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
        AsyncStorage.getItem('french_ai_explanations'),
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
    const systemPrompt = 'You are an expert French language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with examples and Nigerian context. Use proper French terminology. Format in markdown with French examples.';
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
      await AsyncStorage.setItem('french_ai_explanations', JSON.stringify(updated));
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
      `Vous avez ${currentLimit.toLocaleString()} caractères AI restants.\n\nMinimum requis pour l'analyse AI: 1 000 caractères\n\nVeuillez acheter plus de crédits pour continuer à utiliser l'assistance AI.`,
      [
        { text: "OK", style: "cancel" },
        { 
          text: "Acheter des Crédits", 
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered French language explanations.',
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
        'Pas de Connexion Internet',
        'Vous avez besoin d\'une connexion internet pour utiliser les fonctionnalités AI.'
      );
      return;
    }

    // Check if user is logged in
    if (!userInfo?.userId) {
      Alert.alert(
        'Connexion Requise',
        'Vous devez être connecté pour utiliser les fonctionnalités AI.'
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
      Alert.alert("Erreur d'Abonnement", limitCheck.message || "Impossible de vérifier l'abonnement.");
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
      const prompt = `As a French language expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for French Language:
1. Start with a clear definition in ## H2 heading
2. Use French examples with English translations
3. Explain grammar rules with Nigerian learner context
4. Include pronunciation guides where relevant
5. Highlight key learning points with **bold**
6. Provide comparative analysis with English where helpful
7. Include cultural context for Nigerian learners
8. Provide practice exercises with solutions
9. Include common errors by Nigerian French learners

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key French terms
- Use > for important rules or exceptions
- Include French examples with translations
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on practical French usage for Nigerian learners.`;

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
              content: 'You are an expert French language tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with examples and Nigerian context. Use proper French terminology. Format in markdown with French examples.'
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
            "Crédits AI Utilisés",
            `${usage.totalChars.toLocaleString()} caractères déduits\nRestant: ${deductionResult.aiLimit.toLocaleString()}`,
            [{ text: "OK" }]
          );
        } else if (!deductionResult.success) {
          Alert.alert(
            "Erreur d'Utilisation",
            deductionResult.message || "Échec de la déduction des crédits AI."
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
        'Erreur',
        'Échec de l\'explication AI. Veuillez vérifier votre connexion internet et réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setAiLoadingTopics(prev => ({ ...prev, [topic.id]: false }));
    }
  };

  const clearAllExplanations = async () => {
    Alert.alert(
      'Effacer Toutes les Explications',
      'Cela supprimera toutes les explications AI sauvegardées. Continuer?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('french_ai_explanations');
              setAiExplanations({});
              Alert.alert('Succès', 'Toutes les explications de français effacées');
            } catch (error) {
              Alert.alert('Erreur', 'Échec de l\'effacement des explications');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "language" : "lock"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'Notes AI' : isPremiumActivated ? 'AI Expliquer' : 'Verrouillé'}
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
            color="#0055A4" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#0055A4" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#0055A4" style={styles.bulletIcon} />
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
                        color="#EF4135" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#0055A4" />
                              <Text style={styles.subsectionTitle}>Sujets Couverts:</Text>
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
                              <Icon name="school" size={16} color="#0055A4" />
                              <Text style={styles.subsectionTitle}>Objectifs d'Apprentissage:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#EF4135" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionTitle}>Débloquer les Fonctionnalités Premium</Text>
            <Text style={styles.subscriptionSubtitle}>Accéder aux Explications AI en Français</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0055A4" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Explications AI en Français</Text>
                <Text style={styles.featureDescription}>Obtenez des explications détaillées avec contexte nigérian</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0055A4" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Grammaire et Vocabulaire</Text>
                <Text style={styles.featureDescription}>Couverture complète de la grammaire française</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0055A4" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Prononciation et Phonétique</Text>
                <Text style={styles.featureDescription}>Guides de prononciation avec audio</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#0055A4" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Culture Francophone</Text>
                <Text style={styles.featureDescription}>Contexte culturel pour apprenants nigérians</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Plan Premium</Text>
              <Text style={styles.pricingAmount}>₦2,500 / mois</Text>
              <Text style={styles.pricingNote}>Inclut des crédits AI pour les études de français</Text>
            </View>
          </View>

          <View style={styles.subscriptionFooter}>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.cancelButton]}
              onPress={() => setSubscriptionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.activateButton]}
              onPress={activatePremium}
            >
              <Icon name="lock-open" size={20} color="white" />
              <Text style={styles.activateButtonText}>Activer Premium</Text>
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
          <Icon name="language" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>FRANÇAIS</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>French Language & Francophone Culture</Text>
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
            <Text style={styles.clearButtonText}>Effacer AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color="#0055A4" />
            <Text style={styles.infoTitle}>Comment Utiliser Ce Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#0055A4" />
              <Text style={styles.tipText}>Touchez les sujets pour développer/réduire le contenu</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "language" : "lock"} size={16} color={isPremiumActivated ? "#EF4135" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Expliquer pour analyse détaillée' : 'Débloquez premium pour explications AI'}
              </Text>
            </View>
            {isPremiumActivated && aiLimit > 0 && (
              <View style={styles.tipItem}>
                <Icon name="bar-chart" size={16} color="#2196f3" />
                <Text style={styles.tipText}>
                  {aiLimit.toLocaleString()} caractères AI restants
                </Text>
              </View>
            )}
            <View style={styles.tipItem}>
              <Icon name="save" size={16} color="#2196f3" />
              <Text style={styles.tipText}>Les explications AI sont enregistrées pour utilisation hors ligne</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="translate" size={16} color="#0055A4" />
              <Text style={styles.tipText}>Inclut le contexte francophone et culturel pour apprenants nigérians</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} sujets ont des notes AI sauvegardées
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
                <Icon name="language" size={20} color="#0055A4" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Explication AI
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
                  <ActivityIndicator size="large" color="#0055A4" />
                  <Text style={styles.loadingText}>
                    Génération de l'explication AI avec contexte français...
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
                <Icon name="share" size={20} color="#0055A4" />
                <Text style={styles.modalActionText}>Partager</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Sauvegardé', 'Explication AI sauvegardée avec succès!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Sauvegarder Notes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Subscription Modal */}
      {renderSubscriptionModal()}
      
      {/* AI Limit Checking Indicator */}
      {isCheckingLimit && (
        <View style={styles.checkingLimitPopup}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.checkingLimitText}>Vérification des crédits AI...</Text>
        </View>
      )}
    </View>
  );
};

// Markdown styles for French
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
    color: '#003399',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0055A4',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4135',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#003399',
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
    borderColor: '#B0C4DE',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F0F8FF',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B0C4DE',
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
    color: '#0055A4',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#0055A4',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#0055A4',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 4,
    borderLeftColor: '#0055A4',
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
    backgroundColor: '#0055A4',
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
    color: '#0055A4',
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
    color: '#003399',
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
    borderColor: '#B0C4DE',
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
    color: '#0055A4',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4135',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#003399',
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
    color: '#0055A4',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#0055A4',
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
    color: '#0055A4',
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
    borderColor: '#0055A4',
  },
  saveButton: {
    backgroundColor: '#0055A4',
    borderColor: '#0055A4',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0055A4',
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
    backgroundColor: '#0055A4',
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
    color: '#0055A4',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0055A4',
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
    backgroundColor: '#0055A4',
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
    backgroundColor: "rgba(0, 85, 164, 0.9)",
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

export default FrenchSyllabusScreen;