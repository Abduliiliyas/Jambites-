// src/screens/DebugScreen.js
import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import simpleNotificationService from '../src/services/simpleNotificationService';

const DebugScreen = ({ navigation }) => {
  const [debugInfo, setDebugInfo] = useState('Ready to test...');
  const [expoToken, setExpoToken] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState('ready');
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    setDebugInfo(message);
  };

  const testManualRegistration = async () => {
    try {
      setRegistrationStatus('testing');
      addLog('🔄 Starting manual registration test...');
      
      const result = await simpleNotificationService.testRegistration();
      
      if (result.status === 'success') {
        addLog('🎉 Registration successful!');
        setRegistrationStatus('success');
        Alert.alert('Success', 'Device registered successfully!');
      } else {
        addLog('❌ Registration failed: ' + result.message);
        setRegistrationStatus('failed');
        Alert.alert('Registration Failed', result.message || 'Unknown error');
      }
    } catch (error) {
      addLog('💥 Error: ' + error.message);
      setRegistrationStatus('failed');
      Alert.alert('Error', error.message);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setDebugInfo('Logs cleared');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        🐛 Debug Console
      </Text>

      {/* Status Card */}
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Current Status:</Text>
        <Text style={{ 
          fontSize: 14, 
          color: registrationStatus === 'success' ? 'green' : 
                 registrationStatus === 'testing' ? 'orange' : 'red',
          fontWeight: 'bold'
        }}>
          {registrationStatus === 'success' ? '✅ REGISTERED' : 
           registrationStatus === 'testing' ? '🔄 TESTING...' : 
           registrationStatus === 'failed' ? '❌ FAILED' : '⚪ READY'}
        </Text>
        <Text style={{ fontSize: 12, color: '#666', marginTop: 10 }}>{debugInfo}</Text>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={{ 
          backgroundColor: '#667eea', 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 10
        }}
        onPress={testManualRegistration}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
          🔄 Test Device Registration
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ 
          backgroundColor: '#48bb78', 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 10
        }}
        onPress={() => Linking.openURL('https://healthprof.com.ng/admin')}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
          📊 Check Django Admin
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ 
          backgroundColor: '#ed8936', 
          padding: 15, 
          borderRadius: 10, 
          marginBottom: 15
        }}
        onPress={clearLogs}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
          🗑️ Clear Logs
        </Text>
      </TouchableOpacity>

      {/* Logs */}
      <View style={{ backgroundColor: 'white', padding: 15, borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 10 }}>Logs:</Text>
        {logs.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>No logs yet...</Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={{ fontSize: 10, color: '#666', marginBottom: 5, fontFamily: 'monospace' }}>
              {log}
            </Text>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={{ backgroundColor: '#e6fffa', padding: 15, borderRadius: 10, marginTop: 15 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 10 }}>Instructions:</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>1. Click "Test Device Registration"</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>2. Allow notifications when prompted</Text>
        <Text style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>3. Check logs for step-by-step progress</Text>
        <Text style={{ fontSize: 12, color: '#666' }}>4. Check Django Admin for registered devices</Text>
      </View>
    </ScrollView>
  );
};

export default DebugScreen;