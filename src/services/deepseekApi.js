import AsyncStorage from '@react-native-async-storage/async-storage';

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export class DeepSeekService {
  static async sendMessage(messages, userMessage) {
    try {
      const apiKey = await AsyncStorage.getItem("deepSeekApiKey");
      
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `You are HealthGPT, an AI assistant specialized in health professional education. 
              You provide accurate, evidence-based information about:
              - Medical sciences and healthcare
              - Clinical procedures and best practices
              - Patient care and communication
              - Healthcare regulations and ethics
              - Professional development in healthcare
              - Exam preparation strategies
              
              Always maintain a professional, educational tone and clarify when information is beyond current knowledge.
              Focus on being helpful and supportive to healthcare students and professionals.`
            },
            ...messages.map(msg => ({
              role: msg.isUser ? "user" : "assistant",
              content: msg.text
            })),
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw error;
    }
  }

  static async validateApiKey(apiKey) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  static async getApiKey() {
    return await AsyncStorage.getItem("deepSeekApiKey");
  }

  static async setApiKey(apiKey) {
    await AsyncStorage.setItem("deepSeekApiKey", apiKey);
  }

  static async clearApiKey() {
    await AsyncStorage.removeItem("deepSeekApiKey");
  }
}