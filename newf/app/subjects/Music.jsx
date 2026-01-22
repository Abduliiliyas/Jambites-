// MusicSyllabusScreen.js
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

const MusicSyllabusScreen = () => {
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

  // Music Syllabus Data from PDF
  const musicSyllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Appreciate and discuss music fairly and critically',
          'Identify features of different periods of Western and African music',
          'Appreciate influence of socio-cultural and technological factors on music',
          'Attain sound musical basis for further learning at tertiary level',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: RUDIMENTS OF MUSIC',
        topics: [
          {
            id: 'A1',
            title: 'The Staff and Notation',
            content: [
              'Great staff, ledger lines and spaces',
              'Open score (vocal score)',
              'C clef, alto (viola clef) and tenor clef',
            ],
            objectives: [
              'Identify all components of the staff',
              'Apply staff components in music notation',
            ],
            aiPrompt: "Explain music staff with diagrams. What are ledger lines? Compare treble, bass, alto and tenor clefs. Draw examples of each clef. How to read notes on staff? Practical exercises for identifying notes.",
          },
          {
            id: 'A2',
            title: 'Music Notes/Rests and Values',
            content: [
              'Music notes and their corresponding values',
              'Rests and their corresponding values',
              'Relative duration of different notes and rests',
            ],
            objectives: [
              'Determine relative duration of different notes',
              'Understand rests and their values',
            ],
            aiPrompt: "Explain note values: whole, half, quarter, eighth, sixteenth. Show corresponding rests. How many eighth notes equal one quarter note? Create rhythmic patterns using different note values. Examples of dotted notes and ties.",
          },
          {
            id: 'A3',
            title: 'Time Signatures and Rhythm',
            content: [
              'Simple and compound time signatures',
              'Grouping of notes correctly',
              'Barring of unbarred passages',
              'Interpretation of rhythmic patterns',
            ],
            objectives: [
              'Interpret varied rhythmic patterns',
              'Group notes correctly in different time signatures',
              'Bar unbarred musical passages',
            ],
            aiPrompt: "Explain 4/4, 3/4, 2/4 time signatures. What is compound time? 6/8 vs 3/4 difference. Group these notes in 4/4: quarter, eighth, sixteenth. Bar this unbarred melody in 3/4 time. Create rhythm in 6/8 time.",
          },
          {
            id: 'A4',
            title: 'Key Signatures and Scales',
            content: [
              'Technical names of scale degrees',
              'Diatonic major and minor scales',
              'Natural, harmonic and melodic minor',
              'Chromatic scales',
              'Determining key of music piece',
            ],
            objectives: [
              'Ascertain names of various degrees of scales',
              'Identify scale passages with/without key signature',
              'Determine key of piece (up to 2 sharps/flats)',
            ],
            aiPrompt: "Explain scale degrees: tonic, supertonic, mediant, etc. Write C major scale with technical names. Compare natural, harmonic, melodic minor. Why melodic minor different ascending vs descending? Identify key of piece with 2 sharps. Write chromatic scale from C.",
          },
          {
            id: 'A5',
            title: 'Keyboard and Enharmonic Equivalents',
            content: [
              'Keyboard setting',
              'White and black key names',
              'Enharmonic equivalents',
              'Relationship between notes',
            ],
            objectives: [
              'Identify names of white and black keys',
              'Understand enharmonic relationships',
              'Apply keyboard knowledge to notation',
            ],
            aiPrompt: "Label piano keyboard with note names. What are enharmonic equivalents? C# = Db = Bx explanation. Find enharmonic of E#. Play major scale on keyboard. Relationship between adjacent keys (half steps).",
          },
          {
            id: 'A6',
            title: 'Intervals',
            content: [
              'Diatonic and chromatic intervals',
              'Interval inversions',
              'Perfect, major, minor intervals',
              'Diminished and augmented intervals',
              'Consonant vs dissonant intervals',
            ],
            objectives: [
              'Determine qualities of intervals',
              'Identify melodic and harmonic intervals',
              'Recognize consonant and dissonant intervals',
            ],
            aiPrompt: "Define perfect unison, 4th, 5th, octave. Calculate interval from C to E (major 3rd). Invert perfect 5th (becomes perfect 4th). Why augmented 4th/diminished 5th called 'tritone'? Classify intervals as consonant/dissonant. Ear training examples.",
          },
          {
            id: 'A7',
            title: 'Musical Terms and Signs',
            content: [
              'Definition of musical terms',
              'Musical signs and symbols',
              'Abbreviations in music notation',
            ],
            objectives: [
              'Interpret simple musical signs',
              'Understand common musical terms',
            ],
            aiPrompt: "Explain common terms: tempo, dynamics, articulation. Define: allegro, piano, crescendo, staccato, legato. Musical symbols: repeat, coda, fermata, trill. Abbreviations: D.C., D.S., 8va, pizz., arco. Create score with various markings.",
          },
          {
            id: 'A8',
            title: 'Transcription and Transposition',
            content: [
              'Transcription between staff and tonic solfa',
              'Transposition using treble and bass staves',
              'Transposition within 2 sharps/flats',
            ],
            objectives: [
              'Read music in any given notation',
              'Rewrite music passage on given stave',
              'Transpose melodies correctly',
            ],
            aiPrompt: "Transcribe this staff notation to tonic solfa: C-D-E-F-G. Convert tonic solfa to staff: do-re-mi-fa-sol. Transpose melody from C major to G major. Why transposition needed for different instruments? Practical examples for singers.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: ELEMENTARY HARMONY',
        topics: [
          {
            id: 'B1',
            title: 'Triads and Inversions',
            content: [
              'Triads in major/minor keys',
              'Primary and secondary triads',
              'Triad inversions',
              'Chord indications (Roman numerals)',
            ],
            objectives: [
              'Identify different triads',
              'Compare types of triads',
              'Determine use of triads in harmony',
            ],
            aiPrompt: "Build triads on each scale degree in C major. Identify I, IV, V chords. What are inversions? Root position, 1st inversion, 2nd inversion. Roman numeral analysis: I, ii, iii, IV, V, vi, vii°. Harmonic minor triads explanation.",
          },
          {
            id: 'B2',
            title: 'Chord Progressions and Dominant 7th',
            content: [
              'Basic chord progressions in four parts',
              'Vocal style (SATB) writing',
              'Dominant 7th chord in root position',
            ],
            objectives: [
              'Determine basic chord progressions',
              'Recognize dominant 7th chord',
              'Write in SATB vocal style',
            ],
            aiPrompt: "Common chord progressions: I-IV-V-I, ii-V-I. Write progression in C major with SATB. What is dominant 7th (V7)? Resolve V7 to I. Why dominant 7th creates tension? Four-part writing rules: avoid parallel fifths/octaves.",
          },
          {
            id: 'B3',
            title: 'Types of Motion',
            content: [
              'Parallel motion',
              'Similar motion',
              'Contrary motion',
              'Oblique motion',
            ],
            objectives: [
              'Identify various kinds of motion',
              'Apply motion types in harmony',
            ],
            aiPrompt: "Define each motion type with musical examples. Two voices moving same direction same interval = parallel. Similar vs parallel difference. Write example of contrary motion. Oblique motion: one voice static. Why contrary motion preferred in harmony?",
          },
          {
            id: 'B4',
            title: 'Cadences',
            content: [
              'Perfect/full close cadence',
              'Imperfect/half close cadence',
              'Plagal/Amen cadence',
              'Interrupted/deceptive cadence',
            ],
            objectives: [
              'Identify various types of cadences',
              'Analyze cadences in musical scores',
            ],
            aiPrompt: "Explain each cadence with chord progressions. Perfect: V-I. Imperfect: ?-V. Plagal: IV-I (Amen). Deceptive: V-vi. Identify cadences in simple melody. Why cadences important for phrase endings? Ear training: recognize cadences by sound.",
          },
          {
            id: 'B5',
            title: 'Non-harmonic Tones',
            content: [
              'Neighbouring/auxiliary notes',
              'Passing tones/notes',
              'Identification and application',
              'Relationship to chords',
            ],
            objectives: [
              'Relate harmonic/non-harmonic tones',
              'Identify non-chord tones in context',
            ],
            aiPrompt: "Define non-harmonic tones. Neighbouring: step away and back. Passing: connect two chord tones by step. Identify in musical example: C-E-F-E-C (F is neighbour). Why use non-harmonic tones? Create melody with passing tones.",
          },
          {
            id: 'B6',
            title: 'Modulation',
            content: [
              'Simple diatonic modulation',
              'Modulation using melodic line',
              'Closely related keys',
              'Modulation to dominant/subdominant',
            ],
            objectives: [
              'Determine key of given melody',
              'Identify modulation in music',
              'Understand closely related keys',
            ],
            aiPrompt: "What is modulation? Example: C major to G major (dominant). Identify modulation point in melody. Circle of fifths for related keys. Why modulate? Common modulation techniques. Write simple modulation from C to F.",
          },
          {
            id: 'B7',
            title: 'Elementary Composition',
            content: [
              'Setting words to written melody',
              'Recognition of suitable musical phrases',
              'Compatible, balanced, contrasting phrases',
            ],
            objectives: [
              'Identify suitable melody for given words',
              'Recognize balanced musical phrases',
            ],
            aiPrompt: "Set these words to melody: 'Music is life'. What makes good text setting? Natural speech rhythm vs musical rhythm. Phrase structure: question-answer phrases. Compose 8-bar melody with balanced phrases. Analyze phrase structure in folk song.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: AFRICAN MUSIC HISTORY',
        topics: [
          {
            id: 'C1',
            title: 'Nigerian Folksongs',
            content: [
              'Types: cradle, folk-tales, games, war, satirical, dirges, historical, praise, worksong',
              'Forms: call and response, strophic, through-composed, antiphony',
              'Characteristics: vocal styles, scales, rhythm',
            ],
            objectives: [
              'Identify various folksongs and types',
              'Define and compare forms and features',
            ],
            aiPrompt: "Explain different folksong types with Nigerian examples. Call and response in Yoruba music. Pentatonic scales in African music. Complex rhythms: polyrhythm, cross-rhythm. Analyze structure of Nigerian folk song. Compare strophic vs through-composed.",
          },
          {
            id: 'C2',
            title: 'Nigerian Traditional Music and Arts',
            content: [
              'Festivals: Osun, Ifa, Ogun, Ekpo, Ofala, New Yam, etc',
              'Dances: Social, Ritual, Ceremonial',
              'Masquerade, Koroso, Atilogwu, Bata, etc',
            ],
            objectives: [
              'Analyze features of traditional music',
              'Differentiate festival and dance types',
            ],
            aiPrompt: "Describe Osun festival music. Instruments used in Ogun festival. Dance characteristics: Atilogwu (acrobatic), Bata (Yoruba drumming). Social vs ritual dance differences. Role of music in Nigerian festivals. Costumes and performance context.",
          },
          {
            id: 'C3',
            title: 'Nigerian Traditional Instruments',
            content: [
              'Aerophones: kakaki, algaita, oja, etc',
              'Chordophones: goge, goje, molo, etc',
              'Idiophones: ogene, ekwe, sekere, etc',
              'Membranophones: ganga, bata, dundun, etc',
            ],
            objectives: [
              'Differentiate instrument types',
              'Classify instruments into categories',
            ],
            aiPrompt: "Classify these instruments: dundun, sekere, algaita, goge. Construction of talking drum (dundun). How ogene (bell) made? Playing techniques: kakaki (trumpet), goje (fiddle). Role in ensemble. Compare Hornbostel-Sachs classification.",
          },
          {
            id: 'C4',
            title: 'African Traditional Musicians',
            content: [
              'Nigerian musicians: Sani Dan Indo, Barmani Coge, Mamman Shata, etc',
              'Other Africans: Vinoko Akpalu, Koo Nimo, etc',
              'Musical styles and contributions',
            ],
            objectives: [
              'Identify musicians and their groups',
              'Trace biographies and styles',
              'Assess contributions to music',
            ],
            aiPrompt: "Biography of Mamman Shata (Hausa musician). Musical style of Barmani Coge. Contribution of Dan Maraya Jos. Koo Nimo's palm-wine music. Social commentary in traditional music. Preservation of cultural heritage.",
          },
          {
            id: 'C5',
            title: 'African Popular Music Evolution',
            content: [
              'Genres: Highlife, Juju, Afro-beat, Fuji, Apala',
              'Reggae, Makosa, Waka, Hiplife, Hip-hop',
              'Evolution and development',
            ],
            objectives: [
              'Differentiate musical genres',
              'Examine influence on society',
            ],
            aiPrompt: "Trace evolution of Highlife from Ghana to Nigeria. Characteristics of Juju music (King Sunny Ade). Fela's Afro-beat fusion. Fuji music development. Social impact of popular music. Compare traditional vs popular music.",
          },
          {
            id: 'C6',
            title: 'African Popular Musicians',
            content: [
              'Nigerians: Fela, Sunny Ade, Ebenezer Obey, 2Face, Wizkid, etc',
              'Other Africans: Manu Dibango, Awilo, Lucky Dube, Sarkodie, etc',
              'Biographies and contributions',
            ],
            objectives: [
              'Relate musicians to their music',
              'Trace biographies and examine styles',
              'Assess developmental contributions',
            ],
            aiPrompt: "Fela Kuti: Afro-beat and activism. Sunny Ade: Juju modernization. 2Face: Nigerian hip-hop influence. Manu Dibango: Makossa international. Lucky Dube: reggae in Africa. Analyze one song by chosen artist.",
          },
          {
            id: 'C7',
            title: 'African Art Musicians',
            content: [
              'Nigerians: W.W.C. Echezona, Laz Ekwueme, Akin Euba, etc',
              'Other Africans: J.H. Kwabena Nketia, Ephraim Amu, etc',
              'Art music composition and scholarship',
            ],
            objectives: [
              'Relate musicians to their compositions',
              'Trace biographies and examine music',
              'Assess contributions to development',
            ],
            aiPrompt: "W.W.C. Echezona: pioneering Nigerian musicologist. Laz Ekwueme: choral compositions. Akin Euba: African pianism. Nketia's ethnomusicology contributions. Art music blending African/Western elements. Analysis of one art music composition.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: WESTERN MUSIC HISTORY',
        topics: [
          {
            id: 'D1',
            title: 'Western Music Periods',
            content: [
              'Medieval/Middle Age (800-1400)',
              'Renaissance (1400-1600)',
              'Baroque (1600-1750)',
              'Classical (1750-1820)',
              'Romantic (1820-1900)',
            ],
            objectives: [
              'Trace development from Medieval to Romantic',
              'Understand characteristics of each period',
            ],
            aiPrompt: "Compare Medieval Gregorian chant vs Renaissance polyphony. Baroque characteristics: ornamentation, basso continuo. Classical period: sonata form, clarity. Romantic: emotion, program music. Key composers for each period. Listening examples.",
          },
          {
            id: 'D2',
            title: 'Western Composers',
            content: [
              'Composers of different periods',
              'Their styles and contributions',
              'Famous compositions',
            ],
            objectives: [
              'Identify composers by period',
              'Assess their contributions',
            ],
            aiPrompt: "Bach (Baroque): fugues, Brandenburg Concertos. Mozart (Classical): symphonies, operas. Beethoven: transition to Romantic. Chopin: Romantic piano music. Compare Handel vs Bach. Identify period from musical excerpt.",
          },
          {
            id: 'D3',
            title: 'Music Forms and Media',
            content: [
              'Forms: Binary, Ternary, Rondo, Sonata, etc',
              'Orchestral and band instruments',
              'Human voice types and ranges',
              'Keyboard instruments',
              'Various other instruments',
            ],
            objectives: [
              'Identify forms and instruments',
              'Relate music to modern technology',
            ],
            aiPrompt: "Explain forms: A-B (binary), A-B-A (ternary), A-B-A-C-A (rondo). Orchestra sections: strings, woodwinds, brass, percussion. Voice ranges: soprano, alto, tenor, bass. Piano vs organ comparison. Modern music technology: software, digital audio.",
          },
        ],
      },
      {
        id: 'sectionE',
        title: 'SECTION E: COMPARATIVE MUSIC STUDIES',
        topics: [
          {
            id: 'E1',
            title: 'Black Musicians in Diaspora',
            content: [
              'Musicians: Bob Marley, Michael Jackson, Stevie Wonder, etc',
              'Composers and performers',
              'Global musical influences',
            ],
            objectives: [
              'Identify diaspora musicians',
              'Assess individual influences globally',
            ],
            aiPrompt: "Bob Marley: reggae and social message. Michael Jackson: pop revolution. Stevie Wonder: R&B innovation. Beyonce: contemporary R&B/pop. Their impact on global music. African roots in diaspora music.",
          },
          {
            id: 'E2',
            title: 'Musical Genres and Forms',
            content: [
              'Spirituals, gospel, jazz, R&B, soul',
              'Calypso, rock, reggae, Afro-beat',
              'Tango, rap, cha-cha, hip-hop',
              'Origins and evolution',
            ],
            objectives: [
              'Identify various musical genres',
              'Trace origins of genres',
            ],
            aiPrompt: "Jazz evolution from blues to modern. Gospel music characteristics. Reggae development from ska. Hip-hop: from Bronx to global. Afro-beat vs Afro-pop. Compare two related genres.",
          },
          {
            id: 'E3',
            title: 'Nationalism in Nigerian Music',
            content: [
              'Features of nationalist music',
              'Materials for cultural awareness',
              'Role in Nigerian nationalism',
            ],
            objectives: [
              'Identify nationalist features',
              'Assess role in cultural patriotism',
            ],
            aiPrompt: "How Nigerian composers express nationalism? Use of folk melodies. Texts promoting unity. Instruments symbolizing culture. Composers like Fela (political), Ikoli Harcourt Whyte (choral). Music during independence era.",
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
        AsyncStorage.getItem('music_ai_explanations'),
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
    const systemPrompt = 'You are an expert music tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for musical notation.';
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
      await AsyncStorage.setItem('music_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered music explanations with clear examples.',
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
      const prompt = `As a music tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 practical examples with step-by-step explanations
4. Include musical notation examples using \`code blocks\` for simple notation
5. Give Nigerian/African context where relevant
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice exercise at the end with ✅ solution
8. Include listening suggestions if applicable

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- \`code blocks\` for musical examples
- Tables if helpful
- Clear section separation

Make it engaging and educational for JAMB music preparation.`;

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
              content: 'You are an expert music tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for musical concepts.'
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
              await AsyncStorage.removeItem('music_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All music explanations cleared');
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
              name={isSaved ? "auto-awesome" : "music-note"} 
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
        <Icon name="music-note" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>MUSIC</Text>
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
        <Icon name="info" size={20} color="#9c27b0" />
        <Text style={styles.infoTitle}>How to Use Music Syllabus</Text>
      </View>
      <View style={styles.infoContent}>
        <View style={styles.tipItem}>
          <Icon name="touch-app" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name={"music-note"} size={16} color={isPremiumActivated ? "#ff9800" : "#999"} />
          <Text style={styles.tipText}>
            {isPremiumActivated ? 'AI Explain for music concepts' : 'Activate premium for AI explanations'}
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
          <Text style={styles.tipText}>AI music explanations saved offline</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="library-music" size={16} color="#9c27b0" />
          <Text style={styles.tipText}>Covers Western and African music theory</Text>
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
            color="#9c27b0" 
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
                        color="#7b1fa2" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        <View style={styles.subsection}>
                          <View style={styles.subsectionHeader}>
                            <Icon name="list" size={16} color="#9c27b0" />
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
                            <Icon name="school" size={16} color="#9c27b0" />
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
        {Object.keys(aiExplanations).length} music topics have AI notes saved
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

        {musicSyllabusData.sections.map(section => renderSection(section))}

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
                <Icon name="music-note" size={20} color="#ff9800" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Music AI Explanation
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
                  <ActivityIndicator size="large" color="#9c27b0" />
                  <Text style={styles.loadingText}>
                    Generating music explanation with examples...
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
                <Icon name="share" size={20} color="#9c27b0" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Saved', 'Music explanation saved successfully!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Save Music Note
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </View>
  );
};

// Styles with music theme colors
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
  header: {
    backgroundColor: '#9c27b0',
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
    marginTop: 30,
    marginLeft: -95,
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
    color: '#9c27b0',
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
    backgroundColor: '#f3e5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7b1fa2',
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
    backgroundColor: '#faf4ff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1bee7',
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
    color: '#7b1fa2',
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
    color: '#9c27b0',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#9c27b0',
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
    color: '#7b1fa2',
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
    borderColor: '#9c27b0',
  },
  saveButton: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9c27b0',
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

// Markdown styles for music
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7b1fa2',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9c27b0',
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ab47bc',
    marginTop: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#7b1fa2',
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
    color: '#9c27b0',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#9c27b0',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default MusicSyllabusScreen;