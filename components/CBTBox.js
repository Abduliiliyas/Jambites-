import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";


export default function CBTBox({title, description, color, onPress}){
  return(
  <TouchableOpacity
        onPress={onPress}
        style={{
          backgroundColor: color,
          padding: 17,
          borderRadius: 12,
          marginBottom: 16,
          height: 150
        }}
      >
        <Text style={{ fontSize: 20, fontWeight: "bold", color: "#198754" }}>
          {title}
        </Text>

        <Text style={{ marginTop: 8, fontSize: 14, color: "gray" }}>
          {description}
        </Text>

      </TouchableOpacity>
  
    )
}