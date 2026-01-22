import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Markdown from 'react-native-markdown-display';
import NetInfo from '@react-native-community/netinfo';

const { width } = Dimensions.get('window');
// API Configuration
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api';

const ChemistrySyllabusScreen = () => {
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });
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

  // Helper to show custom alert
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setCustomAlert({ visible: true, title, message, buttons });
  };

  const closeAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };
  // Chemistry Syllabus Data from PDF
  const syllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Understand basic principles and concepts in chemistry',
          'Interpret scientific data relating to chemistry',
          'Deduce relationships between chemistry and other sciences',
          'Apply chemistry knowledge to industry and everyday life',
        ],
      },
      {
        id: 'section1',
        title: '1. Separation of Mixtures and Purification',
        topics: [
          {
            id: '1.1',
            title: 'Separation Techniques',
            content: [
              'Pure vs impure substances',
              'Boiling and melting points as purity criteria',
              'Elements, compounds, mixtures',
              'Chemical vs physical changes',
              'Separation methods: evaporation, distillation, filtration, chromatography',
              'Crystallization, sublimation, magnetization',
            ],
            objectives: [
              'Distinguish pure and impure substances',
              'Use b.p./m.p. as purity criteria',
              'Differentiate elements, compounds, mixtures',
              'Identify chemical/physical changes',
              'Specify separation principles',
              'Apply separation in everyday life',
            ],
            aiPrompt: "Explain separation and purification techniques in chemistry. Cover: distillation, filtration, chromatography. Use Nigerian examples: crude oil refining, water purification. Discuss practical applications.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. Chemical Combination Laws',
        topics: [
          {
            id: '2.1',
            title: 'Chemical Laws and Stoichiometry',
            content: [
              'Laws: definite, multiple, reciprocal proportions',
              'Conservation of matter, Gay-Lussac law',
              'Avogadro law and number',
              'Chemical symbols, formulae, equations',
              'Relative atomic mass based on C-12',
              'Mole concept and stoichiometry',
            ],
            objectives: [
              'Perform calculations with formulae/equations',
              'Deduce chemical laws from data',
              'Interpret graphical representations',
              'Deduce reaction stoichiometry',
            ],
            aiPrompt: "Explain chemical combination laws and stoichiometry. Cover: mole concept, Avogadro number, chemical equations. Provide calculation examples. Use Nigerian industrial chemistry applications.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. Kinetic Theory and Gas Laws',
        topics: [
          {
            id: '3.1',
            title: 'Kinetic Theory and Gas Properties',
            content: [
              'Phenomena: melting, vaporization, boiling, freezing',
              'Distinction between solids, liquids, gases',
              'Gas laws: Boyle, Charles, Graham, Dalton',
              'Combined gas law, ideal gas equation (PV=nRT)',
              'Molar volume, atomicity of gases',
              'Vapor density and molecular mass relationship',
            ],
            objectives: [
              'Apply kinetic theory to states of matter',
              'Deduce reasons for state changes',
              'Draw inferences from molecular motion',
              'Deduce and interpret gas laws',
              'Perform gas law calculations',
            ],
            aiPrompt: "Explain kinetic theory and gas laws. Cover: Boyle, Charles, ideal gas law. Use practical examples. Provide calculation problems. Discuss Nigerian applications: gas cylinders, weather patterns.",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. Atomic Structure and Bonding',
        topics: [
          {
            id: '4.1',
            title: 'Atomic Theory and Structure',
            content: [
              'Concepts: atoms, molecules, ions',
              'Atomic models: Dalton, Rutherford, Bohr',
              'Electron configuration, atomic number, mass number',
              'Isotopes (elements 1-20)',
              's and p orbital shapes',
              'Periodic table: groups, periods, trends',
              'Properties: ionization energy, ionic radii, electronegativity',
            ],
            objectives: [
              'Distinguish atoms, molecules, ions',
              'Identify scientists contributions',
              'Deduce protons, neutrons, electrons',
              'Apply electron arrangement rules',
              'Relate isotopy to mass number',
              'Determine electrons in orbitals',
              'Relate atomic number to position',
              'Identify property trends',
            ],
            aiPrompt: "Explain atomic structure and periodic trends. Cover: atomic models, electron configuration, periodic table. Use element examples. Discuss Nigerian mineral elements relevance.",
          },
          {
            id: '4.2',
            title: 'Chemical Bonding and Molecular Shapes',
            content: [
              'Bond types: electrovalent, covalent, coordinate',
              'Hydrogen bonding, metallic bonding',
              'Van der Waals forces',
              'Molecular shapes: linear, non-linear, tetrahedral, pyramidal',
              'Complexes: [Fe(CN)6]3-, [Cu(NH3)4]2+',
              'Nuclear chemistry: radioactivity types',
              'Nuclear reactions, half-life calculations',
            ],
            objectives: [
              'Differentiate bonding types',
              'Deduce bond types from electron config',
              'Relate bonding to properties',
              'Differentiate molecular shapes',
              'Distinguish chemical/nuclear reactions',
              'Compare natural/artificial radioactivity',
              'Compute half-life calculations',
            ],
            aiPrompt: "Explain chemical bonding and molecular geometry. Cover: ionic, covalent, coordinate bonds. Show VSEPR theory. Include radioactivity basics. Use Nigerian examples: uranium mining, medicinal isotopes.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. Air',
        topics: [
          {
            id: '5.1',
            title: 'Composition and Properties of Air',
            content: [
              'Natural constituents: N2, O2, CO2, noble gases',
              'Proportions in air',
              'Air as a mixture',
              'Uses of noble gases',
              'Environmental composition variations',
            ],
            objectives: [
              'Deduce reasons for air as mixture',
              'Identify separation principles',
              'Deduce composition variations',
              'Specify constituent uses',
            ],
            aiPrompt: "Explain air composition and properties. Cover: nitrogen, oxygen, noble gases. Discuss Nigerian air quality issues. Include industrial gas applications.",
          },
        ],
      },
      {
        id: 'section6',
        title: '6. Water',
        topics: [
          {
            id: '6.1',
            title: 'Water Properties and Treatment',
            content: [
              'Water from hydrogen combustion',
              'Water as solvent, dissolved gases',
              'Hard vs soft water: temporary/permanent',
              'Water softening methods',
              'Town water supply treatment',
              'Water of crystallization',
              'Efflorescence, deliquescence, hygroscopy',
            ],
            objectives: [
              'Identify water uses',
              'Identify dissolved gas effects',
              'Distinguish hard/soft water',
              'Determine hardness causes',
              'Identify removal methods',
              'Describe water treatment',
              'Distinguish water phenomena',
            ],
            aiPrompt: "Explain water chemistry. Cover: hardness, treatment, water phenomena. Use Nigerian examples: borehole water, water treatment plants. Discuss Nigerian water quality challenges.",
          },
        ],
      },
      {
        id: 'section7',
        title: '7. Solubility',
        topics: [
          {
            id: '7.1',
            title: 'Solutions and Solubility',
            content: [
              'Solution types: unsaturated, saturated, supersaturated',
              'Solubility curves and deductions',
              'Solubility in mol/dm³',
              'Solvents for fats, oils, paints',
              'Stain removal applications',
              'True vs false solutions',
              'Suspensions and colloids',
              'Examples: Harmattan haze, fog, milk',
            ],
            objectives: [
              'Distinguish solution types',
              'Interpret solubility curves',
              'Calculate solute amounts',
              'Deduce temperature dependence',
              'Relate solvent nature to uses',
              'Differentiate true/false solutions',
              'Provide suspension/colloid examples',
            ],
            aiPrompt: "Explain solubility concepts. Cover: solubility curves, colloids, suspensions. Use Nigerian examples: palm oil solubility, Harmattan haze. Discuss industrial applications.",
          },
        ],
      },
      {
        id: 'section8',
        title: '8. Environmental Pollution',
        topics: [
          {
            id: '8.1',
            title: 'Pollution Types and Effects',
            content: [
              'Pollutant sources and effects',
              'Air pollutants: H2S, CO, SO2, NOx, CFCs',
              'Water pollution: sewage, oil',
              'Soil pollution: oil spillage',
              'Biodegradable vs non-biodegradable',
              'Pollution control measures',
            ],
            objectives: [
              'Identify pollution types',
              'Specify pollutant sources',
              'Classify biodegradable pollutants',
              'Specify pollution effects',
              'Identify control measures',
            ],
            aiPrompt: "Explain environmental pollution chemistry. Cover: air, water, soil pollution. Use Nigerian examples: Niger Delta oil spills, Lagos air pollution. Discuss control measures.",
          },
        ],
      },
      {
        id: 'section9',
        title: '9. Acids, Bases and Salts',
        topics: [
          {
            id: '9.1',
            title: 'Acid-Base Chemistry',
            content: [
              'Acid/base characteristics and uses',
              'Indicators, basicity of acids',
              'Salt types: normal, acidic, basic, double',
              'Acid definition: H3O+ donor',
              'Organic acids: ethanoic, citric, tartaric',
              'Salt preparation: neutralization, precipitation',
              'Oxides and carbonate salts',
              'Conductance of strong/weak electrolytes',
              'pH and pOH scale calculations',
              'Acid-base titrations',
              'Hydrolysis of salts',
            ],
            objectives: [
              'Distinguish acid/base properties',
              'Identify acid/base types',
              'Determine acid basicity',
              'Differentiate acidity/alkalinity',
              'Identify salt preparation methods',
              'Classify salt types',
              'Relate dissociation to strength',
              'Relate dissociation to conductance',
              'Perform pH/pOH calculations',
              'Identify appropriate indicators',
              'Interpret titration curves',
              'Balance hydrolysis equations',
              'Deduce solution properties',
            ],
            aiPrompt: "Explain acid-base chemistry comprehensively. Cover: pH, titrations, salt hydrolysis. Include calculations. Use Nigerian examples: local acid production, soil pH testing.",
          },
        ],
      },
      {
        id: 'section10',
        title: '10. Oxidation and Reduction',
        topics: [
          {
            id: '10.1',
            title: 'Redox Reactions',
            content: [
              'Oxidation: oxygen addition/hydrogen removal',
              'Reduction: oxygen removal/hydrogen addition',
              'Redox as electron transfer',
              'Oxidation numbers',
              'Balancing redox equations',
              'IUPAC nomenclature using oxidation numbers',
              'Tests for oxidizing/reducing agents',
            ],
            objectives: [
              'Identify redox forms',
              'Classify reactions as redox',
              'Balance redox equations',
              'Deduce oxidation numbers',
              'Compute electron transfer',
              'Name redox species',
              'Distinguish oxidizing/reducing agents',
              'Apply oxidation number naming',
              'Relate reagents to redox abilities',
            ],
            aiPrompt: "Explain redox reactions thoroughly. Cover: oxidation numbers, balancing, applications. Include corrosion examples. Discuss Nigerian industrial redox processes.",
          },
        ],
      },
      {
        id: 'section11',
        title: '11. Electrolysis',
        topics: [
          {
            id: '11.1',
            title: 'Electrolysis Principles',
            content: [
              'Electrolytes vs non-electrolytes',
              'Faraday laws of electrolysis',
              'Electrolysis of: H2SO4, CuSO4, NaCl',
              'Factors affecting ion discharge',
              'Applications: metal purification, production',
              'Electrochemical cells and series',
              'Electrode potentials calculations',
              'Corrosion as electrolytic process',
              'Corrosion prevention methods',
            ],
            objectives: [
              'Distinguish electrolytes',
              'Perform Faraday calculations',
              'Identify suitable electrodes',
              'Specify electrode reactions',
              'Determine electrolysis products',
              'Identify affecting factors',
              'Specify electrolysis applications',
              'Identify electrochemical cells',
              'Calculate electrode potentials',
              'Identify corrosion prevention',
            ],
            aiPrompt: "Explain electrolysis and electrochemical cells. Cover: Faraday laws, corrosion, applications. Include calculations. Discuss Nigerian applications: electroplating, battery technology.",
          },
        ],
      },
      {
        id: 'section12',
        title: '12. Energy Changes',
        topics: [
          {
            id: '12.1',
            title: 'Thermochemistry',
            content: [
              'Energy changes (ΔH) in reactions',
              'Endothermic (+ΔH) and exothermic (-ΔH)',
              'Entropy as order-disorder',
              'Spontaneity: ΔG° = 0 criterion',
              'Relationship: ΔG° = ΔH° - TΔS°',
              'Simple calculations',
            ],
            objectives: [
              'Determine heat change types',
              'Interpret heat change graphs',
              'Relate physical state to order',
              'Determine spontaneity conditions',
              'Relate ΔH, ΔS, ΔG',
              'Solve thermodynamic problems',
            ],
            aiPrompt: "Explain thermochemistry concepts. Cover: enthalpy, entropy, free energy. Include calculations. Use Nigerian examples: combustion of fuels, food calorimetry.",
          },
        ],
      },
      {
        id: 'section13',
        title: '13. Rates of Chemical Reaction',
        topics: [
          {
            id: '13.1',
            title: 'Chemical Kinetics',
            content: [
              'Factors affecting rates: temperature, concentration',
              'Surface area effects',
              'Catalysts: types and effects',
              'Reaction rate curves',
              'Activation energy',
              'Arrhenius law, collision theory',
              'Effect of light on reactions',
            ],
            objectives: [
              'Identify rate affecting factors',
              'Determine temperature effects',
              'Examine concentration effects',
              'Describe surface area effects',
              'Determine catalyst types/effects',
              'Interpret rate curves',
              'Solve rate problems',
              'Relate rate to kinetic theory',
              'Examine activation energy significance',
              'Deduce Ea from curves',
            ],
            aiPrompt: "Explain chemical kinetics. Cover: factors affecting rates, activation energy, catalysis. Include graphical analysis. Discuss Nigerian industrial applications.",
          },
        ],
      },
      {
        id: 'section14',
        title: '14. Chemical Equilibrium',
        topics: [
          {
            id: '14.1',
            title: 'Equilibrium Principles',
            content: [
              'Reversible reactions',
              'Dynamic equilibrium',
              'Le Chatelier principle',
              'Equilibrium constant',
              'Examples: steam-iron, N2O4/NO2',
            ],
            objectives: [
              'Identify equilibrium factors',
              'Predict equilibrium shifts',
              'Determine constant effects',
            ],
            aiPrompt: "Explain chemical equilibrium. Cover: Le Chatelier principle, equilibrium constant. Use industrial examples. Discuss Nigerian chemical processes.",
          },
        ],
      },
      {
        id: 'section15',
        title: '15. Non-Metals and Compounds',
        topics: [
          {
            id: '15.1',
            title: 'Hydrogen and Halogens',
            content: [
              'Hydrogen: production, properties, uses',
              'Test for hydrogen',
              'Chlorine: preparation, properties, uses',
              'Water sterilization, bleaching',
              'HCl manufacture, plastics, insecticides',
              'Hydrochloric acid preparation, properties',
              'Chlorides and tests',
            ],
            objectives: [
              'Predict preparation reagents',
              'Identify properties',
              'Compare properties',
              'Specify uses',
              'Determine specific tests',
              'Predict HCl reagents/properties',
            ],
            aiPrompt: "Explain hydrogen and halogen chemistry. Cover: preparation, properties, industrial uses. Discuss Nigerian applications: water treatment, PVC production.",
          },
          {
            id: '15.2',
            title: 'Oxygen and Sulphur',
            content: [
              'Oxygen: preparation, properties, uses',
              'Oxides: acidic, basic, amphoteric, neutral',
              'Ozone as allotrope, atmospheric importance',
              'Sulphur: allotropes, uses',
              'SO2 preparation, properties, uses',
              'Sulphuric acid: contact process',
              'H2S preparation and properties',
              'Tests: SO4²⁻, S²⁻',
            ],
            objectives: [
              'Identify oxygen allotropes',
              'Determine ozone significance',
              'Classify oxides',
              'Identify sulphur allotropes',
              'Predict SO2/H2S reagents',
              'Specify H2SO4 preparation/properties',
            ],
            aiPrompt: "Explain oxygen and sulphur chemistry. Cover: allotropes, acids, industrial processes. Discuss Nigerian sulphur sources and uses.",
          },
          {
            id: '15.3',
            title: 'Nitrogen Compounds',
            content: [
              'Nitrogen: preparation from air',
              'Ammonia: Haber process, properties, uses',
              'Ammonium salts, oxidation to nitric acid',
              'Nitric acid: preparation from ammonia',
              'Nitrate salts: action of heat',
              'Oxides of nitrogen: properties',
              'Nitrogen cycle',
              'Tests: NH4⁺, NO3⁻',
            ],
            objectives: [
              'Specify NH3 preparation',
              'Identify NH3 properties/uses',
              'Identify HNO3 reagents/properties',
              'Specify nitrogen oxide properties',
              'Examine nitrogen cycle relevance',
            ],
            aiPrompt: "Explain nitrogen chemistry. Cover: ammonia, nitric acid, nitrogen cycle. Discuss Nigerian fertilizer industry applications.",
          },
          {
            id: '15.4',
            title: 'Carbon Compounds',
            content: [
              'Carbon allotropes: uses, properties',
              'CO2: preparation, properties, uses',
              'Action of heat on carbonates',
              'CO: preparation, properties, blood effects',
              'Sources: charcoal, fire, exhaust',
              'Coal types, destructive distillation',
              'Coke gasification, synthesis gas',
              'Test: CO3²⁻',
            ],
            objectives: [
              'Identify carbon allotropes',
              'Predict CO2 preparation reagents',
              'Specify CO2 properties/uses',
              'Determine CO effects on humans',
              'Identify coal forms',
              'Determine uses',
              'Specify distillation products',
              'Specify coke/synthesis gas uses',
            ],
            aiPrompt: "Explain carbon chemistry. Cover: allotropes, oxides, fuels. Discuss Nigerian coal deposits and carbon-based industries.",
          },
        ],
      },
      {
        id: 'section16',
        title: '16. Metals and Compounds',
        topics: [
          {
            id: '16.1',
            title: 'General Metal Properties',
            content: [
              'General properties of metals',
              'Extraction methods',
              'Chemical reactivities',
              'Metallic ion tests',
            ],
            objectives: [
              'Specify general properties',
              'Determine extraction methods',
              'Relate extraction to properties',
              'Compare reactivities',
              'Specify uses',
              'Determine metallic ion tests',
            ],
            aiPrompt: "Explain general metal properties and extraction. Cover: reactivity series, extraction methods. Discuss Nigerian metal resources.",
          },
          {
            id: '16.2',
            title: 'Alkali and Alkaline Earth Metals',
            content: [
              'Sodium hydroxide: electrolysis of brine',
              'Action on Al, Zn, Pb ions',
              'Sodium carbonate: Solvay process',
              'Uses: glass manufacture',
              'Sodium chloride from sea water',
              'Calcium compounds: oxide, hydroxide, carbonate',
              'Cement composition, mortar setting',
              'Test: Ca²⁺',
            ],
            objectives: [
              'Determine compound production',
              'Compare compound reactivities',
              'Specify uses',
              'Specify cement composition',
            ],
            aiPrompt: "Explain alkali and alkaline earth metals. Cover: sodium, calcium compounds. Discuss Nigerian applications: cement industry, salt production.",
          },
          {
            id: '16.3',
            title: 'Aluminium and Tin',
            content: [
              'Aluminium: bauxite purification, extraction',
              'Properties and uses',
              'Test: Al³⁺',
              'Tin: extraction from ores',
              'Properties and uses',
            ],
            objectives: [
              'Describe bauxite purification',
              'Specify tin ores',
              'Relate extraction to properties',
              'Specify uses',
            ],
            aiPrompt: "Explain aluminium and tin chemistry. Cover: extraction, properties, uses. Discuss Nigerian aluminium industry and tin resources.",
          },
          {
            id: '16.4',
            title: 'Transition Metals and Iron',
            content: [
              'First transition series properties',
              'Electron configuration, oxidation states',
              'Complex ion formation, colored ions',
              'Catalysis',
              'Iron: extraction from ores',
              'Forms: cast iron, steel, wrought iron',
              'Steel advantages over iron',
              'Tests: Fe²⁺, Fe³⁺',
            ],
            objectives: [
              'Identify transition metal properties',
              'Deduce specific properties reasons',
              'Determine IUPAC complex names',
              'Determine iron extraction method',
              'Specify properties/uses',
              'Identify iron forms',
            ],
            aiPrompt: "Explain transition metals and iron chemistry. Cover: properties, extraction, steel production. Discuss Nigerian iron and steel industry.",
          },
          {
            id: '16.5',
            title: 'Copper and Alloys',
            content: [
              'Copper: extraction from ores',
              'Properties and uses',
              'Copper(II) sulphate preparation',
              'Test: Cu²⁺',
              'Alloys: steel, brass, bronze, duralumin',
              'Constituents and uses',
              'Comparison to pure metals',
            ],
            objectives: [
              'Identify copper extraction method',
              'Relate properties to uses',
              'Specify CuSO4 preparation',
              'Specify alloy constituents/uses',
              'Compare alloy/pure metal properties',
            ],
            aiPrompt: "Explain copper chemistry and alloys. Cover: extraction, properties, alloy formation. Discuss Nigerian copper resources and applications.",
          },
        ],
      },
      {
        id: 'section17',
        title: '17. Organic Chemistry',
        topics: [
          {
            id: '17.1',
            title: 'Organic Chemistry Fundamentals',
            content: [
              'Tetravalency of carbon',
              'IUPAC nomenclature',
              'Empirical formula determination',
              'Functional groups classification',
            ],
            objectives: [
              'Derive names from formulae',
              'Relate names to structures',
              'Relate carbon tetravalency to catenation',
              'Classify by functional groups',
              'Derive empirical/molecular formulae',
              'Relate structure to properties',
              'Derive isomers',
            ],
            aiPrompt: "Explain organic chemistry basics. Cover: IUPAC naming, isomerism, functional groups. Use Nigerian examples: local organic compounds.",
          },
          {
            id: '17.2',
            title: 'Aliphatic Hydrocarbons',
            content: [
              'Alkanes: homologous series, properties',
              'Substitution reactions, halogenated products',
              'Structural isomerism (up to C6)',
              'Petroleum: composition, fractional distillation',
              'Cracking, reforming, petrochemicals',
              'Octane number',
              'Alkenes: isomerism, addition, polymerization',
              'Polythene, synthetic rubber, vulcanization',
              'Alkynes: ethyne production, properties',
              'Test for terminal alkynes',
            ],
            objectives: [
              'Classify hydrocarbons',
              'Distinguish hydrocarbon properties',
              'Specify uses',
              'Identify crude oil as mixture',
              'Relate fractions to properties/uses',
              'Relate processes to quality',
              'Distinguish polymerization processes',
              'Specify vulcanization process',
              'Identify alkyne tests',
            ],
            aiPrompt: "Explain aliphatic hydrocarbons comprehensively. Cover: alkanes, alkenes, alkynes, petroleum refining. Discuss Nigerian petroleum industry.",
          },
          {
            id: '17.3',
            title: 'Aromatic Compounds and Oxygen Derivatives',
            content: [
              'Benzene: structure, properties, uses',
              'Alkanols: primary, secondary, tertiary',
              'Ethanol: fermentation, petroleum sources',
              'Local fermentation: palm wine gin',
              'Glycerol as polyhydric alcohol',
              'Oxidation tests (Lucas test)',
              'Alkanals vs alkanones: distinguishing tests',
              'Alkanoic acids: reactions, esterification',
              'Oxalic acid, benzoic acid',
            ],
            objectives: [
              'Distinguish aliphatic/aromatic',
              'Relate benzene properties to structure',
              'Compare alkanol classes',
              'Determine ethanol production',
              'Examine ethanol as energy source',
              'Distinguish alkanol classes',
              'Differentiate alkanals/alkanones',
              'Compare alkanoic acid types',
            ],
            aiPrompt: "Explain aromatic compounds and oxygen derivatives. Cover: benzene, alcohols, carbonyl compounds. Discuss Nigerian applications: local alcohol production.",
          },
          {
            id: '17.4',
            title: 'Esters, Amines, and Biomolecules',
            content: [
              'Alkanoates: formation from acids/alcohols',
              'Fats and oils as alkanoates',
              'Saponification: soap, margarine production',
              'Detergents vs soaps',
              'Amines: primary, secondary, tertiary',
              'Carbohydrates: mono-, di-, polysaccharides',
              'Sugar tests, reaction with H2SO4',
              'Hydrolysis: cellulose, starch',
              'Uses: beverages, pharmaceuticals, textiles',
              'Proteins: primary structure, hydrolysis',
              'Tests: Ninhydrin, Biuret, Millon, xanthoproteic',
              'Enzymes and functions',
              'Polymers: natural/synthetic rubber',
              'Addition/condensation polymerization',
              'Thermoplastic vs thermosetting plastics',
            ],
            objectives: [
              'Identify natural alkanoate sources',
              'Specify soap/detergent production',
              'Distinguish soap/detergent',
              'Compare amine classes',
              'Identify carbohydrate sources',
              'Compare carbohydrate classes',
              'Infer hydrolysis products',
              'Determine uses',
              'Specify sugar tests',
              'Identify protein structure',
              'Specify hydrolysis products',
              'Identify protein tests',
              'Distinguish natural/synthetic polymers',
              'Differentiate polymerization types',
              'Classify polymers and uses',
              'Distinguish plastic types',
            ],
            aiPrompt: "Explain esters, amines, and biomolecules. Cover: saponification, carbohydrates, proteins, polymers. Discuss Nigerian applications: soap making, food chemistry.",
          },
        ],
      },
      {
        id: 'section18',
        title: '18. Chemistry and Industry',
        topics: [
          {
            id: '18.1',
            title: 'Chemical Industries',
            content: [
              'Chemical industry types',
              'Raw materials',
              'Relevance to economy',
              'Fine vs heavy chemicals',
              'Biotechnology applications',
            ],
            objectives: [
              'Classify chemical industries',
              'Identify raw materials',
              'Distinguish fine/heavy chemicals',
              'Enumerate industry relevance',
              'Relate processes to biotechnology',
            ],
            aiPrompt: "Explain chemical industries and biotechnology. Cover: industry types, raw materials, applications. Discuss Nigerian chemical industries: petrochemicals, pharmaceuticals.",
          },
        ],
      },
      {
        id: 'textbooks',
        title: 'RECOMMENDED TEXTS',
        type: 'textbooks',
        content: [
          'Ababio, O. Y. (2009) New School Chemistry for Senior Secondary Schools',
          'Bajah, S.T. et al (1999-2000) Senior Secondary Chemistry',
          'Ojokuku, G. O. (2012) Understanding Chemistry for Schools and Colleges',
          'Odesina, I. A. (2008) Essential Chemistry for Senior Secondary Schools',
          'Uche, I. O. et al (2003) Countdown to WASSCE/SSCE, NECO, JME Chemistry',
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
        AsyncStorage.getItem('chemistry_ai_explanations'),
        AsyncStorage.getItem('isActivated'),
        AsyncStorage.getItem('userInfo'),
      ]);
      if (savedExplanations) setAiExplanations(JSON.parse(savedExplanations));
      if (savedActivation === 'true') setIsPremiumActivated(true);
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserInfo(user);
        if (user?.userId) await checkAiLimit(user.userId, 0, false);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const activatePremium = async () => {
    try {
      await AsyncStorage.setItem('isActivated', 'true');
      setIsPremiumActivated(true);
      setSubscriptionModalVisible(false);
      showAlert('Success', 'Premium features activated!');
      if (userInfo?.userId) await checkAiLimit(userInfo.userId, 0, false);
    } catch (error) {
      showAlert('Error', 'Failed to activate premium');
    }
  };


  // Calculate AI usage characters
  const calculateAiUsage = (prompt, aiResponse) => {
    const systemPrompt = 'You are an expert Chemistry tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current chemistry applications. Use proper chemical terminology and equations. Format in markdown.';
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
      await AsyncStorage.setItem('chemistry_ai_explanations', JSON.stringify(updated));
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
      showAlert(
        'Premium Feature', 
        'AI Explanation is for premium users.',
        [
          { text: 'Cancel', onPress: () => {} },
          { text: 'Activate', onPress: () => setSubscriptionModalVisible(true) }
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
      const prompt = `As a Chemistry expert, explain "${topic.title}" for UTME/JAMB Chemistry preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements for Chemistry:
1. Start with a clear definition in ## H2 heading
2. Use chemical equations properly formatted (e.g., 2H₂ + O₂ → 2H₂O)
3. Include Nigerian chemistry applications and examples
4. Provide step-by-step calculation examples where relevant
5. Highlight key chemical principles with **bold**
6. Include relevant diagrams or molecular structures in text form
7. Connect concepts to Nigerian industrial chemistry
8. Provide practice questions with solutions
9. Mention safety precautions where applicable

Format requirements:
- Use ## for main headings
- Use ### for subheadings
- Use bullet points with • 
- **Bold** for key chemical terms and formulas
- Use > for important chemical principles or laws
- Include Nigerian chemical industry examples
- Write chemical equations properly with subscripts (use HTML: H₂O, CO₂)
- Make it engaging for Nigerian students

Write in clear, educational style with emphasis on Nigerian chemistry context and practical laboratory applications.`;

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
              content: 'You are an expert Chemistry tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian examples and current chemistry applications. Use proper chemical terminology and equations. Format chemical formulas with subscripts (e.g., H₂O, CO₂). Format in markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000,
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
              await AsyncStorage.removeItem('chemistry_ai_explanations');
              setAiExplanations({});
              Alert.alert('Success', 'All Chemistry explanations cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear explanations');
            }
          }
        }
      ]
    );
  };

  const CustomAlertModal = () => (
    <Modal visible={customAlert.visible} transparent animationType="fade">
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{customAlert.title}</Text>
          <Text style={styles.alertMessage}>{customAlert.message}</Text>
          <div style={styles.alertButtons}>
            {customAlert.buttons.map((btn, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.alertButton, btn.style === 'cancel' ? styles.alertCancelBtn : {}]} 
                onPress={() => { btn.onPress?.(); closeAlert(); }}
              >
                <Text style={[styles.alertButtonText, btn.style === 'cancel' ? {color: '#666'} : {}]}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </div>
        </View>
      </View>
    </Modal>
  );
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
              name={isSaved ? "auto-awesome" : isPremiumActivated ? "science" : "lock"} 
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
            color="#e74c3c" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {section.type === 'objectives' ? (
              <View style={styles.objectivesContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <Icon name="check-circle" size={16} color="#e74c3c" style={styles.bulletIcon} />
                    <Text style={styles.objectiveText}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : section.type === 'textbooks' ? (
              <View style={styles.textbooksContainer}>
                {section.content.map((item, index) => (
                  <View key={index} style={styles.textbookItem}>
                    <Icon name="menu-book" size={16} color="#e74c3c" style={styles.bulletIcon} />
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
                        color="#c0392b" 
                      />
                    </TouchableOpacity>

                    {expandedTopics[topic.id] && (
                      <View style={styles.topicContent}>
                        {topic.content && topic.content.length > 0 && (
                          <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                              <Icon name="list" size={16} color="#e74c3c" />
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
                              <Icon name="school" size={16} color="#e74c3c" />
                              <Text style={styles.subsectionTitle}>Learning Objectives:</Text>
                            </View>
                            {topic.objectives.map((item, idx) => (
                              <View key={idx} style={styles.objectiveItem}>
                                <Icon name="target" size={14} color="#c0392b" style={styles.bulletIcon} />
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
            <Text style={styles.subscriptionSubtitle}>Access AI-Powered Chemistry</Text>
          </View>

          <View style={styles.subscriptionContent}>
            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#e74c3c" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI-Powered Chemistry</Text>
                <Text style={styles.featureDescription}>Get detailed explanations with Nigerian chemistry context</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#e74c3c" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Organic & Inorganic Chemistry</Text>
                <Text style={styles.featureDescription}>Comprehensive coverage of chemical concepts</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#e74c3c" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Nigerian Chemistry Applications</Text>
                <Text style={styles.featureDescription}>Real Nigerian chemical industry examples</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Icon name="check-circle" size={24} color="#e74c3c" />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Practice Problems</Text>
                <Text style={styles.featureDescription}>UTME-style questions with step-by-step solutions</Text>
              </View>
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.pricingTitle}>Premium Plan</Text>
              <Text style={styles.pricingAmount}>₦2,500 / month</Text>
              <Text style={styles.pricingNote}>Includes AI character credits for Chemistry</Text>
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
          <Icon name="science" size={32} color="white" style={styles.headerIcon} />
          <View>
            <Text style={styles.headerTitle}>CHEMISTRY</Text>
            <Text style={styles.headerSubtitle}>UTME Syllabus with AI Tutor</Text>
            <Text style={styles.headerNote}>Nigerian Chemistry Focus</Text>
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
            <Icon name="info" size={20} color="#e74c3c" />
            <Text style={styles.infoTitle}>How to Use This Syllabus</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.tipItem}>
              <Icon name="touch-app" size={16} color="#e74c3c" />
              <Text style={styles.tipText}>Tap topics to expand/collapse content</Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name={isPremiumActivated ? "science" : "lock"} size={16} color={isPremiumActivated ? "#c0392b" : "#999"} />
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
              <Icon name="calculate" size={16} color="#e74c3c" />
              <Text style={styles.tipText}>Includes chemical equations, calculations, and Nigerian applications</Text>
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
                <Icon name="science" size={20} color="#e74c3c" />
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
                  <ActivityIndicator size="large" color="#e74c3c" />
                  <Text style={styles.loadingText}>
                    Generating AI explanation with Nigerian chemistry context...
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
                <Icon name="share" size={20} color="#e74c3c" />
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

        <CustomAlertModal />
      {/* Subscription Modal */}
      {renderSubscriptionModal()}
      
      
    </View>
  );
};

// Markdown styles for Chemistry (with support for chemical equations)
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
    color: '#922B21',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 18,
    marginBottom: 8,
    textAlign: 'left',
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c0392b',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'left',
  },
  strong: {
    fontWeight: 'bold',
    color: '#922B21',
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#FDEDEC',
    fontFamily: 'System',
    fontSize: 15,
    paddingHorizontal: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#FADBD8',
    textAlign: 'left',
  },
  code_block: {
    backgroundColor: '#FDEDEC',
    fontFamily: 'System',
    fontSize: 16,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FADBD8',
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
    color: '#e74c3c',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#e74c3c',
  },
  text: {
    fontSize: 16,
    lineHeight: 28,
    color: '#333',
    textAlign: 'left',
  },
  link: {
    color: '#e74c3c',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#FDEDEC',
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
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
    backgroundColor: '#e74c3c',
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
    color: '#e74c3c',
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
    backgroundColor: '#FDEDEC',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#922B21',
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
    backgroundColor: '#FEF5E7',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FADBD8',
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
    color: '#e74c3c',
    flex: 1,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  aiButtonSaved: {
    backgroundColor: '#922B21',
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
    color: '#e74c3c',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#e74c3c',
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
    color: '#e74c3c',
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
    borderColor: '#e74c3c',
  },
  saveButton: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
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
    backgroundColor: '#e74c3c',
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
    backgroundColor: '#FDEDEC',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  pricingAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
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
    backgroundColor: '#e74c3c',
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
    backgroundColor: "rgba(231, 76, 60, 0.9)",
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
  //custom alert
   alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    elevation: 5
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10
  },
  alertMessage: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
    lineHeight: 22
  },
  alertButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#e74c3c'
  },
  alertCancelBtn: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});
