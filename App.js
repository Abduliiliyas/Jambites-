// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, TouchableOpacity, View, Image, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

// Import your screens
import HomeScreen from "@/screens/HomeScreen";
import DebugScreen from "./screens/debugScreen";
import { saveResult, initializeSync, manualSync, getSyncStatus } from './simple-database';

const Stack = createStackNavigator();

// Simple Home Screen Wrapper with Debug Button
const HomeScreenWithDebug = ({ navigation }) => (
  <View style={{ flex: 1 }}>
    <HomeScreen />
    
    {/* Floating debug button */}
    <TouchableOpacity
      style={styles.debugButton}
      onPress={() => navigation.navigate('Debug')}
    >
      <Text style={styles.debugButtonText}>?</Text>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  // Save result as usual - it will auto-sync when online
  const handleSaveResult = async () => {
    try {
      await saveResult(
        department,
        questionId,
        totalQuestions,
        answered,
        correct,
        percentage,
        performance,
        timeTakenSeconds,
        questions
      );
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  // Optional: Manual sync button
  const handleManualSync = async () => {
    await manualSync();
  };

  // Check sync status
  const checkStatus = async () => {
    const status = await getSyncStatus();
    console.log('Sync status:', status);
  };

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading resources
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    initializeSync();
    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('./assets/images/log.png')} 
          style={styles.logo} 
        />
        <Text style={styles.subtitle}>
          Super cool application to help students practice national exam CBT and practicals.
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreenWithDebug}
          options={{
            title: 'HealthProf',
          }}
        />

        <Stack.Screen 
          name="Debug" 
          component={DebugScreen}
          options={{ title: 'Debug Console' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#139E5F',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  subtitle: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 8,
  },
  debugButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#667eea',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});