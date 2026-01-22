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

const IgboSyllabusScreen = () => {
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
          'Communicate and read effectively in Igbo',
          'Analyse issues in the language',
          'Interpret and explain figurative and idiomatic expressions in Igbo',
          'Apply Igbo literature to daily life experiences and demonstrate Igbo cultural values',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: LANGUAGE (ASỤSỤ)',
        topics: [
          {
            id: 'A.1',
            title: 'Essay Writing (Edemede)',
            content: [
              'Basic principles: introduction, body and conclusion',
              'Essay types: Narrative (Akomako), Descriptive & Expository (Nkọwa na Nkọwamị), Argumentative (Mgbagha/Arumarụụka)',
              'Speech making (Ekwumekwu), Letter Writing (Edemleta), Dialogue (Mkparịtaụka)',
            ],
            objectives: [
              'Identify basic principles of essay writing',
              'Use words and expressions appropriate to topics',
              'Differentiate between essay types',
              'Describe characteristics of each essay type',
              'Compare different types of essays',
              'Criticize other people\'s essays',
            ],
            aiPrompt: "Explain Igbo essay writing comprehensively. Detail each essay type with Igbo examples. Provide structure for edemede mfe (simple essay). Give sample introductions and conclusions. Explain how to write effective mkparịtaụka (dialogue) and edemleta (letters).",
          },
          {
            id: 'A.2',
            title: 'Comprehension (Aghọtaazaa)',
            content: [
              'One passage of about 150 words',
              'Understanding figurative and idiomatic expressions',
              'Deducing conclusions from passages',
            ],
            objectives: [
              'Explain meanings of difficult words',
              'Give correct answers to comprehension questions',
              'Differentiate between figurative and idiomatic expressions',
              'Deduce conclusions based on the passage',
            ],
            aiPrompt: "Explain how to approach Igbo comprehension passages. Provide a 150-word sample passage about ọrụ ugbo (farming). Create 5 comprehension questions with answers. Explain how to identify atụmatụ okwu (figurative expressions) like ilu (proverbs) in passages.",
          },
          {
            id: 'A.3',
            title: 'Sounds and Sound Patterns (Ụdaasụsụ na Usoro Ụdaasụsụ)',
            content: [
              'Vowels and Consonants (Ụdaume na Mgbochiume)',
              'Syllabic nasals (Ụdaimi), Semi-vowel (Myiriụdaume)',
              'Nasal homogeneity (Ndagba myiriụdaume)',
              'Syllable structure (Nkeji mkpụrụokwu)',
              'Vowel harmony (Ndakọrịta ụdaume)',
              'Vowel assimilation (Olilo ụdaume)',
              'Vowel and consonant elision (Ndapu ụdaume na ndapu mgbochiume)',
              'Tone and tone marking (Ụdaolu na Akara ụdaolu)',
            ],
            objectives: [
              'Identify vowels, consonants and syllabic nasals',
              'Distinguish between Igbo speech sounds',
              'Recognize semi-vowels and nasal homogeneity',
              'Divide words into syllables',
              'Identify vowel groups in Igbo',
              'Describe vowel assimilation and elision',
              'Assign tone marks appropriately',
            ],
            aiPrompt: "Explain Igbo phonetics and phonology. Detail the 8 vowels (a, e, i, ị, o, ọ, u, ụ) and their nasal counterparts. Explain ụdaolu (tone) patterns: high, low, downstep. Provide examples of ndakọrịta ụdaume (vowel harmony). Show syllable division with Igbo words.",
          },
          {
            id: 'A.4',
            title: 'Spelling and Orthography',
            content: [
              'Spelling rules (Iwu Nsụpe)',
              'Igbo Orthography (Mkpụrụedemede Igbo)',
              'Word division in Igbo',
            ],
            objectives: [
              'Detect words written correctly in Igbo',
              'Determine appropriate word division',
              'Indicate Igbo orthography rules',
              'Distinguish between Igbo and English orthography',
            ],
            aiPrompt: "Explain Igbo spelling rules and orthography. Detail the Igbo alphabet (36 letters). Explain word division rules and common spelling mistakes. Provide examples of correct vs incorrect spellings. Discuss the history of Igbo orthography development.",
          },
          {
            id: 'A.5',
            title: 'Dialect and Standard Igbo (Olundị/Ọlụmba na Igbo Izugbe)',
            content: [
              'Differences between standard Igbo and dialects',
              'Using standard Igbo in writing',
            ],
            objectives: [
              'Differentiate between standard Igbo and dialects',
              'Use standard Igbo in their writings',
            ],
            aiPrompt: "Explain Igbo dialects and standard Igbo. Discuss major dialect groups: Ọnịcha, Ọka, Mbaise, Ngwa, etc. Show differences in vocabulary and pronunciation. Explain when to use standard vs dialect forms. Provide examples of dialect variations.",
          },
          {
            id: 'A.6',
            title: 'Word Derivation (Usoro Mmụbaokwu n\'Igbo)',
            content: [
              'Processes: coinages, loans and loan-blends',
              'Identifying loan words and loan-blends',
            ],
            objectives: [
              'Differentiate between loan and coined words',
              'Identify loan words and loan-blends in Igbo',
              'Spell Igbo words appropriately',
            ],
            aiPrompt: "Explain Igbo word formation processes. Detail mbite (loan words) like 'komputa', mbiọgwụ (loan blends), and mmepụta (coinages). Provide examples of modern Igbo vocabulary creation. Discuss strategies for adapting English words to Igbo.",
          },
          {
            id: 'A.7',
            title: 'Grammar (Ụtọasụsụ)',
            content: [
              'Parts of speech (Nkejiasụsụ): Nouns (Mkpọaha), Verbs (Ngwaa), Adjectives (Nkọwa), Adverbs (Nkwụwa)',
              'Affixes (Mgbakwunye), Enclitics (Nsokwunye)',
              'Morpheme types: Free & bound (Mọfịm onwe na ndabe)',
              'Word structure (Mkpụrụokwu), Phrases (Nkebiokwu)',
              'Clauses (Nkebiahịrị): Nominal, Adverbial, Adjectival',
              'Sentences (Ahịrịokwu): Simple, Compound, Complex',
            ],
            objectives: [
              'Differentiate between grammatical categories',
              'Identify parts of speech and their functions',
              'Differentiate between types of affixes',
              'Determine types and characteristics of morphemes',
              'Identify words, phrases, clauses, sentences',
              'Recognize sentence types and characteristics',
            ],
            aiPrompt: "Explain Igbo grammar comprehensively. Detail parts of speech with Igbo examples. Explain mkpọaha (nouns) classification: aha nnọchiaha, aha ngosi, etc. Show verb conjugations and tenses. Discuss sentence structure patterns in Igbo.",
          },
          {
            id: 'A.8',
            title: 'Translation (Ntụgharị)',
            content: [
              'Translating between English and Igbo',
              'Effective communication in both languages',
            ],
            objectives: [
              'Translate English into Igbo and vice versa',
              'Communicate effectively in Igbo and English',
            ],
            aiPrompt: "Explain translation techniques between English and Igbo. Discuss challenges in translating idioms and proverbs. Provide practice sentences with solutions. Explain cultural concepts that don\'t translate directly. Give examples of good vs poor translations.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: LITERATURE (AGỤMAGỤ)',
        topics: [
          {
            id: 'B.1',
            title: 'Literary Devices (Atụmatụokwu)',
            content: [
              'Alliteration (Ịjambịa mgbochiume)',
              'Assonance (Ịjambịa ụdaume)',
              'Parallelism (Kwụnkwụgha)',
              'Metaphor (Mbụrụ), Simile (Myirị)',
              'Hyperbole (Egbeokwu), Personification (Mmemmadu)',
              'Proverbs (Ilu) and other devices',
            ],
            objectives: [
              'Identify all literary devices in passages',
              'Interpret literary devices',
              'Differentiate between types of literary devices',
              'Use Igbo literary devices appropriately',
            ],
            aiPrompt: "Explain Igbo literary devices with examples. Detail each atụmatụ okwu with Igbo examples from literature. Explain how to identify and interpret ilu (proverbs) in context. Provide analysis of figurative language in Igbo texts.",
          },
          {
            id: 'B.2',
            title: 'Oral Literature (Agụmagụ Ọnụ/Agụmagụ Ọdịnala)',
            content: [
              'Folktales (Ifo), Myths (Nkomiriko), Legends (Nkokiriko)',
              'Poems (Abụ), Songs (Uri), Chants (Mbem)',
              'Riddles (Agwụgwa), Oral drama (Ejije ọnụ)',
              'Tongue-twisters (Okwuntụhị)',
            ],
            objectives: [
              'Create folk stories, chants, riddles, oral drama',
              'Analyze various genres of oral literature',
              'Present ideas according to underlying principles',
              'Apply lessons of oral literature to everyday life',
            ],
            aiPrompt: "Explain Igbo oral literature genres. Provide examples of ifo (folktales) with moral lessons. Explain structure of agwụgwa (riddles) and uri (songs). Discuss cultural significance of mbem (chants) and okwuntụhị (tongue-twisters). Provide sample oral literature pieces.",
          },
          {
            id: 'B.3',
            title: 'Written Literature - Prose (Agụmagụ Ederede - Iduuazị)',
            content: [
              'Text: Chinedu Ofomata (2009) "A Chọọ Isi Ọchụ"',
              'Character analysis and plot summary',
              'Figurative and idiomatic expressions in the text',
              'Moral lessons from the text',
            ],
            objectives: [
              'Interpret the text',
              'Isolate characters in the book',
              'Identify figurative and idiomatic expressions',
              'Analyze the text',
              'Identify author, publisher, publication date',
              'Draw moral lessons from the text',
            ],
            aiPrompt: "Provide analysis of 'A Chọọ Isi Ọchụ' by Chinedu Ofomata. Summarize plot and character development. Identify key themes and moral lessons. Explain figurative language used. Discuss cultural relevance to Igbo society.",
          },
          {
            id: 'B.4',
            title: 'Written Literature - Poetry (Abụ)',
            content: [
              'Text: Nolue Emenanjo "Ụtara Ntị"',
              'Selected poems (15 poems from the text)',
              'Poetic devices and themes',
              'Comparative analysis of poems',
            ],
            objectives: [
              'Compare types and themes of the poems',
              'Relate poet\'s ideas to poem contents',
              'Compare figurative and idiomatic expressions',
              'Analyze structures of the poems',
              'Apply knowledge and moral lessons to daily life',
            ],
            aiPrompt: "Analyze poems from 'Ụtara Ntị' by Nolue Emenanjo. Explain themes of selected poems. Discuss poetic devices used. Provide line-by-line analysis of key poems. Explain cultural and social commentary in the poems.",
          },
          {
            id: 'B.5',
            title: 'Written Literature - Drama (Ejije)',
            content: [
              'Text: Ọdụnke Artists (2019) "Ọjaadịlị"',
              'Type of drama and themes',
              'Story lines and character analysis',
              'Language style and social problems addressed',
            ],
            objectives: [
              'Identify type of drama',
              'Determine themes in the text',
              'Identify story lines',
              'Find out characters in the book',
              'Appreciate language style of the play',
              'Appraise social problems raised',
              'Apply acquired knowledge to personal lives',
              'Identify moral lessons from the drama',
            ],
            aiPrompt: "Analyze the drama 'Ọjaadịlị' by Ọdụnke Artists. Discuss plot, characters, and themes. Explain social commentary in the play. Analyze language use and dramatic techniques. Provide moral lessons from the drama.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: CUSTOMS AND INSTITUTIONS (OMENALA NA ỤWUMEWU)',
        topics: [
          {
            id: 'C.1',
            title: 'Greetings and Social Etiquette (Ekele dị iche iche)',
            content: [
              'Morning, afternoon, evening greetings',
              'Greetings for meals, sick people, condolences',
              'Work greetings and other social situations',
            ],
            objectives: [
              'Describe customs of their people',
              'Determine rules guiding Igbo culture',
              'Describe importance of cultural aspects',
              'Identify changes due to civilization',
              'Explore environment for cultural appreciation',
            ],
            aiPrompt: "Explain Igbo greeting customs comprehensively. Detail ekele for different times and situations. Explain cultural significance of proper greetings. Provide examples of appropriate responses. Discuss modern adaptations of traditional greetings.",
          },
          {
            id: 'C.2',
            title: 'Marriage and Family Life',
            content: [
              'Marriage customs (Alụmdi na nwunye)',
              'Divorce procedures (Igba alụkwaghịm)',
              'Childbirth traditions',
              'Naming ceremonies and child upbringing',
            ],
            objectives: [
              'Describe marriage and family customs',
              'Explain traditional procedures',
              'Identify cultural values in family life',
            ],
            aiPrompt: "Explain Igbo marriage customs from igba ajụjụ to igba nkwụ. Detail childbirth traditions: ọmụmụ, ile ọmụgwọ, ibi ugwu. Explain naming ceremonies (igu aha) and child upbringing practices.",
          },
          {
            id: 'C.3',
            title: 'Traditional Titles and Leadership',
            content: [
              'Chieftaincy titles (Echichi)',
              'Nze na Ozo title system',
              'Kingship (Eze/Obi/Igwe)',
              'Women titles (Iyom/Loolo)',
            ],
            objectives: [
              'Describe traditional leadership structures',
              'Explain significance of title systems',
              'Identify roles of traditional rulers',
            ],
            aiPrompt: "Explain Igbo traditional title systems. Detail Nze na Ozo initiation processes. Discuss roles of Eze, Obi, and Igwe. Explain women\'s titles like Iyom and Loolo. Describe modern vs traditional leadership structures.",
          },
          {
            id: 'C.4',
            title: 'Death and Funeral Rites',
            content: [
              'Death rites (Ike ekpe, iri ekpe)',
              'Funeral ceremonies (Ikwa ozu)',
              'Mourning periods (Igba mkpe)',
            ],
            objectives: [
              'Describe funeral customs',
              'Explain cultural significance',
              'Identify variations across communities',
            ],
            aiPrompt: "Explain Igbo funeral rites comprehensively. Detail different stages: ike ekpe, iri ekpe, ikwa ozu. Discuss cultural beliefs about death and afterlife. Explain differences based on age, gender, and status.",
          },
          {
            id: 'C.5',
            title: 'Kinship and Social Organization',
            content: [
              'Umunna (patrilineage)',
              'Umuokpu/Umuada (women\'s groups)',
              'Ụmụnna, Iyomdi, Nwadiala',
              'Age grades (Ọgbọ/Ebiri/Uke)',
              'Community assemblies (Ọhaneze, Ezinaulo)',
            ],
            objectives: [
              'Describe kinship systems',
              'Explain social organization',
              'Identify roles of different groups',
            ],
            aiPrompt: "Explain Igbo kinship and social organization. Detail umunna, umuokpu, and ọgbọ systems. Discuss roles and responsibilities of each group. Explain how these systems maintain social order.",
          },
          {
            id: 'C.6',
            title: 'Taboos and Sacred Things (Arụ na Nsọala)',
            content: [
              'Forbidden things (Ihe nsọ)',
              'Sacred animals (Anụ nsọ)',
              'Sacred trees (Osisi nsọ)',
              'Sacred places (Ebe nsọ)',
            ],
            objectives: [
              'Identify cultural taboos',
              'Explain reasons for prohibitions',
              'Describe sacred elements in culture',
            ],
            aiPrompt: "Explain Igbo concepts of arụ (taboo) and nsọala (sacred). Detail common taboos and their cultural significance. Discuss sacred animals, trees, and places. Explain modern perspectives on traditional taboos.",
          },
          {
            id: 'C.7',
            title: 'Traditional Governance (Ọchịchị Ọdịnala)',
            content: [
              'Traditional rulers and councils',
              'Decision-making processes',
              'Conflict resolution mechanisms',
            ],
            objectives: [
              'Describe traditional governance',
              'Explain decision-making processes',
              'Identify conflict resolution methods',
            ],
            aiPrompt: "Explain Igbo traditional governance systems. Detail roles of Eze, Nze na Ozo, Umunna. Discuss democratic elements in Ọhaneze meetings. Explain traditional conflict resolution methods.",
          },
          {
            id: 'C.8',
            title: 'Hospitality and Social Rituals',
            content: [
              'Welcoming visitors (Nnabata ọbịa)',
              'Kola nut presentation (Oji na itu nzu)',
              'Prayers and libations (Igo ofo)',
              'Morning rituals (Ikwo aka uttụtụ)',
            ],
            objectives: [
              'Describe hospitality customs',
              'Explain ritual significance',
              'Identify proper procedures',
            ],
            aiPrompt: "Explain Igbo hospitality rituals comprehensively. Detail nnabata ọbịa procedures. Explain significance of oji (kola nut) and nzu (chalk). Discuss morning rituals and their cultural importance.",
          },
          {
            id: 'C.9',
            title: 'Traditional Religion and Worship',
            content: [
              'Divination (Igba afa)',
              'Sacrifices (Ichu àjà)',
              'Spirit worship (Igo mmụọ)',
              'Various deities (Ihe ofufe)',
            ],
            objectives: [
              'Describe traditional religious practices',
              'Explain worship procedures',
              'Identify major deities',
            ],
            aiPrompt: "Explain Igbo traditional religion. Detail major deities: Amadịọha, Anyanwụ, Ala. Discuss divination (igba afa) and sacrifice (ichu àjà) practices. Explain concepts of chi and ikenga.",
          },
          {
            id: 'C.10',
            title: 'Religious Objects and Beliefs',
            content: [
              'Sacred objects: Ofo, Ikenga, Okpesi',
              'Beliefs: reincarnation, destiny, spiritual forces',
              'Traditional concepts of the world',
            ],
            objectives: [
              'Identify religious objects',
              'Explain traditional beliefs',
              'Describe spiritual concepts',
            ],
            aiPrompt: "Explain Igbo religious objects and beliefs. Detail significance of ofo (justice staff), ikenga (personal god), okpesi (ancestral staff). Discuss beliefs in ilo uwa (reincarnation), ọdịnaya (destiny), and spiritual forces.",
          },
          {
            id: 'C.11',
            title: 'Wealth and Land Ownership (Akụnaụba)',
            content: [
              'Land ownership (Inwe ala)',
              'Land strength (Ike ala)',
              'Ancestral worship at land shrines',
              'Animal husbandry practices',
            ],
            objectives: [
              'Describe land ownership systems',
              'Explain concepts of wealth',
              'Identify traditional economic practices',
            ],
            aiPrompt: "Explain Igbo concepts of wealth and land ownership. Detail ala (land) significance in Igbo culture. Discuss traditional economic practices and wealth accumulation. Explain rituals related to land and property.",
          },
          {
            id: 'C.12',
            title: 'Secret Societies and Masquerades (Abamaba)',
            content: [
              'Secret societies: Mmọnwụ, Okonko, Ekpe',
              'Masquerades: Omabe, Odo',
              'Traditional doctors (Dibia)',
            ],
            objectives: [
              'Describe secret societies',
              'Explain masquerade traditions',
              'Identify roles of traditional healers',
            ],
            aiPrompt: "Explain Igbo secret societies and masquerades. Detail different types: mmọnwụ, okonko, ekpe. Discuss masquerade traditions: omabe, odo. Explain roles of dibia (traditional doctors) in society.",
          },
          {
            id: 'C.13',
            title: 'Games and Sports (Egwuregwu)',
            content: [
              'Traditional wrestling (Mgba)',
              'Dance competitions (Egwu ọnwa)',
              'Board games (Izu okwe)',
              'Masquerade performances (Icho oro)',
            ],
            objectives: [
              'Describe traditional games',
              'Explain sports competitions',
              'Identify cultural entertainment',
            ],
            aiPrompt: "Explain Igbo traditional games and sports. Detail mgba (wrestling) rules and significance. Discuss egwu ọnwa (moonlight games) and izu okwe (board games). Explain cultural importance of sports.",
          },
          {
            id: 'C.14',
            title: 'Traditional Occupations (Akarrụ ndị Igbo)',
            content: [
              'Farming (Ọrụ ugbo)',
              'Fishing (Iku azụ)',
              'Trading (Izu ahịa)',
              'Craftsmanship: pottery, blacksmithing, herbalism',
            ],
            objectives: [
              'Describe traditional occupations',
              'Explain occupational specialties',
              'Identify skill transmission methods',
            ],
            aiPrompt: "Explain Igbo traditional occupations. Detail ọrụ ugbo (farming) methods and seasons. Discuss izu ahịa (trading) networks. Explain craftsmanship: ikpu ite (pottery), ime ọfọ (blacksmithing), ime dibia (herbalism).",
          },
          {
            id: 'C.15',
            title: 'Festivals and Ceremonies (Emume)',
            content: [
              'Ofala festival',
              'New yam festival (Iri ji/Iwa ji)',
              'Marriage ceremonies (Ibo ụzọ)',
              'Other community festivals',
            ],
            objectives: [
              'Describe major festivals',
              'Explain ceremonial procedures',
              'Identify cultural significance',
            ],
            aiPrompt: "Explain Igbo festivals and ceremonies. Detail Ofala festival for kings. Discuss new yam festival (iri ji) significance. Explain marriage ceremonies (ibo ụzọ) and other community festivals.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: GENERAL AND CURRENT AFFAIRS (IHE NDỊ NA-EME UGbuA)',
        topics: [
          {
            id: 'D.1',
            title: 'Topical Issues in Igbo Language and Culture',
            content: [
              'Ahịajịọkụ lectures',
              'Odenigbo lectures',
              'Ọhaneze Ndị Igbo activities',
            ],
            objectives: [
              'Identify dates, themes and functions of lectures',
              'Understand contemporary Igbo cultural discourse',
              'Engage with current Igbo intellectual activities',
            ],
            aiPrompt: "Explain contemporary Igbo cultural institutions. Detail Ahịajịọkụ and Odenigbo lecture series. Discuss Ọhaneze Ndị Igbo role in cultural preservation. Explain current debates in Igbo language development.",
          },
          {
            id: 'D.2',
            title: 'Igbo Literary Works Information',
            content: [
              'Authors, publishers, and publication details',
              'Igbo Studies Association (ISA)',
              'Contemporary Igbo writers and publications',
            ],
            objectives: [
              'Identify authors, publishers and publication dates',
              'Acquaint with Igbo Studies Association functions',
              'Know contemporary Igbo literary landscape',
            ],
            aiPrompt: "Provide information on Igbo authors and publications. Detail major Igbo writers and their works. Explain Igbo Studies Association (ISA) contributions. Discuss contemporary trends in Igbo literature.",
          },
          {
            id: 'D.3',
            title: 'Current Social Issues (Okwuakpụnonụ)',
            content: [
              'HIV/AIDS, Cancer, Coronavirus (Ọrịa)',
              'Drug Abuse (Iri ọgwụ agharaaghar)',
              'Cultism (Otu Nzuzo)',
              'Women and Children\'s Rights',
              'Human Rights Violation and Child Abuse',
              'Religious Conflicts',
              'Kidnapping (Ntọrọ mmadụ)',
            ],
            objectives: [
              'Acquaint themselves with current issues',
              'Examine their effects on society',
              'Suggest remedies to the problems',
            ],
            aiPrompt: "Discuss current social issues in Igbo context. Explain terms for modern problems in Igbo language. Discuss effects of drug abuse, cultism, kidnapping. Suggest traditional and modern solutions. Provide Igbo vocabulary for discussing social issues.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Agu-Ofodile, M.C. (2007). Nkuzi Asụsụ Igbo N\'ụzọ Dị Mfe Maka Ndị Sịnịp Sekọndịrị Nke Atọ',
          'Uba – Mgbemena, A. (2006): Ntụpala Usoroasụsụ Igbo',
          'Ofili, D. N., Anozie C. C. and Chukwu, A. O. (2012): Lingwịstịlikị Sayensị Asụsụ II',
          'Ezikeojiaku, P. A., Okebalama, C. N., Onweluzo, C. N. and Ekwe B. U. (1991). Ule Igbo Maka Sịnịp Sekọndịrị',
          'Anozie, C. C. (2003). Igbo Kwenu: Akụkọ na Omenala ndị Igbo',
          'Ikekeonwu, C., Ezikeojiaku, P. A., Ubani, A. and Ugaji, J. (1999). Fonọlọjị na Grama Igbo',
          'Emenanjo, E. N., Dike, O. N., Agomo S. N. and Ezeuko , R. O. (1999). Exam Focus Maka WASSCE Na UTME',
          'Ofomata, C. E. (2005): Mdezu Ụtọasụsụ Igbo',
          'Nzeako, J. U. T. (1972). Omenala Ndị Igbo',
          'Okoye, O. F. S., Ofoegbu, N. F. and Ezidiegwu, B. L. (1997) Ogbara Ọhụrụ Ụtọasụsụ Igbo maka Sịnịp Sekọndịrị',
          'Osuagwu, B. I. N. (1979). Ndị Igbo na Omenala Ha',
          'Ubesie, T. U. (1978). Ọdịnala Ndị Igbo',
          'Umeh, I. O. A., Onyekaonwu, G. O., Nwadike, I. U. and Okeke I. O. (1992). Ụtọasụsụ na Agụmagụ Igbo nke Sịnịp Sekọndịrị Sukụl',
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
        AsyncStorage.getItem('igbo_ai_explanations'),
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
    const systemPrompt = 'You are an expert Igbo language and culture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Igbo examples and cultural context. Use proper Igbo orthography with tone marks. Format in markdown.';
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
      await AsyncStorage.setItem('igbo_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with Igbo cultural context.',
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
      const prompt = `As an Igbo language and culture expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Igbo Studies:
1. Start with a clear definition in ## H2 heading
2. Use proper Igbo orthography with tone marks (e.g., ụ, ị, ọ, ụdaolu)
3. Provide Igbo terms with English translations in parentheses
4. Include cultural context and practical examples
5. Explain concepts with reference to specific Igbo communities
6. Highlight key learning points with **bold**
7. Include proverbs (ilu) and idioms where relevant
8. Provide practice exercises with solutions
9. Connect traditional knowledge with modern applications

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key Igbo terms
- Use > for important proverbs or sayings
- Include Igbo text in proper orthography
- Make it engaging for Nigerian students

Write in clear, educational Igbo instruction style with cultural sensitivity.`;

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
              content: 'You are an expert Igbo language and culture tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Igbo examples and cultural context. Use proper Igbo orthography with tone marks. Format in markdown.'
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
              await AsyncStorage.removeItem('igbo_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Igbo explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "translate" : "lock"} 
              size={14} 
              color="#fff" 
              style={styles.aiIcon}
            />
            <Text style={styles.aiButtonText}>
              {isSaved ? 'AI Notes' : isPremiumActivated ? 'AI Kọwaa' : 'Locked'}
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
            color="#006600" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#006600" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#006600" style={styles.bulletIcon} />
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
                        color="#008800" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#006600" />
                              <Text style={styles.subsectionTitle}>Ihe Ndị A Na-akụzi:</Text>
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
                              <Icon name="school" size={16} color="#006600" />
                              <Text style={styles.subsectionTitle}>Ebumnuche Ịmụta:</Text>
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
            <Text style={styles.subscriptionTitle}>Kpọghee Atụmatụ Premium</Text>
            <Text style={styles.subscriptionSubtitle}>Unlock Premium Features</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006600" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Igbo Explanations</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with proper Igbo orthography and cultural context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006600" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Igbo Language & Grammar</Text>
                <Text style={styles.featureDescription}>Comprehensive Igbo grammar, phonetics, and language structure</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006600" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Igbo Culture & Literature</Text>
                <Text style={styles.featureDescription}>Detailed coverage of Igbo customs, literature, and omenala</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#006600" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Character Credits</Text>
                <Text style={styles.featureDescription}>Access AI explanations with character-based credit system</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Atụmatụ Premium</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Igbo Studies</Text>
            </View>
          </View>

          <View style={styles.subscriptionFooter}>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.cancelButton]}
              onPress={() => setSubscriptionModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Hapụ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subscriptionButton, styles.activateButton]}
              onPress={activatePremium}
            >
              <Icon name="lock-open" size={20} color="white" />
              <Text style={styles.activateButtonText}>Kpọghee Premium</Text>
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
      <Text style={styles.headerTitle}>IGBO</Text>
      <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
      <Text style={styles.headerIgbo}>Ụtọasụsụ Igbo nke UTME</Text>
    </View>
  </View>
  <View style={styles.headerRight}>
    {!isPremiumActivated ? (
      <View style={styles.headerRightStack}>
        <TouchableOpacity 
          style={styles.premiumButton}
          onPress={() => setSubscriptionModalVisible(true)}
        >
          <Icon name="workspace-premium" size={16} color="#FFD700" />
          <Text style={styles.premiumButtonText}>Premium</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearAllExplanations}
        >
          <Icon name="delete-sweep" size={20} color="white" />
          <Text style={styles.clearButtonText}>Hichapụ AI</Text>
        </TouchableOpacity>
      </View>
    ) : aiLimit > 0 ? (
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
          <Text style={styles.clearButtonText}>Hichapụ AI</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        style={styles.clearButton}
        onPress={clearAllExplanations}
      >
        <Icon name="delete-sweep" size={20} color="white" />
        <Text style={styles.clearButtonText}>Hichapụ AI</Text>
      </TouchableOpacity>
    )}
  </View>
</View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Icon name="info" size={20} color="#006600" />
            <Text style={styles.infoTitle}>Ka E Si Eji Ya</Text>
            <Text style={styles.infoTitleEnglish}>(How to Use)</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#006600" />
              <Text style={styles.tipText}>Pịa isiokwu iji mepee/mechie</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "translate" : "lock"} size={16} color={isPremiumActivated ? "#FF6600" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Kọwaa maka nkọwa n\'Igbo' : 'Kpọghee premium maka nkọwa AI'}
              </Text>
            </View>
            {isPremiumActivated && aiLimit > 0 && (
              <View style={styles.tipItem}>
                <Icon name="bar-chart" size={16} color="#2196f3" />
                <Text style={styles.tipText}>
                  {aiLimit.toLocaleString()} mkpụrụedemede AI dị
                </Text>
              </View>
            )}
            <View style={styles.tipItem}>
              <Icon name="save" size={16} color="#2196f3" />
              <Text style={styles.tipText}>A na-echekwa nkọwa AI maka iji mgbe ịnweghị ịntanetị</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="translate" size={16} color="#006600" />
              <Text style={styles.tipText}>Gụnyere ederede Igbo na nkọwa n\'asụsụ Bekee</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} isiokwu nwere ndetu AI echekwara
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
                <Icon name="translate" size={20} color="#006600" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Nkọwa AI
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
                  <ActivityIndicator size="large" color="#006600" />
                  <Text style={styles.loadingText}>
                    Na-ewepụta nkọwa AI na mkpụrụedemede Igbo...
                  </Text>
                  <Text style={styles.loadingTextEnglish}>
                    Generating AI explanation with Igbo text...
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
                <Icon name="share" size={20} color="#006600" />
                <Text style={styles.modalActionText}>Kesa</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Echekwara', 'Echekwara nkọwa AI nke ọma!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Chekwaa Ndetu
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
          <Text style={styles.checkingLimitText}>Na-enyocha kredit AI...</Text>
        </View>
      )}
    </View>
  );
};

// Markdown styles for Igbo
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
    color: '#004400',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#006600',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#008800',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#004400',
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
    color: '#006600',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#006600',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#006600',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F0FFF0',
    borderLeftWidth: 4,
    borderLeftColor: '#006600',
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
  backgroundColor: '#006600',
  padding: 20,
  paddingTop:40,
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
  alignItems: 'flex-end', // Changed from 'center' to 'flex-end'
  gap: 4, // Reduced gap for vertical stacking
},
headerRightStack: {
  alignItems: 'center', // Center the stacked items
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
headerIgbo: {
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
  marginBottom: 4, // Added margin to separate from clear button
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
    color: '#006600',
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
    color: '#004400',
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
    color: '#006600',
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
    backgroundColor: '#006600',
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
    color: '#006600',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#006600',
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
    color: '#006600',
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
    borderColor: '#006600',
  },
  saveButton: {
    backgroundColor: '#006600',
    borderColor: '#006600',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006600',
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
    backgroundColor: '#006600',
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
    color: '#006600',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#006600',
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
    backgroundColor: '#006600',
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
    backgroundColor: "rgba(0, 102, 0, 0.9)",
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

export default IgboSyllabusScreen;