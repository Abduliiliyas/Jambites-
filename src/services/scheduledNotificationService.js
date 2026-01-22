// src/services/notificationScheduler.js
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationScheduler {
  constructor() {
    this.isInitialized = false;
    this.STORAGE_KEY = '@Jambites_notification_settings';
  }
// Add this method to your NotificationScheduler class
async scheduleJambitesDailyReminders() {
  try {
    console.log('📅 Setting up Jambites daily reminders...');
    
    // Cancel existing notifications first
    await this.cancelAllScheduledNotifications();
    
    // Morning reminder (7:00 AM)
    const morningId = await this.scheduleDailyNotification(
      '⏰ Morning JAMB Prep Time!',
      'Start your day with JAMB CBT practice questions',
      7, 0, // 7:00 AM
      { screen: 'CBT', type: 'morning_study', time: '7:00 AM' }
    );
    
    // Afternoon reminder (2:00 PM)
    const afternoonId = await this.scheduleDailyNotification(
      '📚 Afternoon Study Session',
      'Time for your daily JAMB practice. Stay consistent!',
      14, 0, // 2:00 PM
      { screen: 'CBT', type: 'afternoon_study', time: '2:00 PM' }
    );
    
    // Evening reminder (8:00 PM)
    const eveningId = await this.scheduleDailyNotification(
      '🌙 Evening Revision Time',
      'Review today\'s learning with JAMB past questions',
      20, 0, // 8:00 PM
      { screen: 'CBT', type: 'evening_review', time: '8:00 PM' }
    );
    
    console.log('✅ Daily reminders scheduled:', { morningId, afternoonId, eveningId });
    
    // Get all scheduled notifications to verify
    const scheduled = await this.getAllScheduledNotifications();
    console.log(`📋 Total scheduled: ${scheduled.length} notifications`);
    
    return {
      success: true,
      morningId,
      afternoonId,
      eveningId,
      totalScheduled: scheduled.length
    };
    
  } catch (error) {
    console.log('❌ Error scheduling daily reminders:', error);
    return { success: false, error: error.message };
  }
}
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      console.log('📱 Initializing notification scheduler...');
      
      // Setup Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Setup notification listeners
      this.setupNotificationListeners();
      
      this.isInitialized = true;
      console.log('✅ Notification scheduler initialized');
      return true;
    } catch (error) {
      console.log('❌ Notification scheduler init failed:', error);
      return false;
    }
  }

  setupNotificationListeners() {
    // Listen for notification taps
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      this.handleNotificationTap(response);
    });

    // Listen for notifications received while app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });
    
  }

  // Schedule notification after X seconds - CORRECTED VERSION
  // FIXED: scheduleNotificationInSeconds method
async scheduleNotificationInSeconds(title, body, seconds, data = {}) {
  try {
    console.log(`⏰ Scheduling notification in ${seconds} seconds: "${title}"`);
    
    // Ensure seconds is a number and not zero
    if (seconds <= 0) {
      console.log('⚠️ Seconds must be greater than 0');
      return null;
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { 
          ...data, 
          scheduled: true, 
          timestamp: Date.now(),
          scheduledForSeconds: seconds
        },
        sound: true,
      },
      trigger: {
        seconds: seconds,
        repeats: false, // Don't repeat for test notifications
      },
    });

    console.log(`✅ Notification scheduled with ID: ${notificationId}, will fire in ${seconds} seconds`);
    return notificationId;
  } catch (error) {
    console.log('❌ Error scheduling notification:', error);
    return null;
  }
}
// Add this method to notificationScheduler.js
setNotificationTapHandler(callback) {
  // Listen for notification taps
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('👆 Notification tapped:', data);
    
    if (callback && typeof callback === 'function') {
      callback(data);
    } else {
      // Default behavior - show alert
      Alert.alert(
        data.title || 'Notification',
        data.body || 'You have a new notification',
        [{ text: 'OK' }]
      );
    }
  });

  return subscription;
}

// Update handleNotificationTap method
handleNotificationTap(response) {
  const data = response.notification.request.content.data;
  console.log('📱 Notification data:', data);
  
  // Check if it's a CBT notification
  if (data.screen === 'CBT') {
    console.log('📍 Opening CBT screen...');
    
    // Navigate to CBT screen
    // IMPORTANT: You need to implement navigation here
    // For Expo Router, you might use:
    // import { router } from 'expo-router';
    // router.push('/CBT');
    
    // Show alert for now (replace with actual navigation)
    Alert.alert(
      'Opening CBT Practice',
      `Time for your ${data.type === 'morning_study' ? 'Morning' : 
                       data.type === 'afternoon_study' ? 'Afternoon' : 'Evening'} study session!`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open CBT', 
          onPress: () => {
            // Add navigation logic here
            console.log('Would navigate to CBT screen');
            // router.push('/CBT');
          }
        }
      ]
    );
  }
  // Show alert for test notifications
  else if (data.test) {
    Alert.alert(
      'Test Notification ✅',
      'This was a scheduled test notification!',
      [{ text: 'OK' }]
    );
  }
}
  // Alternative: Schedule notification at specific Date
  async scheduleNotification(title, body, date, data = {}) {
    try {
      console.log(`📅 Scheduling notification: "${title}" for ${date.toLocaleString()}`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, scheduled: true, scheduledTime: date.toISOString() },
          sound: true,
        },
        trigger: date,
      });

      console.log(`✅ Notification scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule daily notification at specific time
  async scheduleDailyNotification(title, body, hour, minute, data = {}) {
    try {
      console.log(`📅 Scheduling daily notification at ${hour}:${minute}: "${title}"`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, scheduled: true, daily: true },
          sound: true,
        },
        trigger: {
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Daily notification scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling daily notification:', error);
      return null;
    }
  }

  // Schedule weekly notification
  async scheduleWeeklyNotification(title, body, weekday, hour, minute, data = {}) {
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`📅 Scheduling weekly notification on ${days[weekday - 1]} at ${hour}:${minute}: "${title}"`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { ...data, scheduled: true, weekly: true },
          sound: true,
        },
        trigger: {
          weekday,
          hour,
          minute,
          repeats: true,
        },
      });

      console.log(`✅ Weekly notification scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.log('❌ Error scheduling weekly notification:', error);
      return null;
    }
  }

  // Get all scheduled notifications
  async getAllScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      
      // Debug: Log all scheduled notifications
      notifications.forEach((notification, index) => {
        console.log(`  ${index + 1}. "${notification.content.title}" - Trigger:`, notification.trigger);
      });
      
      return notifications;
    } catch (error) {
      console.log('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Cancel a specific notification
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`❌ Cancelled notification: ${notificationId}`);
      return true;
    } catch (error) {
      console.log('❌ Error cancelling notification:', error);
      return false;
    }
  }

  // Cancel all scheduled notifications
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ All scheduled notifications cancelled');
      return true;
    } catch (error) {
      console.log('❌ Error cancelling all notifications:', error);
      return false;
    }
  }

  // Setup default study reminders for Jambites
  async setupDefaultStudyReminders() {
    try {
      console.log('📚 Setting up Jambites study reminders...');
      
      // Cancel existing reminders first
      await this.cancelAllScheduledNotifications();
      
      // Schedule daily study reminders for Jambites
      await this.scheduleDailyNotification(
        '📚 Morning JAMB Prep',
        'Start your day with Jambites practice questions!',
        9, 0,
        { screen: 'quizHome', type: 'morning_study' }
      );

      await this.scheduleDailyNotification(
        '📖 Afternoon CBT Practice',
        'Time for your Computer-Based Test practice',
        15, 0,
        { screen: 'CBT', type: 'afternoon_practice' }
      );

      await this.scheduleDailyNotification(
        '🎯 Evening Review Session',
        'Review today\'s learning and past questions',
        21, 0,
        { screen: 'reviewScreen', type: 'evening_review' }
      );

      console.log('✅ Jambites study reminders scheduled');
      return true;
    } catch (error) {
      console.log('❌ Error setting up reminders:', error);
      return false;
    }
  }

  // Schedule weekly progress report
  async scheduleWeeklyProgressReport() {
    try {
      // Schedule weekly progress report (Sunday at 10 AM)
      await this.scheduleWeeklyNotification(
        '📊 Weekly JAMB Progress',
        'Check your weekly JAMB preparation progress',
        1, 10, 0,
        { screen: 'debug', type: 'weekly_report' }
      );
      
      console.log('✅ Weekly progress report scheduled');
      return true;
    } catch (error) {
      console.log('❌ Error scheduling weekly report:', error);
      return false;
    }
  }

  // Check if notifications are scheduled correctly
  async debugScheduledNotifications() {
    try {
      const notifications = await this.getAllScheduledNotifications();
      
      if (notifications.length === 0) {
        console.log('📭 No notifications scheduled');
        return { count: 0, details: [] };
      }
      
      const details = notifications.map((notif, index) => ({
        index: index + 1,
        title: notif.content.title,
        trigger: notif.trigger,
        data: notif.content.data,
      }));
      
      console.log('🔍 Scheduled notifications debug:', details);
      return { count: notifications.length, details };
    } catch (error) {
      console.log('❌ Debug error:', error);
      return { error: error.message };
    }
  }

  handleNotificationTap(response) {
    const data = response.notification.request.content.data;
    console.log('📱 Notification data:', data);
    
    // Show alert for test notifications
    if (data.test) {
      Alert.alert(
        'Test Notification ✅',
        'This was a scheduled test notification!',
        [{ text: 'OK' }]
      );
    }
  }
// Test notification (shows in specified seconds)
async testNotification(seconds = 10) {
  return await this.scheduleNotificationInSeconds(
    '🔔 Jambites Test Notification',
    'This is a test notification from Jambites!',
    seconds,
    { test: false, screen: 'CBT' }
  );
}
  // Cleanup method
  cleanup() {
    console.log('🧹 Notification scheduler cleanup');
    // Note: expo-notifications listeners auto-remove on app reload
  }
}

// Create singleton instance
const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;