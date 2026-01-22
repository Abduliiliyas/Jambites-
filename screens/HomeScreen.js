import React from "react";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import HomeBox from "../components/HomeBox";

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      <HomeBox
        title="National Exam CBT Simulator"
        description={
          "Great tool to practice from the previous professional exam questions\nTo have insight about how to approach your upcoming CBT exam"
        }
        image={require("../assets/cbt.jpeg")}
        color="rgba(25, 135, 84, 0.25)"
        onPress={() => navigation.navigate("CBT")}
      />

      <HomeBox
        title="Past Questions"
        description={
          "Access and practice past professional exam questions.\nGet detailed explanations to improve your understanding."
        }
        image={require("../assets/past.jpeg")}
        color="rgba(13, 110, 253, 0.25)"
        onPress={() => navigation.navigate("PastQuestions")}
      />

      <HomeBox
        title="Nursing & Medical Procedures"
        description={
          "Step-by-step guides on key procedures to boost your clinical knowledge.\nLearn and revise anywhere, anytime."
        }
        image={require("../assets/procedures.jpeg")}
        color="rgba(255, 193, 7, 0.25)"
        onPress={() => navigation.navigate("Procedures")}
      />

      <HomeBox
        title="Unlock Premium"
        description={
          "Activate premium to access unlimited CBT practice, past questions, and all learning resources."
        }
        image={require("../assets/premium.jpeg")}
        color="rgba(220, 53, 69, 0.25)"
        onPress={() => navigation.navigate("Premium")}
      />
    </ScrollView>
  );
}
