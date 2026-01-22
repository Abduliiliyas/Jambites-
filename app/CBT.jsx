import { ScrollView, BackHandler, TouchableOpacity, View, StyleSheet, Text, Platform } from "react-native";
import CBTBox from "../components/CBTBox";
import AdBanner from "../components/AdBanner";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function CBTScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load activation status
  const loadActivationStatus = async () => {
    try {
      const activated = await AsyncStorage.getItem('isActivated');
      console.log('Activation status:', activated);
      setIsActivated(activated === 'true');
    } catch (error) {
      console.log('Error loading activation status:', error);
      setIsActivated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem('study', 'false');
      await loadActivationStatus();
    })();
  }, []);
  
  // Refresh activation status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadActivationStatus();
    }, [])
  );
  
  // Handle back button press
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.replace("/")
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [router])
  );
   
  // Custom back button that goes to home
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          style={{ marginLeft: 15 }}
          onPress={() => router.push("/")}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  // Don't show anything while loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
       <CBTBox
  title="Full Mock Exam"
  description="Complete practice test with actual exam format and timing"
  color="rgba(92, 184, 92, 0.5)"
  onPress={async () => {
    try {
      await AsyncStorage.setItem('examType', 'full');
      router.push("/CBTScreen");
    } catch (error) {
      console.error('Error saving exam type:', error);
    }
  }}
/>

<CBTBox
  title="Level-wise Practice"
  description={`Practice tests organized by difficulty levels to track progress systematically\n20 questions for English, 10 questions for other subjects`}
  color="rgba(92, 184, 92, 0.5)"
  onPress={async () => {
    try {
      await AsyncStorage.setItem('examType', 'level');
      router.push("/CBTScreen");
    } catch (error) {
      console.error('Error saving exam type:', error);
    }
  }}
/>
     </ScrollView>
      
      {/* Banner Ad at the bottom - Only show if not activated */}
      {!isActivated && <AdBanner />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    marginBottom: 30,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  debugContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});