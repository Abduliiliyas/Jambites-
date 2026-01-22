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

const HomeEconomicsSyllabusScreen = () => {
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
          'Acquire knowledge on the concepts and principles of Home Economics education',
          'Apply the principles of Foods and Nutrition to planning, selection and preparation of meals and the adoption of food hygiene and safety',
          'Equip students with knowledge and skills in Clothing and Textiles',
          'Apply the principles of Home Management in home and family living',
        ],
      },
      {
        id: 'sectionA',
        title: 'SECTION A: HOME ECONOMICS EDUCATION',
        topics: [
          {
            id: 'A.1',
            title: '1. Home Economics',
            content: [
              'Meaning, scope and importance of Home Economics',
              'Objectives and ideals of Home Economics',
            ],
            objectives: [
              'Examine the importance of Home Economics to the individual, family, society and nation',
              'Identify the objectives of Home Economics',
              'Determine the scope of Home Economics',
            ],
            aiPrompt: "Explain comprehensively: Meaning, scope and importance of Home Economics. Discuss objectives and ideals. Provide real-world applications. Explain how Home Economics benefits individuals, families, society, and the nation.",
          },
          {
            id: 'A.2',
            title: '2. Areas/Careers in Home Economics',
            content: [
              'Home Management: Interior decoration, Credit management, Florist',
              'Foods and Nutrition: Catering, Dietetics, Nutritionist, Public Health Education',
              'Clothing and Textile: Textile designing',
              'Family and Child development: Early and Childhood education',
              'Teaching, Counselling, Media, Research',
            ],
            objectives: [
              'Recommend possible vocations in the different areas of Home Economics',
              'Relate Home Economics to each vocation',
              'Assess the benefits of each vocation to the individual, society and nation',
              'Identify current vocations in Home Economics',
              'Identify sources of career information',
            ],
            aiPrompt: "Detail all career paths in Home Economics. Explain each area: Home Management, Foods & Nutrition, Clothing & Textile, Family & Child development. Discuss required skills, qualifications, and job opportunities. Provide guidance on career selection and growth.",
          },
          {
            id: 'A.3',
            title: '3. Interrelationship of Home Economics with other subjects',
            content: [
              'Biology, Geography, Chemistry, Physics',
              'Agricultural Science, Fine Arts, Economics, Mathematics',
            ],
            objectives: [
              'Compare the different areas of study which have relationship with Home Economics',
              'Determine the contributions of these subjects to Home Economics',
            ],
            aiPrompt: "Explain how Home Economics relates to other subjects: Biology (nutrition, human body), Chemistry (food chemistry), Physics (heat transfer), Mathematics (measurements, budgeting), Economics (resource management), Fine Arts (interior design). Provide specific examples of interdisciplinary connections.",
          },
        ],
      },
      {
        id: 'sectionB',
        title: 'SECTION B: HOME MANAGEMENT',
        topics: [
          {
            id: 'B.1',
            title: '1. Principles of Home Management',
            content: [
              'Meaning of Home Management',
              'Steps in the management process',
              'Decision-making: meaning and process',
              'Motivation for Home Management e.g. goals, values, standards, needs and wants, likes and dislikes',
            ],
            objectives: [
              'State the meaning of Home Management',
              'Identify steps involved in the management process',
              'Determine issues for decision-making in the home',
              'Describe the role of motivators in Home Management',
            ],
            aiPrompt: "Explain Home Management principles: Planning, organizing, controlling, evaluating. Discuss decision-making processes in family settings. Explain motivation factors: goals, values, standards. Provide practical examples of effective home management.",
          },
          {
            id: 'B.2',
            title: '2. Resources',
            content: [
              'Human Resources: Time management, Energy management, Skills, creativity, attitudes',
              'Material Resources: Income and money management, Household budgeting, Economic security',
            ],
            objectives: [
              'Identify the resources available to the individual and family',
              'Describe the pattern of work plan',
              'Apply the principle of time management to work simplification in the home',
              'Identify the sources of income available to an individual and family',
              'Determine the means of family saving',
              'Give reasons for saving family income',
              'Determine the steps involved in family budgeting',
              'Suggest alternative resources for Home Management',
              'Analyze the principles of money management',
              'State other material resources available to individual and family',
            ],
            aiPrompt: "Comprehensive explanation of resources in Home Management. Cover: 1. Human Resources (time, energy, skills) with time management techniques and work simplification. 2. Material Resources (money management, budgeting, saving strategies). Provide practical budgeting templates and savings plans.",
          },
          {
            id: 'B.3',
            title: '3. Family Living',
            content: [
              'Definition and types of family',
              'Family relationships: husband/wife, parent/child, sibling relationships',
              'Basic personality profiles: extrovert, introvert',
              'Adolescents and their problems',
              'Family crises, Conflict and conflict resolution',
              'Human rights: meaning, fundamental rights, rights of women and children',
              'Communication and role of ICT in the Family',
            ],
            objectives: [
              'Compare types of family',
              'Identify roles of family members',
              'Differentiate between the types of relationships that exist in the family',
              'Determine the factors that influence family relationships',
              'Describe factor that influence family relationships',
              'Identify characteristics and problems of adolescents',
              'Compare the basic personality profiles (extrovert, introvert)',
              'Suggest remedies for breach of human rights',
              'Identify factors that hinder communication in the family',
              'Determine factors that enhance communication in the family',
              'Identify the advantages and disadvantages of ICT',
            ],
            aiPrompt: "Explain Family Living comprehensively. Cover: Family types and structures, relationships dynamics, personality types, adolescent issues, conflict resolution, human rights in family context, and role of ICT in family communication. Provide strategies for healthy family living.",
          },
          {
            id: 'B.4',
            title: '4. Marriage and Reproductive Health',
            content: [
              'Meanings of marriage and sex education',
              'Boy/Girl relationship: courtship, factors to consider when choosing a partner',
              'Preparation for marriage: engagement, types of marriage (Islamic, Christian, Court and Traditional), planning a family',
              'Reproductive health: sexually transmitted infections/diseases (STIs/STDs and HIV/AIDS)',
            ],
            objectives: [
              'Differentiate between types of marriages in Nigeria',
              'Compare the advantages and disadvantages of inter-tribal marriages',
              'Analyze the role of courtship and engagement in marriages',
              'Identify the different ways of planning a family',
              'State types, causes and prevention of sexually transmitted infections and diseases',
            ],
            aiPrompt: "Explain Marriage and Reproductive Health. Cover: Courtship, marriage preparation, different marriage types in Nigeria, family planning. Detail reproductive health including STIs/STDs, HIV/AIDS prevention. Discuss responsible relationships and decision-making.",
          },
          {
            id: 'B.5',
            title: '5. Pregnancy and childbirth',
            content: [
              'Menstruation, pregnancy and childbirth, labour delivery and post-natal care',
              'Childcare, baby\'s layette, care of the baby, toilet training, bathing, feeding, weaning',
              'Care of toddlers: common ailments in children, immunization',
              'Child development: good habits and character training, play and play materials',
              'Parenting: meaning and importance, responsibilities of parents',
            ],
            objectives: [
              'Describe the process of reproduction from conception to birth',
              'Describe the care an infant need from birth to 5 years',
              'Determine the factors that affect pregnancy',
              'Differentiate between the stages of labour',
              'Identify the symptoms of common ailments in children',
              'Mention types of play materials',
              'Trace the stages of development in children',
              'Recommend suitable play materials for children',
              'Identify responsibilities of parents',
            ],
            aiPrompt: "Explain Pregnancy, Childbirth, and Childcare comprehensively. Cover: Reproductive process, prenatal care, stages of labor, postnatal care. Detail infant and toddler care including feeding, hygiene, immunization. Discuss child development stages and parenting responsibilities.",
          },
          {
            id: 'B.6',
            title: '6. Housing the family',
            content: [
              'Houses and home: types of houses, factors that affect the choice of a house, ways of acquiring a house',
              'Interior decoration: wall finishing, application of principles of art and design (colours, textures, lines, proportions), flower arrangements',
              'Furniture and furnishings: types, factors that affect choices and position',
              'Utilities in the Home: Water, Household fuels, Electricity, Communication devices',
            ],
            objectives: [
              'Differentiate between a house and a home',
              'Identify the factors that influence residential choice',
              'Describe items that beautify living areas',
              'Suggest suitable colours, textures and other related factors that should be considered in interior decoration',
              'Determine factors that influence choice and arrangement of furniture',
              'Compare different floral arrangements',
              'Identify types of ornament and fixtures',
              'Describe the care of ornaments and fixtures',
              'Identify utilities in the home',
              'Appraise the advantages and disadvantages of these utilities in relation to their alternatives',
            ],
            aiPrompt: "Explain Housing comprehensively. Cover: House vs home, housing choices, interior decoration principles (color theory, textures, design elements), furniture selection and arrangement, home utilities (water, electricity, fuels). Provide practical interior design tips.",
          },
          {
            id: 'B.7',
            title: '7. Home surfaces',
            content: [
              'Types and care of surfaces and coverings: wood, tiles, Formica, concretes, plastics, linoleums, mats, rugs and terrazzo',
              'Identification, preparation and use of cleaning agents: water, soap, abrasives, polish',
              'Care of home surfaces and coverings: washing, sweeping, dusting, shampooing, buffing, polishing',
            ],
            objectives: [
              'Identify common surfaces in the homes',
              'Mention cleaning agents and their uses in the home',
              'Identify materials needed for preparing local cleaning agents',
              'Compare the care of different surfaces: wood, plastic, concrete, rugs, mats, linoleum',
            ],
            aiPrompt: "Explain Home Surface Care. Detail different surface types (wood, tile, concrete, etc.) and their proper maintenance. Discuss cleaning agents: types, preparation, safe use. Provide surface-specific care instructions and homemade cleaning solutions.",
          },
          {
            id: 'B.8',
            title: '8. Sanitation in the Home',
            content: [
              'Drainage systems – types and care',
              'Disposal of household refuse',
              'Household pests and control',
              'Pollution and health hazards',
            ],
            objectives: [
              'Identify types of waste water',
              'Suggest ways of disposing household refuse',
              'Identify common household pests and their control',
              'Identify some diseases transmitted by pests',
              'Describe sources of pollution',
              'Mention the health hazards of pollution',
            ],
            aiPrompt: "Explain Home Sanitation comprehensively. Cover: Waste management, drainage systems, pest control methods, pollution prevention. Discuss health implications and provide practical sanitation solutions for homes.",
          },
          {
            id: 'B.9',
            title: '9. Consumer Education',
            content: [
              'Meaning and importance of consumer education',
              'Definition and types of market',
              'Distributors or consumer agents',
              'Sources of consumer information',
              'Purchasing practices',
              'Advertising',
              'Consumer rights and responsibilities',
              'Government agencies and regulatory bodies',
            ],
            objectives: [
              'Explain the importance of consumer education',
              'Identify the different types of markets',
              'Describe the various consumer agents',
              'Identify sources of consumer advice and information',
              'Apply the principles of consumer education to wise shopping',
              'Identify the types of media used by advertisers',
              'Describe their advantages and disadvantages',
              'Explain the rights and responsibilities of the consumer',
              'Identify the functions of government agencies and regulatory bodies',
            ],
            aiPrompt: "Explain Consumer Education comprehensively. Cover: Market types, consumer rights, smart shopping practices, advertising analysis, government regulations. Provide strategies for making informed purchasing decisions and protecting consumer rights.",
          },
        ],
      },
      {
        id: 'sectionC',
        title: 'SECTION C: FOODS & NUTRITION',
        topics: [
          {
            id: 'C.1',
            title: '1. Foods and Nutrition',
            content: [
              'Definition of Foods and Nutrition',
              'Classification of nutrients, their sources and functions, deficiency diseases',
              'Classification of foods: cereals, fats and oils, milk and milk products, meat, fish, pulses, nuts, fruits, vegetables',
              'Nutrition and health: relationship, factors affecting nutrition',
              'The digestive system',
              'Nutrition for special groups: infants, toddlers, adolescents, manual workers',
            ],
            objectives: [
              'Describe food nutrients: carbohydrates, minerals, fat and oil, vitamin, protein and water',
              'Identify the different classes of food',
              'Describe the effect of nutrition on health status',
              'Identify factors affecting good nutrition',
              'Describe the process which breakdown large food molecules',
              'Recommend the nutritional needs for special groups',
              'Determine the reasons for the nutritional needs of special groups: expectant/lactating mothers, infants, toddlers, sedentary/manual workers, children 5-8 years, adolescent, aged, invalid and convalescent',
            ],
            aiPrompt: "Comprehensive explanation of Foods and Nutrition. Cover: Nutrient classification (macronutrients, micronutrients), food groups, digestive system, nutrition-health relationship. Detail special nutritional needs for different life stages and conditions. Include deficiency diseases and prevention.",
          },
          {
            id: 'C.2',
            title: '2. Meal planning',
            content: [
              'Principles of meal planning',
              'Dietary needs and meals for special occasions and groups',
              'Preparation and serving of meals',
              'Snacks and beverages: meaning, types and functions',
              'Table setting, table manners and hostessing',
            ],
            objectives: [
              'Identify factors that influence the choice and preparation of food for the family',
              'Plan meals for special occasions: weddings, birthdays, anniversaries',
              'Plan meals for special groups: vegetarians, invalids, convalescence, HIV/AIDS patient, COVID patient',
              'Identify types of snacks/beverages and their functions',
              'Compare types of table setting',
              'Describe table manners and qualities of a good host',
            ],
            aiPrompt: "Explain Meal Planning comprehensively. Cover: Meal planning principles, special occasion menus, dietary adaptations for various conditions. Detail table etiquette, hosting skills, and beverage service. Provide sample meal plans for different scenarios.",
          },
          {
            id: 'C.3',
            title: '3. Cookers and cooking',
            content: [
              'Types, choice and care of cookers: gas, electric, microwave',
              'Reasons for cooking',
              'Cooking terms',
              'Methods of cooking: boiling, stewing, baking, steaming (moist and dry methods)',
              'Methods of heat transfer: conduction, convection and radiation',
            ],
            objectives: [
              'Identify types of cookers, their choice and care',
              'Enumerate reasons for cooking',
              'Group the methods of cooking into: moist methods, dry methods, fast methods, slow methods',
              'Determine the method of heat transfer in the various methods of cooking',
            ],
            aiPrompt: "Explain Cooking Methods and Equipment. Cover: Types of cookers and their maintenance. Detail cooking methods (moist heat, dry heat) with examples. Explain heat transfer principles in cooking. Provide cooking terminology and techniques.",
          },
          {
            id: 'C.4',
            title: '4. Flours and uses',
            content: [
              'Types and uses of flours',
              'Raising agents: air, yeast, palm wine, steam',
            ],
            objectives: [
              'Identify types of flours and their uses',
              'Select appropriate raising agents for basic mixtures',
              'Use flour to produce assorted food items',
            ],
            aiPrompt: "Explain Flours and Raising Agents. Detail different flour types (wheat, corn, rice, etc.) and their culinary uses. Discuss raising agents (chemical, biological, mechanical) and their applications in baking.",
          },
          {
            id: 'C.5',
            title: '5. Basic mixtures',
            content: [
              'Pastries / Batters: Definition / uses',
            ],
            objectives: [
              'Differentiate between batters and pastries',
              'Use batters and pastries for different purposes',
            ],
            aiPrompt: "Explain Basic Food Mixtures. Detail batters (thin, thick) and pastries (shortcrust, puff, choux). Provide preparation methods, uses, and common applications in cooking.",
          },
          {
            id: 'C.6',
            title: '6. Scientific methods in Foods and Nutrition',
            content: [
              'Measure units and accuracy',
              'Various nutrients tests in food: test for protein, fats and carbohydrates',
              'Recipe development',
            ],
            objectives: [
              'Demonstrate skills in unit measurements',
              'Detect the nutrients in a given food',
              'Develop basic recipes in food preparation',
            ],
            aiPrompt: "Explain Scientific Methods in Food. Cover: Accurate measurement techniques, nutrient testing procedures, recipe development principles. Provide step-by-step guides for nutrient tests and recipe creation.",
          },
          {
            id: 'C.7',
            title: '7. The Kitchen',
            content: [
              'Types of kitchen',
              'Arrangement',
              'Tools and equipment: selection, use and care',
            ],
            objectives: [
              'Describe types and arrangement of kitchen',
              'Compare large and small kitchen equipment and tools',
              'Specify factors to consider in selecting kitchen tools and equipment',
            ],
            aiPrompt: "Explain Kitchen Organization and Equipment. Cover: Kitchen layouts (U-shaped, L-shaped, galley), work triangle principle. Detail essential kitchen tools, their selection criteria, maintenance, and proper use.",
          },
          {
            id: 'C.8',
            title: '8. Kitchen safety and hygiene',
            content: [
              'Common accidents in the kitchen: causes of accidents, preventive measures',
              'First Aid: definition, components of a first aid kit, simple first aid for burns, scalds, cuts bruises, bleeding, electric shock, poisoning, chocking and bites',
              'Kitchen, personal and food hygiene: communicable and non-communicable',
            ],
            objectives: [
              'Identify common accidents in the kitchen, their causes and preventive measures',
              'Suggest ways of making the kitchen a safe place',
              'Specify items which should be included in a first aid kit',
              'Suggest simple first aid for scalds, cuts, bleeding, burns, etc',
              'Identify ways in which food is contaminated',
              'Compare communicable and non-communicable disease and their preventive measures',
            ],
            aiPrompt: "Comprehensive explanation of Kitchen Safety and Hygiene. Cover: Common kitchen hazards and prevention, first aid procedures, food safety principles (cross-contamination, temperature control), personal hygiene practices.",
          },
          {
            id: 'C.9',
            title: '9. Food Storage and Preservation',
            content: [
              'Meaning and purpose of preservation, causes of food spoilage, principles of food preservation, methods of food preservation',
              'Convenience foods: definition and types, guidelines for selection, use of convenience foods',
              'Food additives: Types and uses',
              'Rechauffe dishes: meaning, rules and types, advantages and disadvantages',
            ],
            objectives: [
              'Identify agents of food spoilage',
              'Describe the principles involved in the preservation and storage of foods',
              'Compare the advantages and disadvantages of food preservation methods',
              'Identify convenience foods',
              'Compare the advantages and disadvantages of using convenience foods',
              'Identify guidelines for selecting convenience foods',
              'Identify additives used in foods',
              'Compare the advantages and disadvantages of rechauffe dishes',
            ],
            aiPrompt: "Explain Food Storage and Preservation comprehensively. Cover: Food spoilage causes, preservation methods (canning, freezing, drying, etc.), food additives, convenience foods. Detail rechauffe (leftover) food safety and preparation.",
          },
          {
            id: 'C.10',
            title: '10. Home Gardening',
            content: [
              'Definition',
              'Common gardening tools',
              'Advantages of home gardening',
              'Types of soil',
              'Plants and crops suitable for home garden',
              'Preparation and care of home garden',
            ],
            objectives: [
              'Identify gardening tools',
              'Explain the importance of home gardening',
              'Describe the procedures involved in home gardening',
            ],
            aiPrompt: "Explain Home Gardening. Cover: Benefits of home gardening, essential tools, soil types and preparation, suitable crops for home gardens, planting and maintenance procedures.",
          },
        ],
      },
      {
        id: 'sectionD',
        title: 'SECTION D: CLOTHING & TEXTILE',
        topics: [
          {
            id: 'D.1',
            title: '1. Fibres and Fabrics',
            content: [
              'Origin of fibres: definition of textile terms (fibres, fabrics, yarn, staple, filament, blends)',
              'Locally made fabric: aso-oke, Okene cloth, Benue cloth, Akwete, Gwado',
              'Classification and properties of fibres: cotton, rayon, silk, etc',
              'Fabric finishes: moth-proofing, embossing, durable pleating, flame-proofing, stain-repellent, print (tie and dye, screen printing)',
              'Textile care label: meaning and types, recognition of washing, cleaning and ironing symbols, wool symbols',
            ],
            objectives: [
              'Identify the characteristics of fibre',
              'Differentiate between methods of fabric construction using diagrams',
              'State reasons for giving finishes to fabrics',
              'State the uses and importance of locally made fabric',
              'Compare types of labels found on clothing',
              'State the importance of label on garments',
            ],
            aiPrompt: "Explain Fibres and Fabrics comprehensively. Cover: Natural vs synthetic fibres, fabric construction methods, Nigerian traditional textiles, fabric finishes, care label interpretation. Provide diagrams and examples.",
          },
          {
            id: 'D.2',
            title: '2. Sewing equipment and garment construction',
            content: [
              'Sewing machine, basic tools and equipment: types, use and care',
              'Basic process in garment construction: basic stitches, seams, edge finishes, crossway strips',
              'Style features: collars, yokes, pockets, frills, cuts, belts',
              'Arrangement of fullness: darts, tuck gathering, pleats, smocking, shirring',
              'Decorative design: embroidery, needlecraft, tarting, crocheting, knitting, appliqué, patch work and soft furnishing',
              'Simple processes and mend garments: patching, darning, renovation, batik/tie and dye',
              'Garment construction: figure types, basic body measurement and pattern drafting, choice of styles for different figures, factors influencing the choice of fabric',
              'Wardrobe planning and maintenance: basic rules, factors affecting wardrobe planning (weather, occupation, personal features)',
              'Good grooming, dress sense and accessories: definition, types and choice of accessories',
            ],
            objectives: [
              'Identify the types, parts and faults of a sewing machine',
              'Identify basic tools and equipment used in garment construction',
              'Describe various process in garment constructions',
              'Apply basic process in garment construction',
              'Identify style features to enhance the beauty and quality of garments',
              'Apply decorative designs on fabrics',
              'Apply the knowledge of sewing to mend and renovate garments',
              'Compare the process of making batik/tie and dye, screen printing and resist dying',
              'Relate body figures to the selection of styles and fabrics',
              'Determine factors which affect the choice of clothing',
              'Identify factors to consider in wardrobe planning',
              'Describe: good grooming, dress sense, accessories, colour harmony',
            ],
            aiPrompt: "Comprehensive explanation of Sewing and Garment Construction. Cover: Sewing equipment, construction techniques, pattern drafting, fitting adjustments, decorative techniques, wardrobe planning, personal grooming. Include step-by-step guides for basic sewing projects.",
          },
          {
            id: 'D.3',
            title: '3. Laundry and care of clothes',
            content: [
              'Washing and finishing process: sorting, mending, removal of stains, soaking, washing, rinsing, drying, ironing and airing',
              'Laundry agents: water, detergents, soaps, stiffness, disinfectants',
              'Stain: meaning, types, agents; process of removal',
              'Iron and ironing temperatures',
            ],
            objectives: [
              'Arrange in correct order the processes involved in washing and finishing of clothing',
              'Describe the role of laundry agent',
              'Suggest ways of removing common stains',
              'Describe: laundry agents, stains, ironing temperatures',
            ],
            aiPrompt: "Explain Laundry and Clothing Care. Cover: Proper washing procedures, stain removal techniques, laundry agents, ironing methods and temperatures. Provide specific instructions for different fabric types.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Anfani-Joe, M.E. and Ogunjide, L.O. (1993) Home Management for Senior Secondary School 1 - 3, Ibadan: University Press Plc.',
          'Anyakoha, E.U. and Eluwa, M. (1990) Home Management for Schools and Colleges, Onitsha: Africana FIRST Publishers.',
          'Anyakoha, E.U (2006) Home Economics for Junior Secondary Schools Books1 - 3, Onitsha Africana FIRST Publishers.',
          'Enid O\'Reilly-Wright (1985) The Student\'s Cookery Book (Oxford University Press)',
          'Haselgrove N. M. and Scallon K. A. (1981) The How and why Of Cookery. Granda Publishing Limited',
          'Neil, A and Hesmondhalgh, Z. (1985) A Complete Revision Course for O\'Level and GCE, Revised Home Economics, Charles Co. Ltd.',
          'Ogunjide, L.O., Egbuchulam, B., Eyisi, O. Anfani-Joe, M.E and Olusanya, J.O. (1993) Clothing and Textiles for Senior Secondary Schools 1 - 3, Ibadan: University Press Plc.',
          'Okeke S. U. N. (2009) Home Economics For Schools and College. Africana First Publishers.',
          'Olusanya, J.O., Eyis, O., Anfani-Joe, M.E., Ogunjide, L.O. and Egbuchulam, B. (1990) Foods and Nutrition for Secondary Schools Books 1 - 3, Ibadan: UniversityPress Plc.',
          'Olusanya, J. O., Olojala, S. O., Bala, F. and Eyisi, O. (2000) Exam Focus, Food and Nutrition for WASSCE and SSCE, Ibadan: University Press Plc.',
          'The Internet',
          'Wisdom line Pass at Once JAMB (2012)',
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
        AsyncStorage.getItem('home_economics_ai_explanations'),
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
    const systemPrompt = 'You are an expert Home Economics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with practical examples and real-world applications. Format in markdown with clear headings and bullet points.';
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
      await AsyncStorage.setItem('home_economics_ai_explanations', JSON.stringify(updated));
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
        'AI Explanation feature is for premium users. Activate premium to access AI-powered explanations with practical examples.',
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
      const prompt = `As a Home Economics expert, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Home Economics:
1. Start with a clear definition in ## H2 heading
2. Use practical examples and real-world applications
3. Include step-by-step procedures where applicable
4. Explain concepts with reference to Nigerian context
5. Highlight key learning points with **bold**
6. Provide study tips and exam preparation strategies
7. Include diagrams or describe visual concepts clearly
8. Connect theoretical knowledge with practical skills
9. Address common student difficulties and misconceptions

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key terms and important concepts
- Use > for important safety tips or warnings
- Include tables for comparisons where helpful
- Make it engaging for Nigerian students

Write in clear, educational style with practical focus.`;

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
              content: 'You are an expert Home Economics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with practical examples and real-world applications. Format in markdown with clear headings and bullet points.'
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
              await AsyncStorage.removeItem('home_economics_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Home Economics explanations cleared');
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "lightbulb" : "lock"} 
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
                              <Text style={styles.subsectionTitle}>Content Topics:</Text>
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
                                <Icon name="target" size={14} color="#D2691E" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Advanced Home Economics AI Tutor</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Explanations</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with practical examples and real-world applications</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Home Management & Family Living</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of home management principles and family dynamics</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Foods & Nutrition</Text>
                <Text style={styles.featureDescription}>Detailed nutrition science, meal planning, and food preparation techniques</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#8B4513" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Clothing & Textile</Text>
                <Text style={styles.featureDescription}>Complete guide to fabrics, sewing, and garment construction</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for all Home Economics topics</Text>
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
    <Icon name="home" size={32} color="white" style={styles.headerIcon} />
    <View>
      <Text style={styles.headerTitle}>HOME ECONOMICS</Text>
      <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
      <Text style={styles.headerNote}>Complete UTME Home Economics Syllabus</Text>
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
          <Text style={styles.clearButtonText}>Clear AI</Text>
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
          <Text style={styles.clearButtonText}>Clear AI</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity 
        style={styles.clearButton}
        onPress={clearAllExplanations}
      >
        <Icon name="delete-sweep" size={20} color="white" />
        <Text style={styles.clearButtonText}>Clear AI</Text>
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
            <Icon name="info" size={20} color="#8B4513" />
            <Text style={styles.infoTitle}>How to Use</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Tap sections to expand/collapse topics</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "lightbulb" : "lock"} size={16} color={isPremiumActivated ? "#D2691E" : "#999"} />
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
              <Icon name="book" size={16} color="#8B4513" />
              <Text style={styles.tipText}>Covers all 4 sections: Education, Home Management, Foods & Nutrition, Clothing & Textile</Text>
            </View>
          </View>
        </View>

        {syllabusData.sections.map(section => renderSection(section))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {Object.keys(aiExplanations).length} topics with saved AI notes
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
                <Icon name="lightbulb" size={20} color="#8B4513" />
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
                    Generating AI explanation with practical examples...
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
                  Save Note
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

// Markdown styles for Home Economics
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
    color: '#8B4513',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A0522D',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D2691E',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#8B4513',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#FFF8DC',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#DEB887',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#FFF8DC',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DEB887',
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
    color: '#A0522D',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#A0522D',
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
    backgroundColor: '#FFF8DC',
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
  flex: 1, // Take available space
},
headerRight: {
  alignItems: 'center',
  marginLeft: -5, // Add some space from the main content
},
headerRightStack: {
  alignItems: 'center',
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
  marginBottom: 4,
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
  marginBottom: 4,
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
    backgroundColor: '#FFF8DC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B4513',
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
    backgroundColor: '#FFF8DC',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DEB887',
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
    color: '#8B4513',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D2691E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#8B4513',
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
    backgroundColor: '#FFF8DC',
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

export default HomeEconomicsSyllabusScreen;