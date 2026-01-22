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

// API Configuration (same as Igbo)
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api';

const HausaSyllabusScreen = () => {
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
        title: 'CIN GABAN MANHAJAR (GENERAL OBJECTIVES)',
        type: 'objectives',
        content: [
          'Samun iya karantawa da rubutawa cikin Hausa sosai (Acquire ability to read and write competently in Hausa)',
          'San siffofi na asali na harshen Hausa (syntax, phonology, morphology da semantics)',
          'San ilimin asali na adabin Hausa na baka da na rubuce (Basic knowledge of oral and written Hausa literature)',
          'Samun iya kimiyya al\'adu, al\'ada da cibiyoyin Hausawa (Appreciate Hausa culture, customs and institutions)',
          'Samun iya fassara sosai daga Turanci zuwa Hausa (Translate competently from English to Hausa)',
        ],
      },
      {
        id: 'sectionA',
        title: 'SASHE A: HARSHE (LANGUAGE)',
        topics: [
          {
            id: 'A.1',
            title: 'Ka\'idojin Rubutu (Orthography)',
            content: [
              'Tsarin haruffa (Alphabetization)',
              'Rubutun kalmomi (Spelling)',
              'Ka\'idojin hada kalmomi da raba su (Rules of word merger and division)',
              'Alamomin rubutu (Punctuation)',
              'Tsarin sakin layi (Paragraphing)',
              'Duk bisa madaidaiciyar Hausa (All in line with standard Hausa)',
            ],
            objectives: [
              'Gane ka\'idojin rubutu na Hausa (Recognize basic Hausa orthographical rules)',
              'Aiwatar da ka\'idojin rubutu na Hausa (Apply Hausa orthographical rules)',
              'Gano kurakuran harshe kamar nahawu, zabe mara kyau na kalmomi, kuskuren rubutu, da dai sauransu (Identify linguistic errors)',
            ],
            aiPrompt: "Explain Hausa orthography comprehensively. Detail alphabetization, spelling rules, word division, punctuation, and paragraphing in standard Hausa. Provide examples of correct vs incorrect spellings. Discuss common errors and how to avoid them.",
          },
          {
            id: 'A.2',
            title: 'Auna Fahimta (Comprehension)',
            content: [
              'Tambayoyi daga gajerun rubutun da ba a gani ba (Contextual questions from short unseen passages)',
              'Kimanin kalmomi 200 (About 200 words)',
              'Fahimtar ma\'anoni daban-daban da ayyukan kalmomi (Interpret various meanings and functions of words)',
            ],
            objectives: [
              'Karanta rubutun Hausa (Read written Hausa texts)',
              'Fahimtar rubutun Hausa a cikin mahallin da aka bayar (Comprehend Hausa text in given context)',
              'Fassara ma\'anoni da ayyuka daban-daban na kalmomi (Interpret various meanings and functions of words)',
              'Samun isasshen ƙamus (Acquire sufficient vocabulary)',
              'Gano batutuwa masu mahimmanci a cikin rubutu (Recognize central issues in a given text)',
              'Yanke shawara bisa ga hujjoji a cikin rubutu (Draw conclusions based on available evidence)',
            ],
            aiPrompt: "Explain Hausa comprehension techniques. Provide a 200-word sample Hausa passage. Create 5 comprehension questions with answers. Explain how to identify main ideas and supporting details. Discuss vocabulary building strategies for Hausa texts.",
          },
          {
            id: 'A.3',
            title: 'Tsarin Rubutun Insha\'i (Composition Techniques)',
            content: [
              'Rubutun gardama (Argumentative)',
              'Rubutun siffantawa (Descriptive)',
              'Rubutun tattaunawa (Dialogue)',
              'Rubutun bayyanawa (Expository)',
              'Rubutun labari (Narrative)',
              'Rubutun wasiƙa (Letter writing)',
            ],
            objectives: [
              'Samun ilimi da dabarun rubuta insha\'i a Hausa (Acquire knowledge and techniques of composition writing)',
              'Gane sassa daban-daban na insha\'i a Hausa (Recognize different segments of composition)',
              'Gane nau\'o\'in insha\'i daban-daban a Hausa (Recognize different types of Hausa composition)',
            ],
            aiPrompt: "Explain Hausa composition writing techniques. Detail each type: gardama (argumentative), siffantawa (descriptive), tattaunawa (dialogue), bayyanawa (expository), labari (narrative), wasiƙa (letter). Provide structure for each type with Hausa examples. Show proper format for formal and informal letters.",
          },
          {
            id: 'A.4',
            title: 'Fassara (Translation)',
            content: [
              'Ire-iren fassara (Types of translation)',
              'Ka\'idojin fassara (Rules of translation)',
              'Matsalolin fassara (Problems of translation)',
              'Dabarun fassara (Techniques of translation)',
            ],
            objectives: [
              'Fassara karin magana da kalmomin sababbi daga Turanci zuwa Hausa (Translate proverbial and idiomatic expressions and new words)',
              'Gane ire-iren fassara daban-daban (Recognize different types of translation)',
              'Fahimtar dabarun fassara na karin magana da kalmomin sababbi zuwa Hausa (Understand basic techniques of translating expressions)',
              'Gano matsalolin fassara zuwa Hausa (Identify problems of translation into Hausa)',
            ],
            aiPrompt: "Explain Hausa translation techniques from English to Hausa. Discuss types of translation: literal, idiomatic, cultural. Explain challenges in translating proverbs and idioms. Provide examples of good vs poor translations. Discuss cultural adaptation in translation.",
          },
          {
            id: 'A.5',
            title: 'Tsarin Sauti (Phonology)',
            content: [
              'Bakake (Consonants): samarwa da rarrabuwa bisa yanayin murya, wuri da yanayin furuci',
              'Wasula (Vowels): samarwa da rarrabuwa bisa matsayin harshe da leɓe; wasula guda ɗaya da masu hadawa',
              'Sauti (Tone): misali babba, ƙarama, mai saukowa',
              'Tsarin gajeren sauti (Syllable structure): ire-iren gajeren sauti kamar buɗe da rufe, mai sauƙi da mai nauyi; rarrabuwar kalmomi bisa gajeren sauti',
              'Tsawon wasula (Vowel length): dogaye da gajerun wasula',
              'Hanyoyin sauti (Phonological processes): misali na haɗawa kamar palatalization, labialization da jituwar wasula; marasa haɗawa kamar ƙari da sharewa',
            ],
            objectives: [
              'Bincika hanyar samar da sauti da haɗa su don samar da kalmomi masu ma\'ana (Analyze sound production and combination)',
              'Kimanta muhimmancin wasula wajen tantance ma\'ana (Appraise importance of vowels in determining meaning)',
              'Bambanta sifofi na sauti (Distinguish between phonetic attributes of sounds)',
              'Gane adadin gajeren sauti da ire-irensu a cikin kalma (Recognize number of syllables and their types)',
              'Bincika hanyoyin sauti a Hausa (Analyze phonological processes in Hausa)',
            ],
            aiPrompt: "Explain Hausa phonology comprehensively. Detail consonant and vowel production. Explain tone patterns: high, low, falling. Discuss syllable structure and vowel harmony. Provide examples of phonological processes. Explain importance of tone in Hausa meaning.",
          },
          {
            id: 'A.6',
            title: 'Kirar Kalma (Morphology)',
            content: [
              'Tushe da gangar jikin kalmomi (Roots and stems)',
              'Haɗawa: prefix, infix, suffix da ayyukansu na ƙirƙira da canzawa',
              'Jinsi da lambobi (Gender and number inflections)',
              "Ƙirƙirar sunaye da sifofi daga fi'ili (Derivation of nouns and adjectives from verbs)",
              "Ƙirƙirar sifofi da fi'ili daga sunaye (Derivation of adjectives and verbs from nouns)",
            ],
            objectives: [
              'Bayyana tushe da gangar jikin kalmomin Hausa (Explain roots and stems of Hausa words)',
              'Bayyana hanyar canzawa a cikin ƙirƙirar kalmar Hausa (Explain inflectional process in Hausa word formation)',
              'Bayyana hanyar ƙirƙira a cikin ƙirƙirar kalmar Hausa (Explain derivational process of word formation)',
              'Bambanta tsakanin hanyoyin ƙirƙira guda biyu (Differentiate between the two morphological processes)',
            ],
            aiPrompt: "Explain Hausa morphology. Detail roots, stems, and affixes. Discuss gender and number inflection in Hausa. Explain derivational processes for creating nouns, verbs, and adjectives. Provide examples of word formation patterns.",
          },
          {
            id: 'A.7',
            title: 'Ginin Jumla (Syntax)',
            content: [
              'Ajujuwan kalmomi (Word classes): sunaye, karin suna, fi\'ili, bayanai, sifofi, gabobi, haɗin kai, tsautsayi da sautukan ra\'ayi',
              'Rukunonin nahawu (Grammatical categories): lokaci da yanayi (gabaɗaya da na dangi na baya: gabaɗaya da na dangi na ci gaba, na farko da na biyu na gaba, na al\'ada); yanayi (mahimmanci da korau); jinsi (namiji, mace da tsaka-tsaki) da lamba (guda da jam\'i)',
              'Tsarin jumla (Sentence structure): jumla mai fi\'ili, jumlar suna + jumlar fi\'ili da abubuwan da suka haɗa da su, jumla marar fi\'ili: jumlar suna + mai tsayarwa, jumlar suna + kari + mai tsayarwa, jumlolin suna + tsarin ci gaba (yana../yake…) (+da) + jumlar suna',
              'Ire-iren jumla (Sentence types): jumloli masu sauƙi, jumloli masu haɗawa da jumloli masu sarkakiya',
              'Sassan jumla (Clauses): ire-irensu (misali na dangi da mahimmanci); ayyukansu (misali babba da ƙarama)',
            ],
            objectives: [
              'Bincika hanyoyin haɗa kalmomi don samar da jimloli (Analyze processes governing word combination)',
              'Gano kurakuran harshe a cikin nahawu (Detect linguistic errors in grammar)',
              'Gane ra\'ayoyi ko tunani a cikin rubuce (Recognize ideas or thoughts in written form)',
              'Gina jumloli na nahawu don ingantacciyar sadarwa (Construct grammatical sentences for effective communication)',
              'Yin amfani da lokutan da suka dace a cikin magana da rubutu (Use appropriate tenses in spoken and written Hausa)',
              'Yin amfani da jinsi da lamba masu dacewa a cikin magana da rubutu (Use appropriate gender and number)',
              'Bambanta tsakanin ire-iren tsarin jumla (Differentiate between types of sentence structure)',
              'Bambanta tsakanin jumlar suna da ta fi\'ili (Distinguish between nominal and verbal phrase)',
              'Bambanta tsakanin ire-iren jumla (Distinguish between types of sentences)',
              'Kwatanta ire-iren sassan jumla (Compare types of clauses)',
            ],
            aiPrompt: "Explain Hausa syntax comprehensively. Detail word classes and their functions. Explain grammatical categories: tense, aspect, mood, gender, number. Discuss sentence structures and types. Provide examples of simple, compound, and complex sentences in Hausa.",
          },
          {
            id: 'A.8',
            title: 'Ma\'ana (Semantics)',
            content: [
              'Bangaren ƙamus na ma\'anar kalma (Lexical aspects of word meaning): misali shubuha, ma\'ana ɗaya da kishiya',
              'Siffofin magana (Figures of speech): bangarori na ma\'anoni na musamman na kalmomi da jimloli, misali karin magana, karin magana da dai sauransu',
            ],
            objectives: [
              'Bincika hanyoyin samar da ma\'anoni a Hausa (Analyze mechanisms of generating meanings)',
              'Haɓaka ƙamus (Build up vocabulary)',
              'Gane ma\'anoni da ayyuka daban-daban na jumloli a cikin sadarwa (Recognize various meanings and functions of sentences)',
              'Yin amfani da kalmomi da jumloli masu dacewa don wani manufa (Use words and sentences suitable for particular purpose)',
              'Gina jumloli masu ma\'ana don ingantacciyar sadarwa (Construct meaningful sentences for effective communication)',
            ],
            aiPrompt: "Explain Hausa semantics. Discuss lexical relations: ambiguity, synonymy, antonymy. Explain figures of speech: idioms, proverbs, metaphors. Provide examples of Hausa proverbs with explanations. Discuss contextual meaning in Hausa communication.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SASHE B: AL\'ADU (CULTURE)',
        topics: [
          {
            id: 'B.1',
            title: 'Rayuwar Hausawa (Hausa Customs)',
            content: [
              'Haihuwa (Birth): d\'aukar ciki da goyon ciki da haihuwa da shayarwa da al\'adun makon farko na haihuwa da wanka da ßanti da yaye da kaciya da samartaka',
              'Aure (Marriage): ire-irensa da nema da baiko da ßaurin aure da biki da zaman aure da saki da zawarci',
              'Mutuwa (Death): faðar mutuwa da wanka da salla da jana\'iza da zaman makoki da sadaka da takaba da gado',
              'Tasirin zamani akan rayuwar Hausawa',
            ],
            objectives: [
              'Bayyana al\'adun da ke tattare da d\'aukar ciki har zuwa samartaka',
              'Bayyana tasirin zamani a kan haihuwa',
              'Bayyana al\'adun neman aure har zuwa zawarci',
              'Bayyana tasirin zamani akan aure',
              'Bayyana hanyoyin Ğaðar mutuwa zuwa rabon gado',
              'Bayyana tasirin zamani akan mutuwa',
              'Tantance ma\'ana da ire-iren tasirin zamani',
            ],
            aiPrompt: "Explain Hausa customs for birth, marriage, and death. Detail traditional practices and modern influences. Discuss significance of each ritual. Provide Hausa terms for different ceremonies. Explain cultural changes over time.",
          },
          {
            id: 'B.2',
            title: 'Zamantakewa (Social Institutions)',
            content: [
              'Tsarin zaman iyali da zaman gandu da dangantakar kishiyoyi da \'yan uwantaka da barantaka da agolanci',
              'MaĞwabtaka',
              'Aikin gandu da na gayya',
              'Abota da Ğawance',
              'Gaisuwa da kararinci',
              'Tasirin zamani a kan zamantakewa',
            ],
            objectives: [
              'Bayyana tsarin dangantaka da mu\'amala tsakanin iyali',
              'Bayyana muhimmancin zamantakewa a tsakanin Hausawa',
              'Tantance ire-iren tasirin zamani a kan al\'adun zamantakewa',
            ],
            aiPrompt: "Explain Hausa social institutions. Discuss family structure, neighborhood relations, communal work (gayya), friendship, and greetings. Explain cultural values in social interactions. Discuss modern influences on traditional institutions.",
          },
          {
            id: 'B.3',
            title: 'Sana\'o\'in Gargajiya (Traditional Occupations)',
            content: [
              'Ire-irensu: noma da Ğira da jima da kasuwanci da wanzanci da sassaĞa da farauta da dukanci da saĞa da kitso da rini da Ğawa da Ğafar Ğorai, da sauransu',
              'Yanayinsu: hanyoyin gadon su da kayayyakin yin su da matakan tafiyar da su da muhimmancinsu',
              'Kayayyaki ko amĞanin da suke samarwa',
              'Sarautunsu',
              'Sana\'o\'i masu dangantaka da jinsi: aikatau da Ğwadago; kitso da aski',
              'Tasirin zamani a kan sana\'o\'in gargajiya',
            ],
            objectives: [
              'Tantance Ğabi\'un masu sana\'a',
              'Tantance kayayyakin da ake sana\'antawa',
              'Tantance sana\'o\'in maza da na mata',
              'Zayyana kayayyakin sana\'o\'in',
              'Tantance hanyoyin gadon sana\'o\'in',
              'Zayyana amĞanin kayayyakin sana\'o\'in',
              'Bayyana sarautun sana\'o\'in',
              'Bayyana muhimmancin sana\'o\'in',
              'Tantance tasirin zamani akan sana\'o\'in',
            ],
            aiPrompt: "Explain Hausa traditional occupations. Detail farming, blacksmithing, trading, weaving, hunting, etc. Discuss gender-based occupations. Explain apprenticeship systems. Discuss modern changes to traditional occupations.",
          },
          {
            id: 'B.4',
            title: 'Kayayyakin BuKatun Rayuwa (Material Culture)',
            content: [
              'Na buKatun cikin gida (Household): tufafi da karikitan cikin gida',
              'Na sauran buKatu (Others): gine-gine da girke-girke da sauransu',
              'Tasirin zamani a kan kayayyakin buKatu',
            ],
            objectives: [
              'Tantance kayayyakin buKatun rayuwa na hausawa',
              'Tantance amfanin kayayyakin buKatun rayuwa na Hausawa',
              'Tantance tasirin zamani a kan kayayyakin buKatun rayuwa na Hausawa',
            ],
            aiPrompt: "Explain Hausa material culture. Discuss traditional clothing, household items, architecture, and crafts. Explain cultural significance of different items. Discuss modern influences on traditional material culture.",
          },
          {
            id: 'B.5',
            title: 'Bukukuwa da Wasanni (Hausa Festivities and Recreational Activities)',
            content: [
              'Na addini (Religious): irin su bikin salla da takutaha (sallar gani) da cika-ciki da saukar karatu',
              'Na gargajiya (Traditional): irin su kalankuwa da budar dawa, da bikin shan kabewa',
              'Na sana\'a (Occupational): bikin kamun kifi da dambe da kokawa da wasan farauta da wasan makera da hawan Kaho',
              'Na nishadi: sukuwa',
              'Na yara (Children\'s games): irin su shalle da kulli-kurciya da a-sha-ruwan-tsuntsaye da gada da carafke',
              'Tasirin zamani kan bukukuwa da wasanni',
            ],
            objectives: [
              'Zayyana ire-iren wasanni da bukukuwan Hausawa',
              'Nuna mahimancinsu',
              'Nuna yadda za a adana su kada su 6ace',
              'Nuna yadda ake gudanar da su',
              'Nuna tasirin zamani a kan bukukuwa da wasanni',
            ],
            aiPrompt: "Explain Hausa festivals and recreational activities. Detail religious festivals, traditional celebrations, occupational festivals, entertainment, and children\'s games. Discuss cultural significance and preservation. Explain modern influences.",
          },
          {
            id: 'B.6',
            title: 'Camfe-camfe da Bauta (Traditional Beliefs and Worship)',
            content: [
              'Camfe-camfe irin su kangida da camfi, da kambun baka da maita',
              'Bauta irin su bori da da tsafi',
              'Tasirin zamani a kan camfe-camfe da bauta',
            ],
            objectives: [
              'Tantance ire-ire da hanyoyin aiwatar da su',
              'Bayyana amfaninsu',
              'Bayyana rashin amfaninsu',
              'Bayyana tasirin zamani a kansu',
            ],
            aiPrompt: "Explain Hausa traditional beliefs and worship. Discuss supernatural beliefs (camfe-camfe) and traditional worship practices (bori, tsafi). Explain cultural context and modern perspectives. Discuss integration with Islamic practices.",
          },
          {
            id: 'B.7',
            title: 'Sarautun Gargajiya (Traditional Authority)',
            content: [
              'Ire-iren su: sarakuna da hakimai da dagatai da masu unguwanni',
              'Na bayin sarki: shantali da jakadiya da baraya da sauransu',
              'Masu alaKa da addini: irin su liman da alKali',
              'Ayyukansu',
              'Tasirin zamani a kan sarautun garbajiya',
            ],
            objectives: [
              'Zayyana su ta fuskar ire-iren muKamai',
              'Zayyana matakan muKamai',
              'Tantance aikin kowane mai muKami',
              'Tantance mahimmancin kowane muKami',
              'Bayyana tasirin zamani a kansu',
            ],
            aiPrompt: "Explain Hausa traditional authority structure. Detail roles of emirs, hakimai, district heads, ward heads. Discuss palace officials and religious leaders. Explain modern adaptations of traditional authority.",
          },
          {
            id: 'B.8',
            title: 'Magungunan Gargajiya (Traditional Medicine)',
            content: [
              'Ire-iren su: na gargajiya (sassaKe-sassaKe da sawyoyi da na gari da na ruwa); na addini (layu da rubutu da dibbu da duba)',
              'Hanya amfani da su: sha da shafawa da surace da turare da shaKawa da taunawa da tsotsawa da daurawa da liKawa da ratayawa',
              'Tsarin amfani da su: awo da klimantawa',
              'Ayyukansu: riga-kafi da warkarwa',
              'Tasirin zamani a kansu',
            ],
            objectives: [
              'Karkasa ire-iren magunguna',
              'Zayyana hanyoyin amfani da su',
              'Fito da amfaninsu',
              'Nuna tasirin zamani a kan su',
            ],
            aiPrompt: "Explain Hausa traditional medicine. Detail types: herbal, spiritual, religious. Discuss preparation and administration methods. Explain diagnostic techniques. Discuss integration with modern medicine.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SASHE C: ADABI (LITERATURE)',
        topics: [
          {
            id: 'C.1',
            title: 'Adabin Baka (Oral Literature)',
            subtopics: [
              {
                id: 'C.1.1',
                title: 'Zuben Baka (Narratives)',
                content: [
                  'Irin su tatsuniya da almara da hikaya da kissa da tarihi da sauransu',
                ],
                objectives: [
                  'Tantance nau \'o\'in zuben baka',
                  'Amfani da kalmomin da suka dace da kan labari',
                ],
              },
              {
                id: 'C.1.2',
                title: 'Maganganun Azanci (Folk-sayings)',
                content: [
                  'Irin su take da kirari da habaici da zambo da karin magana da kacici-kacici da salon magana da adon magana da sauransu',
                ],
                objectives: [
                  'Tantance sigogi da bayyana hanyoyin amfani da su',
                  'NaKalta da amfani da kalmomin da suka dace da maganganun azanci',
                ],
              },
              {
                id: 'C.1.3',
                title: 'WaKoKi na baka (Oral songs)',
                content: [
                  'Ire-iren su: na fada da na jama\'a da na maza da na sha\'awa da sauransu',
                  'Turke (jigo) da salo da zubi da tsari da mawaKi da kayan kida da abin da aka wake',
                  'WaKoKin aiki: na niKa da daþe da na daka da na talla da sauransu',
                  'WaKoĞin yara (maza da mata); na aure da na dandali da sauransu',
                ],
                objectives: [
                  'Tantance ire-iren waKoKin baka',
                  'Tantance masu yin ire-iren waKoKin',
                  'Rarrabe siga da turke (jigo) da salo da zubi da kayayyakin aiwatar da su',
                  'Tantance nau\'o\'in waKoĞin aiki',
                  'Tantance masu yin waKoĞin aiki',
                  'Bambance sigogin waKoĞin yara',
                ],
              },
              {
                id: 'C.1.4',
                title: 'Wasannin Kwaikwayo Na Gargajiya (Traditional Drama)',
                content: [
                  'Na yara: ire-irensu - langa da wasan \'yartsana da tashe da wasan gauta da dokin kara da sauransu; yadda ake yin su; muhimmancinsu',
                  'Na manya: ire-irensu - \'yan kama da kalankuwa da hoto da wowwo da tashe, da sauransu; yadda ake yinsu; muhimmancinsu',
                ],
                objectives: [
                  'Tantance sigogin wasannin kwaikwayo na gargajiya',
                  'Tantance hanyoyin gudanar da wasannin kwaikwayo na gargajiya',
                  'Fito da muhimmancin wasannin kwaikwayo na gargajiya',
                  'Fayyece bambancin wasan kwaikwayo na yara da na manya',
                ],
              },
            ],
            aiPrompt: "Explain Hausa oral literature comprehensively. Detail narratives (tatsuniya, almara), folk-sayings (karin magana, take), oral songs (wakokin baka), and traditional drama (wasannin kwaikwayo). Discuss cultural significance and performance contexts.",
          },
          {
            id: 'C.2',
            title: 'Rubutaceen Adabi (Written Literature)',
            subtopics: [
              {
                id: 'C.2.1',
                title: 'Zube (Prose)',
                content: [
                  'Text: Turmin Danya by S. I. Katsina',
                ],
                objectives: [
                  'Tantance siga da tsari da jigo da salo da taurarin cikin litafin zube tare da nazarin su',
                  'NaĞaltar Ğa\'idojin rubutu yayin karanta rubutun zube',
                  'NaĞaltar ma\'anonin kalmomi da na jumloli domin Ğahintar labari',
                  'Tantance muhimman sakonni a cikin labari da yanke hukunci game da labarin',
                ],
              },
              {
                id: 'C.2.2',
                title: 'WaĞa (Poetry)',
                content: [
                  'Text: Wakokin Hausa by N.S. Wali da wasu',
                ],
                objectives: [
                  'Ğahintar jigo da salo da siga da zubi wajen nazarin zaBaBbiyar waĞa',
                  'Yin la\'akari da Ğa\'idojin rubutu musamman na waĞa',
                  'Tantance ma\'anonin kalmomi da na jumloli wajen nazarin waĞa',
                  'Danganta amĞani da kalmomi da jumloli da saĞon waĞa',
                  'Tantance muhimman sakonni a cikin waĞa da yanke hukunci game da ita',
                ],
              },
              {
                id: 'C.2.3',
                title: 'Wasan Kwaikwayo (Drama)',
                content: [
                  'Text: Abin Da Kamar Wuya by H. M. Bugaje',
                ],
                objectives: [
                  'Tantance yanayin wurin wasa da jigo da salo da \'yan wasa da siga da tsarin rubutaceen wasan kwaikwayo da aka zaBa don nazari',
                  'La\'akari da muhimmancin Ka\'idojin rubutu wajen fitar da ma\'ana',
                  'NaKaltar ma\'anar kalmomi domin fahimtar wasa',
                  'Tantance muhimman sakonni a cikin wasa da yanke hukunci game da sakonnin',
                ],
              },
            ],
            aiPrompt: "Explain Hausa written literature genres. Analyze prescribed texts: Turmin Danya (prose), Wakokin Hausa (poetry), Abin Da Kamar Wuya (drama). Discuss literary elements: theme, style, structure, characterization. Explain cultural and social messages.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'LITTATTAFAI DA AKA ƘAYYADE (PRESCRIBED TEXTS)',
        type: 'textbooks',
        content: [
          'PROSE: Turmin Danya by S. I. Katsina (NNPC, Zaria, 2011)',
          'DRAMA: Abin Da Kamar Wuya by H. M. Bugaje (ABU Press Ltd, Zaria, 2018)',
          'POETRY: Wakokin Hausa by N.S. Wali da wasu (NNPC, Zaria, 1982)',
          'ORAL LITERATURE - PROSE: Mu Sha Dariya by B. O. Tofa (NNPC, Zaria, 2018)',
          'ORAL LITERATURE - DRAMA: Wasannin Tashe by M. B. Umar (NNPC, Zaria, 2009)',
          'ORAL LITERATURE - POETRY: Jagoran Nazarin Wakar Baka by S. M. Gusau (Benchmark Publishers Ltd, 2003)',
          'LANGUAGE: Sound System And Grammar by M. A. Z. Sani (U.P.Plc, Ibadan, 2000)',
          'CULTURE: Rayuwar Hausa by CSNL/BUK (Nelson, Lagos, 1980)',
          'CULTURE: Hausa Customs by I. Madauci (NNPC, 1985)',
        ],
      },
      {
        id: 'references',
        title: 'LITTATTAFAI NA BAYANI (REFERENCE BOOKS)',
        type: 'references',
        content: [
          'Exams Focus Hausa Language by M.A.Z Sani (U.P.PLC, Ibadan, 2000)',
          'Darussan Hausa 1 – 3 by I. Y. Yahaya et al (U.P.PLC, Ibadan, 1992)',
          'Rayayyen Nahawun Hausa by M.H. Junju (NNPC,Zaria, 2010)',
          'An Introduction to Hausa Grammar by M.K.M. Galadanci (Longman Nigeria, 1984)',
          'Jagoran Nazarin Kagaggun Labarai by I. Mukhtar (A.J. Publishers, Kano, 2002)',
          'Rabe-Raben Adabi Da Muhimmancinsa Ga Rayuwar Hausawa by A. Dangambo (Triump Publishing Company, Kano, 1984)',
          'Harshe Da Adabin Hausa A Kammale by J. Ismaila and M.Y Tanimu (Spectrum Books, Ibadan, 2007)',
          'Labaru Na Da Da Na Yanzu (NNPC, 1985)',
          'Zaman Mutum Da Sana\'arsa by E.M. Rimmer et al. (NNPC, Zaria, Reprinted 2002)',
          'Zaman Hausawa by H. Alhassan et al (Islamic Publication Bureau, Lagos Reprinted 1988)',
          'WaKa A. Bakin Mai Ita by CSNL, BUK, Kano (NNPC, Zaria, 2006)',
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
        AsyncStorage.getItem('hausa_ai_explanations'),
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

  // Check AI limit from backend (same as Igbo)
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
    const systemPrompt = 'You are an expert Hausa language and culture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Hausa examples and cultural context. Use proper Hausa orthography with Boko script. Format in markdown.';
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
      await AsyncStorage.setItem('hausa_ai_explanations', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving explanation:', error);
    }
  };

  const activatePremium = async () => {
    try {
      await AsyncStorage.setItem('isPremiumActivated', 'true');
      setIsPremiumActivated(true);
      setSubscriptionModalVisible(false);
      Alert.alert('Nasara', 'An kpoghe fasalin Premium!');
      
      if (userInfo?.userId) {
        await checkAiLimit(userInfo.userId, 0, false);
      }
    } catch (error) {
      Alert.alert('Kuskure', 'An kasa kpoghe Premium');
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
      "Kredit AI Bai Isa Ba",
      `Kuna da sauran haruffa AI ${currentLimit.toLocaleString()}.\n\nAna buƙatar mafi ƙarancin: haruffa 1,000 don bincike na AI\n\nDa fatan za a saya ƙarin kredit don ci gaba da amfani da taimakon AI.`,
      [
        { text: "To", style: "cancel" },
        { 
          text: "Saya Kredit", 
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
        'Fasalin Premium Ana Buki',
        'Fasalin Bayanin AI na masu amfani da Premium ne. Ku kpoghe Premium don samun bayani masu ƙarfi na AI tare da mahallin al\'adun Hausawa.',
        [
          { text: 'Soke', style: 'cancel' },
          {
            text: 'Kpoghe Premium',
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
        'Babu Haɗin Intanet',
        'Kuna buƙatar haɗin intanet don amfani da fasalin AI.'
      );
      return;
    }

    // Check if user is logged in
    if (!userInfo?.userId) {
      Alert.alert(
        'Ana Buki Shiga',
        'Kuna buƙatar shiga don amfani da fasalin AI.'
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
      Alert.alert("Kuskuren Biyan Kuɗi", limitCheck.message || "Ba za a iya tabbatar da biyan kuɗi ba.");
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
      const prompt = `As a Hausa language and culture expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content ? topic.content.join(', ') : topic.subtopics?.map(st => st.title).join(', ')}`}

Teaching requirements for Hausa Studies:
1. Start with a clear definition in ## H2 heading
2. Use proper Hausa orthography with Boko script
3. Provide Hausa terms with English translations in parentheses
4. Include cultural context and practical examples
5. Explain concepts with reference to specific Hausa communities
6. Highlight key learning points with **bold**
7. Include proverbs (karin magana) and idioms where relevant
8. Provide practice exercises with solutions
9. Connect traditional knowledge with modern applications

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key Hausa terms
- Use > for important proverbs or sayings
- Include Hausa text in proper orthography
- Make it engaging for Nigerian students

Write in clear, educational Hausa instruction style with cultural sensitivity.`;

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
              content: 'You are an expert Hausa language and culture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Hausa examples and cultural context. Use proper Hausa orthography with Boko script. Format in markdown.'
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
            "An Yi Amfani da Kredit AI",
            `An cire haruffa ${usage.totalChars.toLocaleString()}\nRagowa: ${deductionResult.aiLimit.toLocaleString()}`,
            [{ text: "To" }]
          );
        } else if (!deductionResult.success) {
          Alert.alert(
            "Kuskuren Amfani",
            deductionResult.message || "An kasa cire kredit AI."
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
        'Kuskure',
        'An kasa samun bayanin AI. Da fatan za a duba haɗin intanetku kuma ku sake gwadawa.',
        [{ text: 'To' }]
      );
    } finally {
      setIsLoading(false);
      setAiLoadingTopics(prev => ({ ...prev, [topic.id]: false }));
    }
  };

  const clearAllExplanations = async () => {
    Alert.alert(
      'Share Duk Bayanin AI',
      'Wannan zai share duk bayanin AI da aka adana. Ku ci gaba?',
      [
        { text: 'Soke', style: 'cancel' },
        {
          text: 'Share',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('hausa_ai_explanations');
              setAiExplanations({});
              Alert.alert('Nasara', 'An share duk bayanin Hausa');
            } catch (error) {
              Alert.alert('Kuskure', 'An kasa share bayanin');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "translate" : "lock"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'Bayanan AI' : isPremiumActivated ? 'AI Bayyana' : 'A Kulle'}
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
            color="#009900" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#009900" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#009900" style={styles.bulletIcon} />
                    <Text style={styles.textbookText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'references' ? (
              <View style={styles.referencesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.referenceItem}>
                    <Icon name="library-books" size={16} color="#009900" style={styles.bulletIcon} />
                    <Text style={styles.referenceText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.topicsContainer}>
                {section.topics.map(topic => {
                  // Check if topic has subtopics
                  if (topic.subtopics) {
                    return (
                      <View key={topic.id} style={styles.topicCard}>
                        <View style={styles.topicHeader}>
                          <View style={styles.topicHeaderContent}>
                            <Text style={styles.topicTitle}>{topic.title}</Text>
                            {renderAIButton(topic)}
                          </View>
                        </View>
                        
                        <View style={styles.subtopicsContainer}>
                          {topic.subtopics.map(subtopic => (
                            <View key={subtopic.id} style={styles.subtopicCard}>
                              <TouchableOpacity
                                style={styles.subtopicHeader}
                                onPress={() => toggleTopic(subtopic.id)}
                                activeOpacity={0.7}
                              >
                                <View style={styles.subtopicHeaderContent}>
                                  <Text style={styles.subtopicTitle}>{subtopic.title}</Text>
                                  {renderAIButton(subtopic)}
                                </View>
                                <Icon 
                                  name={expandedTopics[subtopic.id] ? "expand-less" : "expand-more"} 
                                  size={18} 
                                  color="#007700" 
                                />
                              </TouchableOpacity>

                              {expandedTopics[subtopic.id] && (
                                <View style={styles.subtopicContent}>
                                  {subtopic.content && subtopic.content.length > 0 && (
                                    <View style={styles.subsection}>
                                      <View style={styles.subsectionHeader}>
                                        <Icon name="list" size={16} color="#009900" />
                                        <Text style={styles.subsectionTitle}>Abubuwan da Ake Koyarwa:</Text>
                                      </View>
                                      {subtopic.content.map((item, idx) => (
                                        <View key={idx} style={styles.contentItem}>
                                          <Text style={styles.bullet}>•</Text>
                                          <Text style={styles.contentText}>{item}</Text>
                                        </View>
                                      ))}
                                    </View>
                                  )}

                                  {subtopic.objectives && subtopic.objectives.length > 0 && (
                                    <View style={styles.subsection}>
                                      <View style={styles.subsectionHeader}>
                                        <Icon name="school" size={16} color="#009900" />
                                        <Text style={styles.subsectionTitle}>Manufofin Koyo:</Text>
                                      </View>
                                      {subtopic.objectives.map((item, idx) => (
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
                      </View>
                    );
                  } else {
                    // Regular topic without subtopics
                    return (
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
                            color="#008800" 
                          />
                        </TouchableOpacity>

                        {expandedTopics[topic.id] && (
                          <View style={styles.topicContent}>
                            {topic.content && topic.content.length > 0 && (
                              <View style={styles.subsection}>
                                <View style={styles.subsectionHeader}>
                                  <Icon name="list" size={16} color="#009900" />
                                  <Text style={styles.subsectionTitle}>Abubuwan da Ake Koyarwa:</Text>
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
                                  <Icon name="school" size={16} color="#009900" />
                                  <Text style={styles.subsectionTitle}>Manufofin Koyo:</Text>
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
                    );
                  }
                })}
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
            <Text style={styles.subscriptionTitle}>Kpoghe Tsarin Premium</Text>
            <Text style={styles.subscriptionSubtitle}>Unlock Premium Features</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#009900" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Bayanan AI na Hausa</Text>
                <Text style={styles.featureDescription}>Samun cikakkun bayani tare da daidaitaccen rubutun Hausa da mahallin al\'adu</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#009900" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Harshen Hausa & Nahawu</Text>
                <Text style={styles.featureDescription}>Cikakken nahawun Hausa, sauti, da tsarin harshe</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#009900" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Al\'adun Hausa & Adabi</Text>
                <Text style={styles.featureDescription}>Cikakken bayani kan al\'adun Hausawa, adabi, da omenala</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#009900" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Kredit Haruffa AI</Text>
                <Text style={styles.featureDescription}>Samun bayanin AI tare da tsarin kredit na haruffa</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Tsarin Premium</Text>
              <Text style={styles.pricingAmount}>₦2,500 / wata</Text>
              <Text style={styles.pricingNote}>Ya haɗa da kredit haruffa AI don Karatun Hausa</Text>
            </View>
          </View>

          <View style={styles.subscriptionFooter}>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.cancelButton]}
              onPress={() => setSubscriptionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Soke</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.activateButton]}
              onPress={activatePremium}
            >
              <Icon name="lock-open" size={20} color="white" />
              <Text style={styles.activateButtonText}>Kpoghe Premium</Text>
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
          <Icon name="language" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>HAUSA</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Hausa Language & Culture</Text>
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
              <Icon name="bar-chart" size={16} color="#ffffffff" />
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
            <Icon name="info" size={20} color="#009900" />
            <Text style={styles.infoTitle}>Yadda Ake Amfani Da Shi</Text>
            <Text style={styles.infoTitleEnglish}>(How to Use)</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#009900" />
              <Text style={styles.tipText}>Danna taken don buɗe/rufe</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "translate" : "lock"} size={16} color={isPremiumActivated ? "#FF6600" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Bayyana don bayani cikin Hausa' : 'Kpoghe premium don bayanin AI'}
              </Text>
            </View>
            {isPremiumActivated && aiLimit > 0 && (
              <View style={styles.tipItem}>
                <Icon name="bar-chart" size={16} color="#2196f3" />
                <Text style={styles.tipText}>
                  {aiLimit.toLocaleString()} haruffa AI sun rage
                </Text>
              </View>
            )}
            <View style={styles.tipItem}>
              <Icon name="save" size={16} color="#2196f3" />
              <Text style={styles.tipText}>Ana adana bayanin AI don amfani ba tare da intanet ba</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="translate" size={16} color="#009900" />
              <Text style={styles.tipText}>Ya haɗa da rubutun Hausa da bayani cikin Turanci</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} batutuwa suna da bayanan AI da aka adana
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
                <Icon name="translate" size={20} color="#009900" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Bayanin AI
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
                  <ActivityIndicator size="large" color="#009900" />
                  <Text style={styles.loadingText}>
                    Ana samar da bayanin AI tare da rubutun Hausa...
                  </Text>
                  <Text style={styles.loadingTextEnglish}>
                    Generating AI explanation with Hausa text...
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
                <Icon name="share" size={20} color="#009900" />
                <Text style={styles.modalActionText}>Raba</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('An Adana', 'An adana bayanin AI cikin nasara!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Adana Bayanin
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

// Markdown styles for Hausa (similar to Igbo but with Hausa colors)
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
    color: '#005500',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009900',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00AA00',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#005500',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#F0FFF0',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#90EE90',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#F0FFF0',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#90EE90',
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
    color: '#009900',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#009900',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#009900',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0FFF0',
    borderLeftWidth: 4,
    borderLeftColor: '#009900',
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
    marginBotton:40
  },
  header: {
    backgroundColor: '#009900',
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
    color: '#fcfcfcff',
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
    color: '#009900',
    marginLeft: 8,
  },
  infoTitleEnglish: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    fontStyle: 'italic',
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
    backgroundColor: '#F0FFF0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#005500',
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
  referencesContainer: {
    paddingLeft: 8,
  },
  referenceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  referenceText: {
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
    backgroundColor: '#FAFFFA',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C0E0C0',
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
    color: '#009900',
    flex: 1,
  },
  subtopicsContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  subtopicCard: {
    backgroundColor: '#F7FFF7',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#B0D0B0',
    marginBottom: 8,
  },
  subtopicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  subtopicHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  subtopicTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007700',
    flex: 1,
  },
  subtopicContent: {
    padding: 10,
    paddingTop: 0,
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
    backgroundColor: '#009900',
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
    color: '#009900',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#009900',
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
    marginBottom: 35,
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
    color: '#009900',
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
  loadingTextEnglish: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
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
    borderColor: '#009900',
  },
  saveButton: {
    backgroundColor: '#009900',
    borderColor: '#009900',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#009900',
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
    backgroundColor: '#009900',
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
    backgroundColor: '#F0FFF0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#009900',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#009900',
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
    backgroundColor: '#009900',
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
    backgroundColor: "rgba(0, 153, 0, 0.9)",
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

export default HausaSyllabusScreen;