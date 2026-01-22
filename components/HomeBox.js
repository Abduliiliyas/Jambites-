import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

export default function HomeBox({ title, description, image, color, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: color,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", color: "#198754" }}>
        {title}
      </Text>

      <Text style={{ marginTop: 4, fontSize: 12, color: "#000" }}>
        {description}
      </Text>

      {image && (
        <Image
          source={image}
          style={{
            width: 100,
            height: 100,
            borderRadius: 10,
            marginLeft: '70%'
          }}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
};

