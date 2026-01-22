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

const ChristianReligiousStudiesScreen = () => {
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

  // Christian Religious Studies Data from PDF
  const crsData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Acquire the knowledge and understanding of the tenets of the Christian faith as contained in the Bible',
          'Interpret biblical teachings and themes',
          'Apply biblical teachings and tenets to life in society',
          'Evaluate the level of application of biblical teachings and tenets to life in society',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: Themes from Creation to the Division of the Kingdom',
        topics: [
          {
            id: 'A1',
            title: 'The Sovereignty of God',
            content: [
              'God as Creator and Controller of the Universe',
              'Bible References: Genesis 1-2, Amos 9:5-6, Isaiah 45:5-12, Psalm 19:1-6, Jeremiah 18:1-16, Romans 8:28',
              'Key Concepts: Sovereignty, Creation Process, Sequence of Creation',
            ],
            objectives: [
              'Define the term "sovereignty"',
              'Analyze God\'s process of creation',
              'Interpret the sequence of creation',
              'Identify man\'s role in advancing God\'s purpose in creation',
            ],
            aiPrompt: "Explain the sovereignty of God as Creator and Controller of the universe. Discuss creation accounts in Genesis 1-2. Analyze God's sovereignty in other Bible passages: Amos 9:5-6, Isaiah 45:5-12, Psalm 19, Jeremiah 18, Romans 8:28. Explain man's role in God's creation purpose.",
          },
          {
            id: 'A2',
            title: 'The Covenant',
            content: [
              '(a) The flood and God\'s covenant with Noah (Genesis 6-9)',
              '(b) God\'s covenant with Abraham (Genesis 11:31-32; 12:1-9; 17:1-21; 21:1-13; 25:19-26)',
              '(c) God\'s covenant with Israel (Exodus 19-20; 24:1-11; Deuteronomy 28:1-19)',
              '(d) The New Covenant (Jeremiah 31:31-34; Ezekiel 36:25-28)',
            ],
            objectives: [
              'Explain the concept of covenant',
              'Examine the importance and implication of the covenants',
              'Distinguish between God\'s covenants with Noah, Abraham and Israel',
              'Distinguish between the old and the new covenants',
            ],
            aiPrompt: "Explain biblical covenants comprehensively. Cover: Noahic covenant, Abrahamic covenant, Mosaic covenant, New Covenant. Compare and contrast each covenant's terms, promises, and significance. Discuss Jeremiah 31:31-34 and Ezekiel 36:25-28 on the New Covenant.",
          },
          {
            id: 'A3',
            title: 'Leadership Qualities',
            content: [
              'Examples of Joseph (Genesis 37, 41, 45)',
              'Examples of Moses (Exodus 1-4, 12; Numbers 13-14)',
              'Examples of Joshua (Numbers 13, 27; Joshua 1, 6-7, 24)',
              'Examples of Judges: Deborah (Judges 4), Gideon (Judges 6), Samson (Judges 13, 16)',
            ],
            objectives: [
              'Examine the circumstances that gave rise to the leadership of Joseph, Moses, Joshua and the Judges',
              'Identify the major talents of these leaders',
              'Assess God\'s role in the works of these leaders',
              'Analyze the achievements of these leaders',
            ],
            aiPrompt: "Analyze biblical leadership qualities through Joseph, Moses, Joshua, and Judges. Discuss their calling, challenges, and achievements. Identify leadership principles applicable today. Show God's role in developing and using leaders.",
          },
          {
            id: 'A4',
            title: 'Divine Providence, Guidance and Protection',
            content: [
              '(a) Guidance and Protection (Genesis 24, 28, 46; Exodus 13-14)',
              '(b) Provision (Genesis 21-22; Exodus 16-17; Numbers 20; 1 Kings 17)',
            ],
            objectives: [
              'Identify the different ways by which God guided and protected the people of Israel',
              'Specify how God provided for His people',
              'Identify the different occasions when God provided for Israel',
            ],
            aiPrompt: "Explain divine providence, guidance and protection in the Bible. Use examples: Abraham's servant (Genesis 24), Jacob's dream (Genesis 28), Exodus guidance, provision of manna and water. Discuss application to Christian life today.",
          },
          {
            id: 'A5',
            title: 'Parental Responsibility',
            content: [
              'Examples of Eli and Samuel (1 Samuel 2-4, 8)',
              'Examples of David (2 Samuel 13, 15, 18-19)',
              'Examples of Asa (1 Kings 15, 22; cf. Deuteronomy 6, Proverbs)',
            ],
            objectives: [
              'Determine the extent to which Eli, Samuel and David were responsible for the shortcomings of their children',
              'Describe how Asa pleased God',
            ],
            aiPrompt: "Analyze parental responsibility from biblical examples: Eli's failure with sons, David's family problems, Asa's godly leadership. Discuss principles from Deuteronomy 6 and Proverbs on child training. Apply to modern parenting challenges.",
          },
          {
            id: 'A6',
            title: 'Obedience and Disobedience',
            content: [
              'Obedience and Rewards: Abraham (Genesis 22), Three Hebrew youth (Daniel 3), David (1 Samuel 30)',
              'Disobedience and Consequences: Adam (Genesis 2-3), Collection of Manna (Exodus 16), Golden Calf (Exodus 32), Moses (Numbers 20), Saul (1 Samuel 10, 15-16, 31)',
            ],
            objectives: [
              'Determine why Abraham, the three Hebrew youths and David obeyed God',
              'Identify the rewards for obedience',
              'Compare the disobedience of Adam, the people of Israel, Moses and Saul',
              'Indicate the reasons for their disobedience',
              'Identify the consequences of disobedience',
            ],
            aiPrompt: "Contrast obedience and disobedience in the Bible. Analyze examples: Abraham's sacrifice, Shadrach/Meshach/Abednego, David. Discuss disobedience: Adam, Israel's complaints, Golden Calf, Moses striking rock, Saul's disobedience. Show consequences and lessons.",
          },
          {
            id: 'A7',
            title: 'A Man After God\'s Own Heart',
            content: [
              'The early life of David (1 Samuel 16-18, 22, 24; 2 Samuel 2-3)',
              'David\'s submission to the will of God (1 Samuel 26; 2 Samuel 12)',
              'David\'s repentance and forgiveness (2 Samuel 11-12; Psalm 51)',
            ],
            objectives: [
              'Identify David\'s anointing experience',
              'Specify how David submitted to the will of God',
              'Examine the situations that led to David\'s sin and repentance',
              'Identify why God forgave David',
            ],
            aiPrompt: "Analyze David as 'a man after God\'s own heart'. Cover: anointing, Goliath victory, friendship with Jonathan, sparing Saul, Bathsheba sin, repentance in Psalm 51. Discuss why God forgave David and lessons for Christians.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: Themes from Division of Kingdom to Return from Exile and Prophets',
        topics: [
          {
            id: 'B1',
            title: 'Greed and its Effects',
            content: [
              'Examples of Ahab (1 Kings 21-22; 2 Kings 9:30-37)',
              'Examples of Gehazi (2 Kings 5) cf. Joshua 7',
            ],
            objectives: [
              'Deduce the meaning of greed',
              'Distinguish between Ahab and Gehazi\'s greed',
              'Analyze the consequences of Ahab and Gehazi\'s greed',
            ],
            aiPrompt: "Explain greed and its consequences through Ahab (Naboth's vineyard) and Gehazi (Naaman's gift). Compare with Achan's sin (Joshua 7). Discuss modern applications and Christian perspective on contentment.",
          },
          {
            id: 'B2',
            title: 'The Supremacy of God',
            content: [
              'Religious tension and the power of God on Mount Carmel (1 Kings 16-19)',
            ],
            objectives: [
              'Assess the religious situation in Israel at the time of Elijah and Ahab',
              'Identify the characters involved in the contest on Mount Carmel',
              'Differentiate between God\'s power and that of Baal',
            ],
            aiPrompt: "Analyze the Mount Carmel contest (1 Kings 18). Discuss religious syncretism in Ahab's Israel, Baal worship vs. Yahweh worship. Explain the significance of God's fire and rain. Lessons for faith today.",
          },
          {
            id: 'B3',
            title: 'Religious Reforms in Judah',
            content: [
              'Cleansing of the Temple (2 Kings 22)',
              'Renewal of the Covenant (2 Kings 23:1-30)',
            ],
            objectives: [
              'Analyze Josiah\'s religious reforms',
              'Determine the reasons for the renewal of the covenant',
              'Assess the significance of the reforms',
            ],
            aiPrompt: "Explain Josiah's religious reforms. Discuss discovery of the Book of the Law, temple cleansing, Passover restoration, covenant renewal. Analyze significance for Judah's spiritual revival and lessons for church renewal.",
          },
          {
            id: 'B4',
            title: 'Concern for Judah',
            content: [
              'The fall of Jerusalem (2 Kings 24-25)',
              'Condition of Judah (Nehemiah 1; Ezra 1)',
              'Response to the state of Judah (Nehemiah 2, 4; Ezra 3, 5-7)',
            ],
            objectives: [
              'Identify the reasons for the fall of Jerusalem',
              'Examine the condition of Judah during the exile',
              'Analyze the people\'s response to the call of Nehemiah and Ezra to rebuild Jerusalem',
              'Distinguish between Nehemiah and Ezra\'s responses to opposition',
            ],
            aiPrompt: "Analyze Judah's exile and return. Discuss Babylonian captivity causes, Cyrus' decree, Ezra's spiritual rebuilding, Nehemiah's wall rebuilding. Compare Ezra and Nehemiah's leadership styles and responses to opposition.",
          },
          {
            id: 'B5',
            title: 'Faith, Courage and Protection',
            content: [
              'Examples of Daniel, Shadrach, Meshach and Abednego (Daniel 3, 6)',
            ],
            objectives: [
              'Analyze the stories of Shadrach, Meshach, Abednego and Daniel',
              'Determine the occasions in which the four men demonstrated faith',
              'Analyze the effects of the faith of the four men on the Babylonians',
            ],
            aiPrompt: "Analyze faith and courage in Daniel's stories: fiery furnace (Daniel 3), lion's den (Daniel 6). Discuss political pressure, religious compromise, and unwavering faith. Impact on Babylonian officials and lessons for Christians.",
          },
          {
            id: 'B6',
            title: 'God\'s Message to Nineveh',
            content: [
              'Jonah and his message (Jonah 1-4)',
            ],
            objectives: [
              'Analyze the story of Jonah\'s call',
              'Describe the consequences of Jonah\'s disobedience',
              'Assess the effect of Jonah\'s message on the Ninevites',
              'Emulate the example of the Ninevites',
            ],
            aiPrompt: "Analyze Jonah's story comprehensively. Discuss Jonah's call, flight to Tarshish, storm, fish, Nineveh preaching, repentance, Jonah's anger. Themes: God's mercy, missionary calling, repentance. Ninevites as model of repentance.",
          },
          {
            id: 'B7',
            title: 'Social Justice, True Religion and Divine Love',
            content: [
              'Social justice and true religion (Amos 2:6-8; 4-8; James 1:19-27)',
              'Divine love and human response (Hosea 1-4, 6, 14)',
            ],
            objectives: [
              'Determine what true religion is',
              'Identify the ills that led to the call for social justice in Amos\' time',
              'Examine the condition in Israel during Hosea\'s time',
              'Analyze Hosea\'s portrayal of divine love and human response',
            ],
            aiPrompt: "Analyze prophetic messages on social justice (Amos) and divine love (Hosea). Discuss Amos' condemnation of economic oppression, religious hypocrisy. Hosea's marriage as metaphor for God's covenant love. Connect with James 1:27 on true religion.",
          },
          {
            id: 'B8',
            title: 'Holiness and Divine Call',
            content: [
              'Calls of Isaiah (Isaiah 6), Ezekiel (Ezekiel 2-3), Jeremiah (Jeremiah 1:4-10)',
            ],
            objectives: [
              'Distinguish the calls of Isaiah, Ezekiel and Jeremiah',
              'Compare the assignments given to these prophets',
              'Determine the need for God\'s people to be holy',
            ],
            aiPrompt: "Compare prophetic calls: Isaiah's temple vision, Ezekiel's scroll eating, Jeremiah's prenatal calling. Discuss themes: holiness, prophetic mission, human inadequacy, God's empowerment. Relevance for Christian calling today.",
          },
          {
            id: 'B9',
            title: 'Punishment and Hope',
            content: [
              'Punishment and restoration themes (Jeremiah 3, 32; Ezekiel 18, 37; Isaiah 61; Jeremiah 4:5-8)',
            ],
            objectives: [
              'Describe the situations that led to the punishment of Israel',
              'Identify the conditions for hope',
              'Determine the benefits of restoration',
            ],
            aiPrompt: "Analyze biblical themes of punishment and hope. Discuss exile as judgment, conditions for restoration (repentance, new heart), restoration promises (dry bones - Ezekiel 37, new covenant). Messianic hope in Isaiah 61.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: Themes from the Four Gospels and Acts of the Apostles',
        topics: [
          {
            id: 'C1',
            title: 'The Birth and Early Life of Jesus',
            content: [
              'John the Baptist as forerunner (Luke 1, 3, 7; Mark 1, 6; Matthew 3, 11; John 1, 3)',
              'Birth and boyhood of Jesus (Matthew 1-2; Luke 1-2)',
            ],
            objectives: [
              'Compare the stories of the births of John and Jesus',
              'Assess the importance of John as the forerunner of Jesus',
              'Describe the boyhood of Jesus',
            ],
            aiPrompt: "Compare births of John the Baptist and Jesus. Discuss annunciations, miraculous elements, John's prophetic role, Jesus' childhood (temple at age 12). Theological significance of Incarnation.",
          },
          {
            id: 'C2',
            title: 'The Baptism and Temptation of Jesus',
            content: [
              'Baptism of Jesus (Matthew 3; Mark 1; Luke 3)',
              'Temptation of Jesus (Matthew 4; Luke 4)',
            ],
            objectives: [
              'Determine the meaning and purpose of the baptism of Jesus',
              'Enumerate the temptations of Jesus',
              'Examine the significance of the temptations of Jesus',
            ],
            aiPrompt: "Analyze Jesus' baptism and temptation. Discuss baptismal significance (identification, anointing, Trinity revelation). Temptations: stones to bread, temple jump, worship Satan. Christological and ethical implications.",
          },
          {
            id: 'C3',
            title: 'Discipleship',
            content: [
              'Call of the first disciples (Matthew 4, 9; Mark 1-2; Luke 5)',
              'Demands of discipleship (Matthew 8; Luke 9, 14)',
            ],
            objectives: [
              'Identify the first disciples to be called by Jesus',
              'Determine the demands of discipleship',
            ],
            aiPrompt: "Explain biblical discipleship. Discuss call of Peter/Andrew/James/John/Matthew. Demands: counting cost, denial, cross-bearing. Compare with modern Christian discipleship challenges.",
          },
          {
            id: 'C4',
            title: 'Miracles of Jesus',
            content: [
              'Nature miracles: calming storm, feeding 5000, walking on water, water to wine',
              'Miracles of resuscitation: Lazarus, Jairus\' daughter, widow\'s son',
              'Healing miracles: lepers, paralytic, centurion\'s servant, blind',
              'Exorcism: Gerasene demoniac, epileptic boy',
            ],
            objectives: [
              'Classify the different miracles of Jesus',
              'Indicate the occasion of each of the miracles',
              'Examine the significance of each of the miracles',
            ],
            aiPrompt: "Classify and analyze Jesus' miracles. Categories: nature, healing, exorcism, resuscitation. Theological significance: Kingdom manifestation, faith requirements, Christological claims. Select key miracles for detailed analysis.",
          },
          {
            id: 'C5',
            title: 'The Parables',
            content: [
              'Parables of the kingdom: sower, weeds, drag-net, wedding garment',
              'Parables about love of God: lost sheep, lost coin, prodigal son',
              'Parables about love for one another: Good Samaritan, rich man and Lazarus',
              'Parable about wealth: rich fool',
              'Parables on prayer: persistent widow, Pharisee and tax collector',
            ],
            objectives: [
              'Classify the different parables of Jesus',
              'Identify the occasion of each parable',
              'Interpret the meaning of each parable',
              'Give reasons why Jesus taught in parables',
            ],
            aiPrompt: "Analyze Jesus' parables by category: Kingdom, God's love, neighbor love, wealth, prayer. Discuss purpose of parabolic teaching. Interpret selected parables with context and application.",
          },
          {
            id: 'C6',
            title: 'Sermon on the Mount',
            content: [
              'Beatitudes and teachings (Matthew 5-6; Luke 6:17-26)',
            ],
            objectives: [
              'Analyze the teachings on the Mount',
              'Identify the demands of the Kingdom',
              'Determine the consequences of placing worldly possessions above heavenly treasures',
              'Associate the rewards for obedience with the sermon on the Mount',
            ],
            aiPrompt: "Analyze Sermon on the Mount comprehensively. Cover: Beatitudes, salt/light, law fulfillment, anger, lust, divorce, oaths, retaliation, enemy love, almsgiving, prayer, fasting, wealth, anxiety. Kingdom ethics vs. worldly values.",
          },
          {
            id: 'C7',
            title: 'Mission of the Disciples',
            content: [
              'Mission of the twelve (Matthew 10; Mark 6; Luke 9)',
              'Mission of the seventy (Luke 10)',
            ],
            objectives: [
              'Distinguish between the mission of the twelve and the seventy',
              'Specify the instructions to the disciples',
              'Assess the outcomes of the missions',
            ],
            aiPrompt: "Compare missions of twelve and seventy disciples. Discuss instructions: travel light, rely on hospitality, preach Kingdom, heal. Significance for early church and modern mission strategy.",
          },
          {
            id: 'C8',
            title: 'The Great Confession',
            content: [
              'Peter\'s confession at Caesarea Philippi (Matthew 16; Mark 8; Luke 9)',
            ],
            objectives: [
              'Analyze the confession by Peter',
              'Identify the occasion of the Great Confession',
              'Examine the significance of the Great Confession',
            ],
            aiPrompt: "Analyze Peter's confession 'You are the Christ'. Discuss geographical setting (Caesarea Philippi), Jesus' question, Peter's revelation, Jesus' response, prediction of suffering. Christological significance.",
          },
          {
            id: 'C9',
            title: 'The Transfiguration',
            content: [
              'Transfiguration event (Matthew 17; Mark 9; Luke 9)',
            ],
            objectives: [
              'Trace the events leading to the Transfiguration',
              'Determine the significance of the Transfiguration to the disciples',
              'Identify the personalities involved in the Transfiguration account',
            ],
            aiPrompt: "Analyze Transfiguration event. Discuss timing (after Peter's confession), participants (Peter/James/John), figures (Moses, Elijah), divine voice,下山指令. Significance: confirmation of Jesus' identity, preview of glory.",
          },
          {
            id: 'C10',
            title: 'Triumphal Entry and Temple Cleansing',
            content: [
              'Triumphal Entry into Jerusalem (Matthew 21; Mark 11; Luke 19)',
              'Cleansing of the Temple',
            ],
            objectives: [
              'Recount the Triumphal Entry and the cleansing of the Temple',
              'Determine the significance of the Triumphal Entry and the cleansing of the Temple',
              'Examine how the cleansing of the Temple caused hostility towards Jesus',
            ],
            aiPrompt: "Analyze Triumphal Entry (Palm Sunday) and Temple cleansing. Discuss Zechariah 9:9 fulfillment, crowd's misunderstanding, Temple corruption, Jesus' authority claim. Connection to growing opposition leading to crucifixion.",
          },
          {
            id: 'C11',
            title: 'The Last Supper',
            content: [
              'Last Supper accounts (Matthew 26; Mark 14; Luke 22; John 13)',
            ],
            objectives: [
              'Trace the story of the Last Supper',
              'Evaluate the significance of the Last Supper',
            ],
            aiPrompt: "Analyze Last Supper comprehensively. Discuss Passover context, foot washing, betrayal prediction, institution of Lord's Supper (Eucharist), new covenant. Theological significance for Christianity.",
          },
          {
            id: 'C12',
            title: 'Trials and Death of Jesus',
            content: [
              'Trials before High Priest, Pilate, Herod (Matthew 26-27; Mark 14-15; Luke 22-23; John 18-19)',
              'Crucifixion and burial (Matthew 27; Mark 15; Luke 23; John 19)',
            ],
            objectives: [
              'Analyze the different trials of Jesus',
              'Describe the crucifixion and burial of Jesus',
              'Deduce the lessons of the death of Jesus',
            ],
            aiPrompt: "Analyze Jesus' trials and crucifixion. Discuss illegal night trial before Caiaphas, Pilate's political dilemma, Herod's mockery, crowd manipulation, crucifixion details (seven words), burial. Theological significance: atonement, substitution.",
          },
          {
            id: 'C13',
            title: 'Resurrection, Appearances and Ascension',
            content: [
              'Resurrection accounts (Matthew 28; Mark 16; Luke 24; John 20; Acts 1)',
            ],
            objectives: [
              'Trace the stories of the resurrection, appearances and ascension of Jesus',
              'Compare the personalities involved in the stories',
              'Analyze the relevance of the resurrection and ascension of Jesus',
            ],
            aiPrompt: "Analyze resurrection narratives comprehensively. Discuss empty tomb, angelic announcements, appearances to Mary Magdalene, disciples, Thomas. Ascension (Acts 1). Historical evidence and theological significance.",
          },
          {
            id: 'C14',
            title: 'Jesus\' Teachings About Himself',
            content: [
              'Bread of Life and Living Water (John 4, 6)',
              'Light of the World (John 1, 3, 8-9, 12; 1 John 1)',
              'Door, Lamb and Good Shepherd (John 1, 10)',
              'True Vine (John 15)',
              'Resurrection (John 11:25)',
            ],
            objectives: [
              'Analyze the different teachings of Jesus about Himself',
              'Deduce the reasons for Jesus\' teachings about Himself',
              'Interpret the meanings of the symbols used by Jesus about Himself',
            ],
            aiPrompt: "Analyze Jesus' 'I am' statements in John's Gospel. Discuss each metaphor: Bread of Life, Light, Door, Good Shepherd, Resurrection, Vine. Old Testament background and Christological significance.",
          },
          {
            id: 'C15',
            title: 'Love',
            content: [
              'God\'s love for man (John 3:16-18)',
              'Love for one another (John 13:34-35; 15:12-13; 1 John 4; 1 Corinthians 13)',
            ],
            objectives: [
              'Describe God\'s love for man',
              'Specify the ways they can love one another',
              'Evaluate the significance of love',
            ],
            aiPrompt: "Analyze biblical teachings on love. Discuss agape love: God's love in Christ (John 3:16), new commandment (John 13), sacrificial love (John 15), 1 Corinthians 13 characteristics. Practical applications.",
          },
          {
            id: 'C16',
            title: 'Fellowship in the Early Church',
            content: [
              'Communal living (Acts 1-2, 4)',
              'Problems and solutions (Acts 5-6)',
            ],
            objectives: [
              'Identify the reasons for communal living in the Early Church',
              'Identify the problems of communal living and their solutions',
              'Examine how communal living helped the growth of the Early Church',
            ],
            aiPrompt: "Analyze early Christian community in Acts. Discuss Pentecost aftermath, sharing possessions, daily teaching/fellowship, Ananias/Sapphira incident, deacon appointment. Principles for modern Christian community.",
          },
          {
            id: 'C17',
            title: 'Holy Spirit and Mission of the Church',
            content: [
              'Pentecost (Acts 1-2)',
              'Mission of the Church (Acts 8)',
            ],
            objectives: [
              'Trace the story of the Pentecost',
              'Examine the significance of the Pentecost experience',
              'Analyze the mission of the Church',
            ],
            aiPrompt: "Analyze Pentecost event and early church mission. Discuss Holy Spirit descent (Acts 2), Peter's sermon, 3000 conversions, Philip's evangelism (Acts 8). Significance for church birth and mission theology.",
          },
          {
            id: 'C18',
            title: 'Opposition to the Gospel Message',
            content: [
              'Arrest and imprisonment of Peter and John (Acts 3-5, 12)',
              'Martyrdom of Stephen (Acts 6-7)',
              'Persecution by Saul (Acts 8-9; Galatians 1)',
              'Persecution of Paul (Acts 16, 19, 21; 2 Corinthians 11)',
            ],
            objectives: [
              'Trace the story of the arrest and imprisonment of Peter and John',
              'Trace the events that led to the martyrdom of Stephen',
              'Describe the role of Saul in the persecution of the Church',
              'Evaluate the importance of persecution to the growth of the Church',
              'Account for the persecution of Paul',
            ],
            aiPrompt: "Analyze persecution in early church. Discuss Peter/John arrests, Stephen's martyrdom and speech, Saul's persecution, Paul's sufferings. Paradox: persecution spreads gospel. Lessons for persecuted Christians today.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: Themes from Selected Epistles',
        topics: [
          {
            id: 'D1',
            title: 'Justification by Faith',
            content: [
              'Pauline teaching (Romans 3:21-24; 5:1-11; 10:1-13; Galatians 2:16-21)',
            ],
            objectives: [
              'Interpret the phrase "justification by faith"',
              'Identify the basic conditions for justification',
              'Determine the fruits of justification',
            ],
            aiPrompt: "Explain justification by faith from Romans and Galatians. Discuss legal metaphor, faith vs. works, Abraham as example, peace with God. Contrast with Jewish law righteousness.",
          },
          {
            id: 'D2',
            title: 'The Law and Grace',
            content: [
              'Relationship between law and grace (Romans 4-5; Galatians 3; Romans 3:24)',
            ],
            objectives: [
              'Examine the purpose and significance of the law and grace',
              'Identify the place of the Law among the Jews',
            ],
            aiPrompt: "Analyze law vs. grace in Pauline theology. Discuss law's purpose (reveal sin, lead to Christ), grace as gift, Abraham justified before law. Implications for Christian living.",
          },
          {
            id: 'D3',
            title: 'New Life in Christ',
            content: [
              'Transformation teachings (Romans 6, 12; Colossians 3; Galatians 5; 2 Corinthians 5; 1 Thessalonians 4)',
            ],
            objectives: [
              'Describe the characteristics of the old life',
              'Analyze the new life in Christ',
              'Identify the conditions of the new life',
              'Examine the benefits of the new life',
            ],
            aiPrompt: "Explain new life in Christ. Discuss baptism symbolism (Romans 6), putting off old self (Colossians 3), fruit of Spirit (Galatians 5), new creation (2 Corinthians 5), sanctification (1 Thessalonians 4).",
          },
          {
            id: 'D4',
            title: 'Christians as Joint Heirs with Christ',
            content: [
              'Inheritance teachings (Galatians 3-4)',
            ],
            objectives: [
              'Describe how Christians are joint heirs with Christ',
              'Indicate the benefits of being joint heirs with Christ',
            ],
            aiPrompt: "Explain believers as joint heirs with Christ (Galatians 3-4). Discuss adoption metaphor, inheritance rights, freedom from law, Abraham's blessing. Practical implications for Christian identity.",
          },
          {
            id: 'D5',
            title: 'Humility',
            content: [
              'Humility teachings (Philippians 2; 1 Peter 5; James 4; Matthew 23:12)',
            ],
            objectives: [
              'Determine the meaning of humility',
              'Identify the requirements of humility',
              'Identify the rewards of humility',
            ],
            aiPrompt: "Analyze biblical humility. Discuss Christ's example (Philippians 2), Peter's exhortation (1 Peter 5), James' warning (James 4), Jesus' teaching (Matthew 23). Contrast with pride.",
          },
          {
            id: 'D6',
            title: 'Forgiveness',
            content: [
              'Pauline teaching on forgiveness (Philemon; 2 Corinthians 2:5-11; Matthew 7:14-15)',
            ],
            objectives: [
              'Analyze Paul\'s teaching on forgiveness',
              'Assess the benefits of forgiveness',
            ],
            aiPrompt: "Analyze forgiveness in Philemon (Onesimus) and 2 Corinthians. Discuss reconciliation principles, restoring offenders, God's forgiveness model. Connect to Lord's Prayer teaching.",
          },
          {
            id: 'D7',
            title: 'Spiritual Gifts',
            content: [
              'Gifts of the Spirit (1 Corinthians 12, 14; Romans 12:3-18)',
            ],
            objectives: [
              'Identify the different spiritual gifts',
              'Analyze the benefits of spiritual gifts to the individual and the church',
            ],
            aiPrompt: "Explain spiritual gifts (1 Corinthians 12, 14; Romans 12). Discuss gift diversity, body metaphor, love context (1 Corinthians 13), orderly worship. Application for church ministry.",
          },
          {
            id: 'D8',
            title: 'Christian Giving',
            content: [
              'Principles of giving (Philippians 4:14-20; 2 Corinthians 8-9; Matthew 6:2-4)',
            ],
            objectives: [
              'Interpret the concept of Christian giving',
              'Relate the teachings of Paul on Christian giving',
              'Identify the importance of Christian giving',
            ],
            aiPrompt: "Analyze Christian giving principles. Discuss Macedonian churches' generosity (2 Corinthians 8-9), cheerful giver, sowing/reaping, Philippians' partnership. Contrast with hypocritical giving.",
          },
          {
            id: 'D9',
            title: 'Civic Responsibility',
            content: [
              'Christian and government (Romans 13; 1 Timothy 2:1-4; 1 Peter 2:13-17)',
            ],
            objectives: [
              'Identify the need for obedience to authority',
              'Specify the requirements of good citizenship',
            ],
            aiPrompt: "Analyze Christian civic responsibility. Discuss submission to government (Romans 13), prayer for leaders (1 Timothy 2), respectful witness (1 Peter 2). Balancing heavenly citizenship and earthly responsibilities.",
          },
          {
            id: 'D10',
            title: 'Dignity of Labour',
            content: [
              'Work ethics (2 Thessalonians 3:6-15; Colossians 3:23-25; Matthew 20:1-16)',
            ],
            objectives: [
              'Interpret the concept of dignity of labour',
              'Analyze the benefits of labour',
            ],
            aiPrompt: "Explain Christian work ethic. Discuss Paul's tentmaking example, idle vs. busy, working heartily for Lord, fair wages parable. Application to modern workplace.",
          },
          {
            id: 'D11',
            title: 'Second Coming of Christ',
            content: [
              'Signs of Christ\'s coming (1 Thessalonians 4:13-18; 2 Thessalonians 2:1-12)',
              'Preparation for His coming (1 Thessalonians 5:1-11; 2 Peter 3:1-13; Matthew 25:31-46)',
            ],
            objectives: [
              'Identify the signs of the Second Coming of Christ',
              'Specify the preparations for His coming',
              'Indicate what will happen during His Second Coming',
              'Examine the importance of His coming',
            ],
            aiPrompt: "Analyze Second Coming teachings. Discuss rapture (1 Thessalonians 4), day of Lord, antichrist, suddenness, readiness parables (Matthew 25), new heavens/earth. Ethical implications.",
          },
          {
            id: 'D12',
            title: 'Impartiality',
            content: [
              'Against partiality (James 2:1-13; Luke 6:3; Acts 10:34-35; Matthew 7:1-5)',
            ],
            objectives: [
              'Interpret the concept of impartiality',
              'Identify causes of partiality',
              'Examine the consequences of partiality',
            ],
            aiPrompt: "Analyze impartiality in James 2 (rich vs. poor in assembly). Discuss favoritism as sin, royal law fulfillment, mercy triumph. Connect to Peter's vision (Acts 10) and Jesus' teaching.",
          },
          {
            id: 'D13',
            title: 'Effective Prayer',
            content: [
              'Prayer principles (James 1:2-8; 4:1-3; 5:13-18; Matthew 6:5-13)',
            ],
            objectives: [
              'Identify the requirements of effective prayer',
              'Distinguish between effective and ineffective prayer',
              'Identify the importance of prayer',
            ],
            aiPrompt: "Analyze effective prayer from James and Jesus. Discuss faith without doubt, righteous person's prayer, Elijah example, Lord's Prayer model. Hindrances to prayer.",
          },
          {
            id: 'D14',
            title: 'Christian Living in Community',
            content: [
              'Interpersonal relationships (1 Peter 5; Romans 12; 2 Peter 1; Hebrews 13)',
              'Living among non-Christians (1 Peter 2; Romans 15)',
              'Attitude to persecution (1 Peter 1, 3-4)',
              'Christian family relationships (Ephesians 6; Colossians 3; 1 Peter 3)',
            ],
            objectives: [
              'Determine interpersonal relationships among Christians',
              'Analyze Christian living among non-Christians',
              'Relate Christian attitude to persecution',
              'Determine the relationship in the Christian family',
              'Examine the importance of maintaining good relationships',
            ],
            aiPrompt: "Analyze Christian community living comprehensively. Discuss mutual submission, hospitality, suffering response, family roles (husband-wife, parent-child, master-servant). Witness in pagan society.",
          },
          {
            id: 'D15',
            title: 'Corruption',
            content: [
              'Biblical warnings (1 Timothy 6:6-11; 2 Timothy 3:8; 2 Peter 1:4-11; James 5:1-6)',
            ],
            objectives: [
              'Define the term corruption',
              'Identify the causes of corruption',
              'Determine the effects and consequences of corruption',
              'Identify ways of curbing corruption',
            ],
            aiPrompt: "Analyze corruption from biblical perspective. Discuss love of money root (1 Timothy 6), false teachers (2 Timothy 3), corrupt desires (2 Peter 1), rich oppression (James 5). Christian alternatives.",
          },
          {
            id: 'D16',
            title: 'Sexual Immorality',
            content: [
              'Prostitution (1 Corinthians 6:16-20; Proverbs 7, 23)',
              'Adultery and fornication (Hebrews 13:4; Ephesians 5:3-10; Matthew 5:28-32; Deuteronomy 22:22; Leviticus 20:10)',
              'Homosexuality (Romans 1:24-32; Leviticus 18:21-30; 20:13)',
            ],
            objectives: [
              'Identify what constitute sexual immorality',
              'Determine the causes of sexual immorality',
              'Examine the effects and consequences of sexual immorality',
              'Identify ways of curbing sexual immorality',
            ],
            aiPrompt: "Analyze biblical sexual ethics comprehensively. Discuss prostitution, adultery, fornication, homosexuality. Biblical principles: body as temple, marriage sanctity, purity. Redemption and restoration.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Adetunji, P.G. et al (2000) Exam Focus Christian Religious Knowledge for WASSCE and SSCE',
          'Adeyemo, I. O. et al (1998) Christian Religious Knowledge for Secondary Schools Books1-3',
          'Adeyinka, A. A. et al (1991) Christian Religious Knowledge for Senior Secondary Schools, Book 1-3',
          'Adigwe, H.A et al (2004) Christian Religious Knowledge for Senior Secondary Schools',
          'Aghaeghuna, E. O. N. (1988) Senior Secondary School Christian Religious Knowledge: Themes from Selected Epistles',
          'Dopamu, A. et al (1990) Christian Religious Knowledge for Senior Secondary Schools Books 1-3',
          'Ilori, J. A. et al (1980) Christian Religious Knowledge for Senior Secondary Schools Books 1-3',
          'Izuchukwu, A.E. et al (1997) Round-Up for Senior Secondary Certificate Examination Christian Religious Knowledge',
          'Throckmorton, B.H, Jr. (ed) (1966) Gospel Parallels: A Synopsis of the First Three Gospels',
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
        AsyncStorage.getItem('crs_ai_explanations'),
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
    const systemPrompt = 'You are an expert Christian Religious Studies tutor specializing in UTME/JAMB syllabus. Explain biblical concepts clearly with practical applications and theological insights. Use proper theological terminology. Format in markdown.';
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
      await AsyncStorage.setItem('crs_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered CRS explanations.',
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
      const prompt = `As a Christian Religious Studies expert, explain "${topic.title}" for UTME/JAMB CRS preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Christian Religious Studies:
1. Start with a clear definition in ## H2 heading
2. Provide comprehensive biblical analysis with proper references
3. Explain theological concepts with practical applications
4. Include relevant Bible verses and their interpretations
5. Highlight key theological principles with **bold**
6. Provide historical and cultural context where applicable
7. Include ethical and moral applications for modern life
8. Connect Old Testament and New Testament themes
9. Address common examination questions on this topic

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key theological terms
- Use > for important Bible verses or principles
- Include practical Christian living applications
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on biblical accuracy and practical Christian living.`;

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
              content: 'You are an expert Christian Religious Studies tutor specializing in UTME/JAMB syllabus. Explain biblical concepts clearly with practical applications and theological insights. Use proper theological terminology. Format in markdown.'
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
              await AsyncStorage.removeItem('crs_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All CRS explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "book" : "lock"} 
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
            color="#8B4513" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#8B4513" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#8B4513" style={styles.bulletIcon} />
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
                        color="#A0522D" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#8B4513" />
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
                              <Icon name="school" size={16} color="#8B4513" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#A0522D" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered CRS Explanations</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Bible Study</Text>
                <Text style={styles.featureDescription}>Get detailed biblical explanations with theological insights</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Comprehensive Syllabus</Text>
                <Text style={styles.featureDescription}>Full coverage of Old Testament, Gospels, Epistles</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practical Applications</Text>
                <Text style={styles.featureDescription}>Biblical principles applied to modern Christian living</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Exam Preparation</Text>
                <Text style={styles.featureDescription}>UTME-style questions with biblical analysis</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for CRS</Text>
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
          <Icon name="book" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>CHRISTIAN RELIGIOUS STUDIES</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Biblical Studies Focus</Text>
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
            <Icon name="info" size={20} color="#8B4513" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "book" : "lock"} size={16} color={isPremiumActivated ? "#A0522D" : "#999"} />
              <Text style={styles.tipText}>
                {isPremiumActivated ? 'AI Explain for detailed biblical analysis' : 'Unlock premium for AI explanations'}
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
              <Icon name="history-edu" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Includes biblical references and theological insights</Text>
            </View>
          </View>
        </View>

        {crsData.sections.map(section => renderSection(section))}

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
                <Icon name="book" size={20} color="#8B4513" />
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
                  <ActivityIndicator size="large" color="#8B4513" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with biblical analysis...
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
                <Icon name="share" size={20} color="#8B4513" />
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

// Markdown styles for CRS
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
    color: '#5D4037',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0522D',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#5D4037',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#FFF8E1',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#FFF8E1',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE0B2',
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
    color: '#8B4513',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#8B4513',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#8B4513',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    fontSize: 20,
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
    color: '#8B4513',
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
    backgroundColor: '#FFF8E1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D4037',
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
    backgroundColor: '#FFFBF0',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE0B2',
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
    fontSize: 15,
    fontWeight: '600',
    color: '#8B4513',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A0522D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#5D4037',
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
    color: '#8B4513',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#8B4513',
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
    color: '#8B4513',
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
    borderColor: '#8B4513',
  },
  saveButton: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    backgroundColor: '#FFF8E1',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
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
    backgroundColor: '#8B4513',
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
    backgroundColor: "rgba(139, 69, 19, 0.9)",
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

export default ChristianReligiousStudiesScreen;