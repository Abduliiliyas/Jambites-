// app/debug-notifications.jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import notificationScheduler from '../src/services/scheduledNotificationService';

export default function DebugNotificationsScreen() {
  const [loading, setLoading] = useState(false);
  
  const testImmediateNotification = async () => {
    try {
      setLoading(true);
      const id = await notificationScheduler.testNotification(5);
      
      if (id) {
        Alert.alert(
          '✅ Test Scheduled',
          'Notification will appear in 5 seconds.\n' +
          'Put app in background to test properly.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Failed', 'Could not schedule notification');
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const setupDailyReminders = async () => {
    try {
      setLoading(true);
      const result = await notificationScheduler.scheduleJambitesDailyReminders();
      
      if (result.success) {
        Alert.alert(
          '✅ Daily Reminders Scheduled',
          `Scheduled ${result.totalScheduled} reminders:\n` +
          '• 7:00 AM - Morning JAMB Prep\n' +
          '• 2:00 PM - Afternoon Study\n' +
          '• 8:00 PM - Evening Review',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('❌ Failed', result.error || 'Failed to schedule reminders');
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const checkScheduled = async () => {
    try {
      setLoading(true);
      const notifications = await notificationScheduler.getAllScheduledNotifications();
      
      if (notifications.length === 0) {
        Alert.alert('📭 No Notifications', 'No notifications are currently scheduled.');
      } else {
        let message = `Found ${notifications.length} scheduled notifications:\n\n`;
        
        notifications.forEach((notif, index) => {
          const trigger = notif.trigger;
          let time = '';
          
          if (trigger.hour !== undefined) {
            time = `${trigger.hour}:${trigger.minute.toString().padStart(2, '0')}`;
          } else if (trigger.seconds) {
            time = `in ${trigger.seconds} seconds`;
          }
          
          message += `${index + 1}. ${notif.content.title} (${time})\n`;
        });
        
        Alert.alert('📅 Scheduled Notifications', message);
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const clearAll = async () => {
    try {
      await notificationScheduler.cancelAllScheduledNotifications();
      Alert.alert('✅ Cleared', 'All notifications cancelled');
    } catch (error) {
      Alert.alert('❌ Error', error.message);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Notification Debug</Text>
      
      <Text style={styles.info}>
        Test notification functionality. Notifications should work even when app is minimized.
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.testButton]} 
        onPress={testImmediateNotification}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Scheduling...' : '🧪 Test Notification (5s)'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.scheduleButton]} 
        onPress={setupDailyReminders}
        disabled={loading}
      >
        <Text style={styles.buttonText}>📅 Setup Daily Reminders</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.checkButton]} 
        onPress={checkScheduled}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🔍 Check Scheduled</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.clearButton]} 
        onPress={clearAll}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🗑️ Clear All</Text>
      </TouchableOpacity>
      
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Testing Tips:</Text>
        <Text style={styles.noteText}>
          1. Grant notification permission when prompted{'\n'}
          2. Test with app in background (press home button){'\n'}
          3. Daily reminders fire at 7 AM, 2 PM, 8 PM{'\n'}
          4. Tapping notification should open CBT screen
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  scheduleButton: {
    backgroundColor: '#007AFF',
  },
  checkButton: {
    backgroundColor: '#5856D6',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    backgroundColor: '#FFF9E6',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});