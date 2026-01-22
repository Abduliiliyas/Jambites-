// PhysicsSyllabusScreen.js
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
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useRoute } from "@react-navigation/native";

// API Configuration
const DEEPSEEK_API_KEY = 'sk-532fc5b9d3ce464c8a7cecc8dd05d329';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const BACKEND_URL = 'https://healthprof.com.ng/api';

const PhysicsSyllabusScreen = () => {
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

  // Physics Syllabus Data from PDF
  const physicsSyllabusData = {
    sections: [
      {
        id: 'general',
        title: 'GENERAL OBJECTIVES',
        type: 'objectives',
        content: [
          'Sustain interest in physics',
          'Develop attitude relevant to physics that encourage accuracy, precision and objectivity',
          'Interpret physical phenomena, laws, definitions, concepts and other theories',
          'Demonstrate the ability to solve correctly physics problems using relevant theories and concepts',
        ],
      },
      {
        id: 'section1',
        title: '1. MEASUREMENTS AND UNITS',
        topics: [
          {
            id: '1.1',
            title: 'Length, Area and Volume',
            content: [
              'Metre rule, Vernier calipers, Micrometer Screw-gauge, measuring cylinder',
              'Units of length, area and volume',
              'Determination of lengths, surface areas and volume of regular and irregular bodies',
            ],
            objectives: [
              'Identify the units of length, area and volume',
              'Use different measuring instruments',
              'Determine lengths, surface areas and volume',
            ],
            aiPrompt: "Explain measurement of length, area and volume with examples. How to use Vernier calipers and micrometer screw-gauge? Calculate volume of irregular objects using displacement method. Convert between mm², cm², and m².",
          },
          {
            id: '1.2',
            title: 'Mass, Time and Physical Quantities',
            content: [
              'Unit of mass and use of simple beam balance',
              'Unit of time and time-measuring devices',
              'Fundamental and derived physical quantities',
              'Dimensions of physical quantities',
              'Limitations of experimental measurements',
            ],
            objectives: [
              'Identify units of mass and time',
              'Relate fundamental quantities to their units',
              'Deduce units of derived physical quantities',
              'Determine dimensions of physical quantities',
              'Express measurements in standard form',
            ],
            aiPrompt: "Explain fundamental vs derived quantities with examples. What are the 7 SI base units? How to determine dimensions of velocity, acceleration, force? Calculate error in measurements using significant figures. Convert 0.000345 to standard form.",
          },
          {
            id: '1.3',
            title: 'Measurement, Position, Distance and Displacement',
            content: [
              'Concept of displacement vs distance',
              'Position and coordinates',
              'Frame of reference',
              'Using strings, meter ruler, calipers',
            ],
            objectives: [
              'Distinguish between distance and displacement',
              'Use Cartesian systems to locate positions',
              'Plot graphs and draw inferences',
              'Use compass and protractor for directions',
            ],
            aiPrompt: "Explain difference between distance and displacement with vector diagrams. A car moves 5km East then 3km North. Calculate distance traveled and displacement. What is frame of reference? Plot position-time graph for uniform motion.",
          },
        ],
      },
      {
        id: 'section2',
        title: '2. SCALARS AND VECTORS',
        topics: [
          {
            id: '2.1',
            title: 'Scalar and Vector Quantities',
            content: [
              'Definition of scalar and vector quantities',
              'Examples of scalars and vectors',
              'Relative velocity',
              'Resolution of vectors into perpendicular components',
            ],
            objectives: [
              'Distinguish between scalar and vector quantities',
              'Give examples of each',
              'Determine resultant of vectors',
              'Resolve vectors into components',
            ],
            aiPrompt: "Explain scalar vs vector quantities with 5 examples each. Resolve 100N force at 30° into horizontal and vertical components. Calculate relative velocity: Car A at 60km/h East, Car B at 80km/h West. Find resultant of 3N East and 4N North.",
          },
        ],
      },
      {
        id: 'section3',
        title: '3. MOTION',
        topics: [
          {
            id: '3.1',
            title: 'Types of Motion and Forces',
            content: [
              'Translational, oscillatory, rotational, spin, random motion',
              'Causes of motion and types of forces',
              'Contact forces and field forces',
              'Linear motion: speed, velocity, acceleration',
            ],
            objectives: [
              'Identify different types of motion',
              'Identify force as cause of motion',
              'Differentiate between speed, velocity and acceleration',
              'Solve problems of motion under gravity',
            ],
            aiPrompt: "Explain 5 types of motion with real-life examples. Calculate acceleration of car from rest to 20m/s in 5s. A ball is thrown upward at 20m/s. Calculate max height and time to return. What is difference between contact and field forces?",
          },
          {
            id: '3.2',
            title: 'Equations of Motion and Graphs',
            content: [
              'Equations of uniformly accelerated motion',
              'Motion under gravity',
              'Distance-time and velocity-time graphs',
              'Instantaneous velocity and acceleration',
            ],
            objectives: [
              'Deduce equations of uniformly accelerated motion',
              'Solve motion under gravity problems',
              'Interpret distance-time and velocity-time graphs',
              'Compute instantaneous velocity',
            ],
            aiPrompt: "Derive the three equations of motion. Object falls from height 80m. Calculate time to hit ground and velocity at impact. Draw and interpret v-t graph for: a) constant velocity b) constant acceleration c) deceleration. Find instantaneous velocity from position-time graph.",
          },
          {
            id: '3.3',
            title: 'Projectile Motion',
            content: [
              'Calculation of range, maximum height, time of flight',
              'Projectiles from ground and from height',
              'Applications of projectile motion',
            ],
            objectives: [
              'Establish expressions for range, maximum height, time of flight',
              'Solve problems involving projectile motion',
            ],
            aiPrompt: "Derive equations for projectile motion. Ball kicked at 20m/s at 30° angle. Calculate max height, range, time of flight. Compare time of flight for objects dropped vs projected horizontally from same height. Real-life applications of projectile motion.",
          },
          {
            id: '3.4',
            title: 'Newtons Laws of Motion',
            content: [
              'Inertia, mass and force',
              'Relationship between mass and acceleration',
              'Impulse and momentum',
              'Conservation of linear momentum',
              'Force-time graphs',
            ],
            objectives: [
              'Interpret Newtons laws of motion',
              'Compare inertia, mass and force',
              'Solve numerical problems involving impulse and momentum',
              'Interpret area under force-time graph',
            ],
            aiPrompt: "Explain Newton's three laws with examples. Calculate force needed to give 5kg mass acceleration 2m/s². Two cars collide: 1000kg at 20m/s and 1500kg at 15m/s in opposite directions. Find velocity after perfectly inelastic collision. Interpret force-time graph.",
          },
          {
            id: '3.5',
            title: 'Circular Motion and SHM',
            content: [
              'Angular velocity and acceleration',
              'Centripetal and centrifugal forces',
              'Simple Harmonic Motion definition',
              'Period, frequency, amplitude of SHM',
              'Force vibration and resonance',
            ],
            objectives: [
              'Establish expressions for angular velocity and centripetal force',
              'Solve problems involving motion in a circle',
              'Analyze energy changes in SHM',
              'Identify different types of forced vibration',
            ],
            aiPrompt: "Explain centripetal force with examples. Car rounds curve radius 50m at 72km/h. Calculate centripetal acceleration. Mass on spring executes SHM with period 2s, amplitude 0.1m. Calculate max velocity. What is resonance? Give examples.",
          },
        ],
      },
      {
        id: 'section4',
        title: '4. GRAVITATIONAL FIELD',
        topics: [
          {
            id: '4.1',
            title: 'Gravity and Gravitation',
            content: [
              "Newton's law of universal gravitation",
              'Gravitational potential',
              'Acceleration due to gravity (g)',
              'Variation of g on Earth surface',
              'Mass vs weight, escape velocity',
            ],
            objectives: [
              "Apply Newton's law of universal gravitation",
              'Deduce expression for gravitational field potential',
              'Identify causes of variation of g',
              'Differentiate between mass and weight',
              'Determine escape velocity',
            ],
            aiPrompt: "State Newton's law of gravitation. Calculate force between Earth and Moon. Why does g vary with altitude and latitude? Calculate weight of 70kg person at equator vs poles. Derive escape velocity formula. Calculate escape velocity from Earth.",
          },
        ],
      },
      {
        id: 'section5',
        title: '5. EQUILIBRIUM OF FORCES',
        topics: [
          {
            id: '5.1',
            title: 'Equilibrium Principles',
            content: [
              'Equilibrium of particles and coplanar forces',
              'Triangle and polygon of forces',
              "Lami's theorem",
              'Principles of moments',
              'Centre of gravity and stability',
            ],
            objectives: [
              'Apply conditions for equilibrium of coplanar forces',
              'Use triangle and polygon laws',
              "Use Lami's theorem",
              'Determine moment of force and couple',
              'Differentiate between stable, unstable, neutral equilibrium',
            ],
            aiPrompt: "Explain conditions for equilibrium. 3 forces: 10N at 0°, 15N at 120°, 20N at 240°. Are they in equilibrium? Use Lami's theorem. Uniform beam 4m long, weight 200N, supported at ends. Load 300N at 1m from left. Find reactions. Define stable, unstable, neutral equilibrium with examples.",
          },
        ],
      },
      {
        id: 'section6',
        title: '6. WORK, ENERGY AND POWER',
        topics: [
          {
            id: '6.1',
            title: 'Energy Concepts',
            content: [
              'Definition of work, energy and power',
              'Forms of energy',
              'Conservation of energy',
              'Interpretation of area under force-distance curve',
              'Energy sources and society',
            ],
            objectives: [
              'Differentiate between work, energy and power',
              'Compare different forms of energy',
              'Apply principle of conservation of energy',
              'Interpret area under force-distance curve',
              'Distinguish renewable and non-renewable energy',
            ],
            aiPrompt: "Define work, energy, power with formulas. Calculate work done lifting 50kg mass through 10m. Efficiency problems. Explain conservation of energy with pendulum example. Compare fossil fuels, solar, wind, nuclear. Environmental impact of energy use.",
          },
        ],
      },
      {
        id: 'section7',
        title: '7. FRICTION',
        topics: [
          {
            id: '7.1',
            title: 'Friction and Viscosity',
            content: [
              'Static and dynamic friction',
              'Coefficient of limiting friction',
              'Advantages and disadvantages of friction',
              'Reduction of friction',
              'Viscosity and terminal velocity',
              "Stoke's law",
            ],
            objectives: [
              'Differentiate between static and dynamic friction',
              'Determine coefficient of limiting friction',
              'Compare advantages and disadvantages',
              'Suggest ways to reduce friction',
              'Analyze factors affecting viscosity',
              "Apply Stoke's law",
            ],
            aiPrompt: "Explain static vs kinetic friction. Block weight 50N, requires 20N to start moving, 15N to keep moving. Find μs and μk. Why is friction necessary? Methods to reduce friction. Oil viscosity comparison. Derive terminal velocity from Stoke's law.",
          },
        ],
      },
      {
        id: 'section8',
        title: '8. SIMPLE MACHINES',
        topics: [
          {
            id: '8.1',
            title: 'Machines and Efficiency',
            content: [
              'Definition of simple machines',
              'Types of machines',
              'Mechanical advantage, velocity ratio, efficiency',
            ],
            objectives: [
              'Identify different types of simple machines',
              'Solve problems involving simple machines',
            ],
            aiPrompt: "Explain 6 simple machines with examples. Load 400N lifted using lever with effort 100N. If MA=5, find VR and efficiency. Inclined plane: length 5m, height 1m. Find MA, VR if efficiency is 80%. Real-life applications.",
          },
        ],
      },
      {
        id: 'section9',
        title: '9. ELASTICITY',
        topics: [
          {
            id: '9.1',
            title: "Hooke's Law and Young's Modulus",
            content: [
              'Elastic limit, yield point, breaking point',
              "Hooke's law",
              "Young's modulus",
              'Spring balance for measuring force',
              'Work done in springs',
            ],
            objectives: [
              'Interpret force-extension curves',
              "Interpret Hooke's law and Young's modulus",
              'Use spring balance to measure force',
              'Determine work done in springs',
            ],
            aiPrompt: "Explain Hooke's law with formula. Spring extends 5cm under 20N load. Find spring constant. Wire length 2m, diameter 1mm extends 0.5mm under 100N. Calculate Young's modulus. Plot and interpret force-extension graph showing elastic limit, yield point.",
          },
        ],
      },
      {
        id: 'section10',
        title: '10. PRESSURE',
        topics: [
          {
            id: '10.1',
            title: 'Atmospheric and Liquid Pressure',
            content: [
              'Atmospheric pressure definition and units',
              'Measurement: barometer, manometer',
              'Variation with height',
              'Pressure in liquids: P = ρgh',
              "Pascal's principle",
            ],
            objectives: [
              'Recognize SI units of pressure',
              'Identify pressure measuring instruments',
              'Relate variation of pressure to height',
              'Determine relationship P = ρgh',
              "Apply Pascal's principle",
            ],
            aiPrompt: "Explain atmospheric pressure. Why mercury in barometers? Calculate pressure at depth 10m in water. Hydraulic press: small piston area 5cm², large 100cm². Force 50N on small. Find force on large. How does pressure change with altitude?",
          },
        ],
      },
      {
        id: 'section11',
        title: '11. LIQUIDS AT REST',
        topics: [
          {
            id: '11.1',
            title: 'Density and Buoyancy',
            content: [
              'Determination of density of solids and liquids',
              'Relative density',
              'Upthrust and Archimedes principle',
              'Law of floatation',
              'Applications: ships, hydrometers',
            ],
            objectives: [
              'Distinguish between density and relative density',
              'Determine upthrust on immersed body',
              "Apply Archimedes' principle",
              'Apply law of floatation',
            ],
            aiPrompt: "Define density, relative density. Stone weight 10N in air, 6N in water. Find volume, density, relative density. Explain why ships float. Hydrometer principle. Calculate upthrust on 0.5m³ block submerged in water.",
          },
        ],
      },
      {
        id: 'section12',
        title: '12. TEMPERATURE AND MEASUREMENT',
        topics: [
          {
            id: '12.1',
            title: 'Thermometry',
            content: [
              'Concept of temperature',
              'Thermometric properties',
              'Calibration of thermometers',
              'Temperature scales: Celsius and Kelvin',
              'Types of thermometers',
            ],
            objectives: [
              'Identify thermometric properties',
              'Calibrate thermometers',
              'Differentiate between temperature scales',
              'Convert between scales',
            ],
            aiPrompt: "Define temperature. Properties used in thermometers. Convert 37°C to Kelvin, 300K to °C. Calibrate thermometer using ice and steam points. Compare mercury, alcohol, digital thermometers. Why Kelvin scale important?",
          },
        ],
      },
      {
        id: 'section13',
        title: '13. THERMAL EXPANSION',
        topics: [
          {
            id: '13.1',
            title: 'Expansion of Solids and Liquids',
            content: [
              'Linear, area, volume expansivities',
              'Effects and applications',
              'Relationship between different expansivities',
              'Anomalous expansion of water',
            ],
            objectives: [
              'Determine linear and volume expansivities',
              'Assess effects and applications',
              'Determine relationship between expansivities',
              'Analyze anomalous expansion of water',
            ],
            aiPrompt: "Define linear expansivity α. Steel rail 20m at 20°C, heated to 40°C. α=1.2×10⁻⁵/°C. Find new length. Why gaps in railway tracks? Relationship α:β:γ = 1:2:3. Why does water expand when cooled from 4°C to 0°C? Biological importance.",
          },
        ],
      },
      {
        id: 'section14',
        title: '14. GAS LAWS',
        topics: [
          {
            id: '14.1',
            title: 'Gas Behavior',
            content: [
              "Boyle's law (isothermal)",
              "Charles' law (isobaric)",
              'Pressure law (volumetric)',
              'Absolute zero temperature',
              'General gas equation',
              'Ideal gas equation',
            ],
            objectives: [
              "Differentiate between gas laws",
              'Understand absolute zero',
              'Apply general gas equation',
              'Use ideal gas equation',
            ],
            aiPrompt: "State Boyle's, Charles', Pressure laws with formulas. Gas at 27°C, volume 2L, pressure 3atm. Find volume at 127°C, 2atm. What is absolute zero? Derive PV = nRT. Calculate moles in 5L oxygen at 300K, 1atm.",
          },
        ],
      },
      {
        id: 'section15',
        title: '15. QUANTITY OF HEAT',
        topics: [
          {
            id: '15.1',
            title: 'Heat Capacity',
            content: [
              'Heat as form of energy',
              'Heat capacity and specific heat capacity',
              'Determination by mixture method',
              'Electrical method',
              "Newton's law of cooling",
            ],
            objectives: [
              'Differentiate heat capacity and specific heat',
              'Determine values using simple methods',
              'Solve numerical problems',
            ],
            aiPrompt: "Define specific heat capacity. 200g water at 20°C mixed with 100g at 80°C. Find final temperature. Electric heater 500W heats 2kg water 10°C. Calculate time required. Explain Newton's law of cooling.",
          },
        ],
      },
      {
        id: 'section16',
        title: '16. CHANGE OF STATE',
        topics: [
          {
            id: '16.1',
            title: 'Latent Heat',
            content: [
              'Latent heat definition',
              'Specific latent heats of fusion and vaporization',
              'Melting, evaporation, boiling',
              'Influence of pressure on boiling/melting points',
              'Applications',
            ],
            objectives: [
              'Differentiate latent heat and specific latent heat',
              'Differentiate melting, evaporation, boiling',
              'Examine effects of pressure',
              'Solve numerical problems',
            ],
            aiPrompt: "Define latent heat of fusion, vaporization. Calculate heat to melt 100g ice at 0°C. Lf=336J/g. Why does boiling point decrease with altitude? Pressure cooker principle. Why salt on icy roads?",
          },
        ],
      },
      {
        id: 'section17',
        title: '17. VAPOURS',
        topics: [
          {
            id: '17.1',
            title: 'Humidity and Saturation',
            content: [
              'Unsaturated and saturated vapours',
              'Saturated vapour pressure vs boiling',
              'Dew point, humidity, relative humidity',
              'Formation of dew, mist, fog, rain',
              'Hygrometry',
            ],
            objectives: [
              'Distinguish saturated/unsaturated vapours',
              'Relate SVP to boiling point',
              'Determine SVP by barometer method',
              'Differentiate dew point, humidity',
              'Estimate humidity using hygrometers',
            ],
            aiPrompt: "Explain saturated vapour pressure. Why does water boil at lower temperature on mountains? Dry bulb 30°C, wet bulb 25°C. Find relative humidity using tables. Formation of dew vs frost. Psychrometer working principle.",
          },
        ],
      },
      {
        id: 'section18',
        title: '18. STRUCTURE OF MATTER & KINETIC THEORY',
        topics: [
          {
            id: '18.1',
            title: 'Molecular Theory',
            content: [
              'Atoms and molecules',
              'Molecular theory explanations',
              'Brownian motion, diffusion',
              'Surface tension, capillarity',
              'Adhesion, cohesion, contact angle',
            ],
            objectives: [
              'Differentiate atoms and molecules',
              'Use theory to explain phenomena',
              'Examine assumptions of kinetic theory',
              'Interpret pressure exerted by gases',
            ],
            aiPrompt: "Explain Brownian motion as evidence for molecules. Why does ink diffuse in water? Calculate rms speed of oxygen at 27°C. Explain surface tension with examples. Capillary rise in narrow tube. Kinetic theory explanation of gas pressure.",
          },
        ],
      },
      {
        id: 'section19',
        title: '19. HEAT TRANSFER',
        topics: [
          {
            id: '19.1',
            title: 'Conduction, Convection, Radiation',
            content: [
              'Modes of heat transfer',
              'Temperature gradient, thermal conductivity',
              'Effect of surface nature on radiation',
              'Thermos flask working',
              'Land and sea breezes',
            ],
            objectives: [
              'Differentiate conduction, convection, radiation',
              'Solve problems on thermal conductivity',
              'Assess effect of surface on radiation',
              'Relate thermos flask components',
              'Differentiate land and sea breezes',
            ],
            aiPrompt: "Compare conduction, convection, radiation with examples. Copper rod 1m, cross-section 2cm², ΔT=100°C, k=400W/mK. Find heat flow per second. Why are radiators painted black? How does thermos flask minimize heat transfer? Explain land/sea breeze cycle.",
          },
        ],
      },
      {
        id: 'section20',
        title: '20. WAVES',
        topics: [
          {
            id: '20.1',
            title: 'Wave Properties',
            content: [
              'Wave motion and production',
              'Frequency, wavelength, velocity: V = fλ',
              'Phase difference, wave number',
              'Progressive wave equation',
              'Classification: mechanical/electromagnetic',
              'Longitudinal/transverse waves',
            ],
            objectives: [
              'Interpret wave motion',
              'Relate frequency, wavelength to velocity',
              'Determine phase difference',
              'Use progressive wave equation',
              'Differentiate wave types',
            ],
            aiPrompt: "Explain wave parameters. Wave speed 340m/s, frequency 500Hz. Find wavelength. Write equation for wave: amplitude 0.1m, frequency 50Hz, speed 20m/s. Compare sound (longitudinal) and light (transverse) waves. What are electromagnetic waves?",
          },
          {
            id: '20.2',
            title: 'Wave Characteristics',
            content: [
              'Reflection, refraction, diffraction',
              'Polarization',
              'Superposition and interference',
              'Beats',
              'Doppler effect',
            ],
            objectives: [
              'Differentiate reflection, refraction, diffraction',
              'Analyze principle of superposition',
              'Explain beats and beat frequency',
              'Explain Doppler effect',
            ],
            aiPrompt: "Explain wave phenomena with examples. Two waves interfere: path difference λ/2. Result? Two tuning forks 256Hz and 260Hz produce beats. Calculate beat frequency. Ambulance siren approaches at 30m/s, frequency 1000Hz. Obbar-chart stationary. Heard frequency?",
          },
        ],
      },
      {
        id: 'section21',
        title: '21-22. SOUND WAVES',
        topics: [
          {
            id: '21.1',
            title: 'Sound Propagation and Characteristics',
            content: [
              'Need for material medium',
              'Speed in solids, liquids, gases',
              'Reflection: echoes, reverberation',
              'Noise vs musical notes',
              'Quality, pitch, intensity, loudness',
              'Harmonics and overtones',
            ],
            objectives: [
              'Determine need for medium',
              'Compare speed in different media',
              'Solve echo problems',
              'Differentiate noise and musical notes',
              'Identify overtones',
            ],
            aiPrompt: "Why no sound in vacuum? Speed of sound air 340m/s, water 1500m/s, steel 5000m/s. Why differences? Echo heard 2s after shout. Distance to cliff? Fundamental frequency of string: L=0.5m, T=100N, μ=0.01kg/m. Find fo and first two overtones.",
          },
        ],
      },
      {
        id: 'section22',
        title: '23-27. LIGHT AND OPTICS',
        topics: [
          {
            id: '23.1',
            title: 'Light Energy and Reflection',
            content: [
              'Sources of light',
              'Propagation: speed, frequency, wavelength',
              'Shadows and eclipses',
              'Laws of reflection',
              'Mirrors: plane, concave, convex',
              'Mirror formula: 1/f = 1/u + 1/v',
            ],
            objectives: [
              'Compare natural and artificial sources',
              'Interpret formation of shadows',
              'Interpret laws of reflection',
              'Apply mirror formula',
              'Determine magnification',
            ],
            aiPrompt: "Speed of light 3×10⁸m/s. Yellow light λ=600nm. Find frequency. Object 5cm tall 20cm from concave mirror f=10cm. Find image position, size, nature. Total solar eclipse explanation. Periscope working.",
          },
          {
            id: '24.1',
            title: 'Refraction and Lenses',
            content: [
              'Laws of refraction',
              'Refractive index',
              "Snell's law",
              'Real and apparent depth',
              'Critical angle and total internal reflection',
              'Lens formula and magnification',
            ],
            objectives: [
              'Interpret laws of refraction',
              'Determine refractive index',
              'Determine conditions for total internal reflection',
              'Use lens formula',
            ],
            aiPrompt: "Light enters water from air at 30°. n_water=1.33. Find angle in water. Critical angle for glass n=1.5. Convex lens f=15cm, object 30cm away. Find image. Optical fibre working. Rainbow formation.",
          },
          {
            id: '25.1',
            title: 'Optical Instruments and Dispersion',
            content: [
              'Microscopes, telescopes, cameras',
              'Human eye and sight defects',
              'Dispersion of white light',
              'Colour mixing and filters',
              'Electromagnetic spectrum',
            ],
            objectives: [
              'Apply principles of optical instruments',
              'Detect sight defects and corrections',
              'Understand rainbow formation',
              'Analyze electromagnetic spectrum',
            ],
            aiPrompt: "Compare microscope and telescope. Myopia correction with concave lens. Hypermetropia correction. Why does prism disperse white light? Primary colours. Uses of different EM waves: radio, microwave, x-ray, gamma.",
          },
        ],
      },
      {
        id: 'section23',
        title: '28-32. ELECTRICITY',
        topics: [
          {
            id: '28.1',
            title: 'Electrostatics and Capacitors',
            content: [
              'Charging by friction, contact, induction',
              "Coulomb's law",
              'Electric field and potential',
              'Capacitors: types and functions',
              'Capacitance: C = εA/d',
              'Energy stored in capacitor',
            ],
            objectives: [
              'Apply Coulombs law',
              'Deduce expressions for electric field',
              'Analyze factors affecting capacitance',
              'Determine energy stored',
            ],
            aiPrompt: "Two charges +5μC and -3μC separated by 0.1m. Find force. Parallel plate capacitor: area 0.01m², separation 1mm, εr=5. Calculate capacitance. Energy stored when charged to 100V. Lightning conductor principle.",
          },
          {
            id: '29.1',
            title: 'Current Electricity',
            content: [
              'EMF, potential difference, current',
              "Ohm's law",
              'Resistivity and conductivity',
              'Resistors in series/parallel',
              'Potentiometer measurements',
              'Electrical energy and power',
            ],
            objectives: [
              'Differentiate EMF, PD, current',
              "Apply Ohm's law",
              'Compute effective resistance',
              'Measure using potentiometer',
              'Apply expressions for electrical energy',
            ],
            aiPrompt: "Circuit: 12V battery, internal resistance 0.5Ω, external 5Ω. Find current, terminal voltage. Three resistors 2Ω, 3Ω, 6Ω in parallel. Find equivalent. Power consumed by 100W bulb in 2 hours. Cost at ₦50/kWh. Kirchhoff's laws application.",
          },
        ],
      },
      {
        id: 'section24',
        title: '33-36. MAGNETISM & ELECTROMAGNETISM',
        topics: [
          {
            id: '33.1',
            title: 'Magnets and Electromagnetic Induction',
            content: [
              'Natural and artificial magnets',
              'Magnetic fields around conductors',
              "Earth's magnetic field",
              "Faraday's laws of induction",
              'Lenzs law',
              'Transformers',
              'Simple AC circuits',
            ],
            objectives: [
              'Differentiate magnetic properties',
              'Determine flux patterns',
              'Interpret electromagnetic induction',
              'Recognize Lenzs law as energy conservation',
              'Analyze AC circuits',
            ],
            aiPrompt: "Right-hand grip rule for solenoid. Transformer: primary 1000 turns, secondary 100 turns, input 240V AC. Find output. Explain Faraday's and Lenz's laws with magnet and coil demo. RLC circuit resonance condition. Peak vs RMS values.",
          },
        ],
      },
      {
        id: 'section25',
        title: '37-39. MODERN PHYSICS',
        topics: [
          {
            id: '37.1',
            title: 'Modern Physics',
            content: [
              'Electrolysis and Faraday laws',
              'Conduction through gases',
              'Bohr atomic model',
              'Photoelectric effect',
              'X-rays production and properties',
              'Radioactivity and half-life',
              'Nuclear energy: fusion and fission',
              'Semiconductors and electronics',
            ],
            objectives: [
              'Apply Faradays laws of electrolysis',
              'Compare thermionic and photoelectric emission',
              'Apply Einstein photoelectric equation',
              'Distinguish stable/unstable nuclei',
              'Differentiate conductors/semiconductors',
            ],
            aiPrompt: "Photoelectric effect: threshold frequency 5×10¹⁴Hz. Light frequency 8×10¹⁴Hz shines. Find max kinetic energy of electrons. Radioactive sample half-life 5 days. Initial activity 400Bq. Activity after 15 days? Explain p-n junction diode. Compare nuclear fission and fusion.",
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
        AsyncStorage.getItem('physics_ai_explanations'),
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
    const systemPrompt = 'You are an expert physics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for equations.';
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
      await AsyncStorage.setItem('physics_ai_explanations', JSON.stringify(updated));
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
      const prompt = `As a physics tutor, explain "${topic.title}" for UTME/JAMB preparation in markdown format.

${topic.aiPrompt || `Cover these topics: ${topic.content.join(', ')}`}

Teaching requirements:
1. Start with a clear definition in ## H2 heading
2. Explain key concepts in simple terms with bullet points
3. Provide 2-3 worked examples with step-by-step solutions using **bold** for important steps
4. Include relevant formulas using \`code blocks\` for equations
5. Give practical applications or real-world examples from Nigerian context
6. Highlight common mistakes to avoid with ❌ emoji
7. Provide practice problem at the end with ✅ solution
8. Use Nigerian context where applicable (local examples, Naira for costs)

Format the response in markdown with:
- Headings (##, ###)
- Bullet points with •
- **Bold** for emphasis
- \`code blocks\` for equations
- Tables if needed
- Clear section separation

Make it engaging and educational for JAMB preparation.`;

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
              content: 'You are an expert physics tutor specializing in UTME/JAMB syllabus. Explain concepts clearly with Nigerian context. Use step-by-step examples and format your response in markdown with proper headings, bullet points, and code blocks for equations.'
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
              await AsyncStorage.removeItem('physics_ai_explanations');
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
              name={isSaved ? "auto-awesome" : "science"} 
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
        <Icon name="science" size={32} color="white" style={styles.headerIcon} />
        <View>
          <Text style={styles.headerTitle}>PHYSICS</Text>
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
        <Icon name="info" size={20} color="#d32f2f" />
        <Text style={styles.infoTitle}>How to Use Physics Syllabus</Text>
      </View>
      <View style={styles.infoContent}>
        <View style={styles.tipItem}>
          <Icon name="touch-app" size={16} color="#4caf50" />
          <Text style={styles.tipText}>Tap section headers to expand/collapse</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name={"science"} size={16} color={isPremiumActivated ? "#ff9800" : "#999"} />
          <Text style={styles.tipText}>
            {isPremiumActivated ? 'AI Explain for physics concepts' : 'Activate premium for AI explanations'}
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
          <Text style={styles.tipText}>AI physics explanations saved offline</Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="calculate" size={16} color="#9c27b0" />
          <Text style={styles.tipText}>Worked examples with step-by-step solutions</Text>
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
            color="#d32f2f" 
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
                            <Icon name="list" size={16} color="#d32f2f" />
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
                            <Icon name="school" size={16} color="#d32f2f" />
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
        {Object.keys(aiExplanations).length} physics topics have AI notes saved
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

        {physicsSyllabusData.sections.map(section => renderSection(section))}

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
                <Icon name="science" size={20} color="#ff9800" />
                <Text style={styles.modalTitle}>
                  {selectedTopic?.title} - Physics AI Explanation
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
                  <ActivityIndicator size="large" color="#d32f2f" />
                  <Text style={styles.loadingText}>
                    Generating physics explanation with formulas...
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
                <Icon name="share" size={20} color="#d32f2f" />
                <Text style={styles.modalActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.saveButton]}
                onPress={() => {
                  if (selectedTopic) {
                    saveExplanation(selectedTopic.id, aiResponse);
                    Alert.alert('Saved', 'Physics explanation saved successfully!');
                  }
                }}
              >
                <Icon name="bookmark" size={20} color="#fff" />
                <Text style={[styles.modalActionText, styles.saveButtonText]}>
                  Save Physics Note
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

// Styles with physics theme colors
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginBottom:35
  },
  header: {
    backgroundColor: '#d32f2f',
    padding: 20,
    paddingTop: 40,
    paddingLeft:10,
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
    color: '#d32f2f',
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
    backgroundColor: '#ffebee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#b71c1c',
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
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffcdd2',
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
    color: '#c62828',
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
    color: '#d32f2f',
    marginLeft: 6,
  },
  contentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  bullet: {
    color: '#d32f2f',
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
    color: '#b71c1c',
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
    borderColor: '#d32f2f',
  },
  saveButton: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
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

// Markdown styles for physics
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#b71c1c',
    marginTop: 20,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 18,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f44336',
    marginTop: 16,
    marginBottom: 6,
  },
  strong: {
    fontWeight: 'bold',
    color: '#b71c1c',
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
    color: '#d32f2f',
  },
  ordered_list_icon: {
    marginRight: 10,
    fontSize: 16,
    color: '#d32f2f',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default PhysicsSyllabusScreen;