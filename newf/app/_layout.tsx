import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import notificationScheduler from '../src/services/scheduledNotificationService';

export default function RootLayout() {
  const colorScheme = Appearance.getColorScheme()
  const theme = colorScheme === 'dark' ? Colors.dark: Colors.light

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

 
  
  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 , backgroundColor: "#f8f9fa"}}>
      <Stack 
        screenOptions={{ 
          headerStyle: { backgroundColor: theme.headerBackground }, 
          headerTintColor: theme.text, 
          headerShadowVisible: false, 
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="subjects/Physics" options={{headerShown: false }} />
        <Stack.Screen name="subjects/PhysicalEducation" options={{headerShown: false }} />
        <Stack.Screen name="subjects/HomeEconomics" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Mathematics" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Yoruba" options={{headerShown: false }} />
        <Stack.Screen name="subjects/UseofEnglish" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Music" options={{headerShown: false }} />
        <Stack.Screen name="subjects/LiteritureinEnglish" options={{headerShown: false }} />
        <Stack.Screen name="subjects/IslamicStudies" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Igbo" options={{headerShown: false }} />
        <Stack.Screen name="subjects/History" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Hausa" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Government" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Geography" options={{headerShown: false }} />
        <Stack.Screen name="subjects/French" options={{headerShown: false }} />
        <Stack.Screen name="subjects/FineArts" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Economics" options={{headerShown: false }} />
        <Stack.Screen name="subjects/ComputerScience" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Commerce" options={{headerShown: false }} />
        <Stack.Screen name="subjects/ChristianReligiousStudies" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Chemistry" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Biology" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Arabic" options={{headerShown: false }} />
        <Stack.Screen name="subjects/AgriculturalScience" options={{headerShown: false }} />
        <Stack.Screen name="subjects/Accounting" options={{headerShown: false }} />
        
        
        <Stack.Screen name="index" options={{ 
          title: "Jambites", 
          headerTitleAlign: 'center',
          headerBackVisible: false, 
          headerShown: false 
        }} />
        
        <Stack.Screen name="HealthGPTScreen" options={{ 
          title: "HealthGPT", 
          headerTitleAlign: 'center',
          headerBackVisible: false, 
          headerShown: false 
        }} />
        <Stack.Screen name="debug" options={{ 
          title: "Debug Console", 
          headerTitleAlign: 'center',
          headerShown: true 
        }} />
        
        <Stack.Screen name="resultScreen" options={{ 
          title: "Result", 
          headerTitleAlign: 'center', 
          headerBackVisible: false 
        }} /> 
        
        <Stack.Screen name="instructionScreen" options={{ 
          title: "Instructions", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="syllabus" options={{ 
          title: "Jamb Syllabus", 
          headerTitleAlign: 'center' 
        }} /> 

        <Stack.Screen name="lessons" options={{ 
          title: "Jamb Lessons", 
          headerTitleAlign: 'center' 
        }} />
        <Stack.Screen name="selectSubject" options={{ 
          title: "Select Subject Combination", 
          headerTitleAlign: 'center' 
        }} />

        <Stack.Screen name="CBTScreen" options={{ 
          title: "Exam List", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="reviewScreen" options={{ 
          title: "Review questions", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="passQuestions" options={{ 
          title: "Study pass questions", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="startQuiz" options={{ 
          title: "Available Quizzes", 
          headerTitleAlign: 'center', 
          headerBackVisible: false 
        }} /> 
        
        <Stack.Screen name="lectures" options={{ 
          title: "Lectures", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="lectureDetail" options={{ 
          title: "Lecture Details", 
          headerTitleAlign: 'center', 
          headerShown: false 
        }} /> 
        
        <Stack.Screen name="quizHome" options={{ 
          title: "Start Quiz", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="subscription" options={{ 
          title: "Activation", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="CBT" options={{ 
          title: "Choose exam type", 
          headerTitleAlign: 'center' 
        }} /> 
        
        <Stack.Screen name="levelScreen" options={{ 
          title: "Levels", 
          headerTitleAlign: 'center' 
        }} /> 
        <Stack.Screen name="notifications" options={{ 
          title: "News update", 
          headerTitleAlign: 'center' 
        }} />
        <Stack.Screen name="notification-detail" options={{ 
          title: " ", 
          headerTitleAlign: 'center',
          headerShown: false  
        }} />
        <Stack.Screen name="livechatScreen" options={{ 
          headerBackVisible: false, 
          headerShown: false 
        }} />
        <Stack.Screen name="+not-found" />
      </Stack>

      <StatusBar style="auto" />
    </View>
  );
}