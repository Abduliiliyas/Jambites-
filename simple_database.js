import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const RESULTS_KEY = 'healthprof_results';
const PENDING_SYNC_KEY = 'healthprof_pending_sync';
const SYNC_STATUS_KEY = 'healthprof_sync_status';

const API_BASE_URL = "https://healthprof.com.ng";

// Sync manager
class SyncManager {
  constructor() {
    this.isOnline = false;
    this.isSyncing = false;
    this.init();
  }

  async init() {
    // Check initial network status
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected;
    
    // Listen for network changes
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected;
      console.log('🌐 Network status:', this.isOnline ? 'Online' : 'Offline');
      
      if (this.isOnline) {
        this.trySyncPendingResults();
      }
    });

    // Try initial sync if online
    if (this.isOnline) {
      this.trySyncPendingResults();
    }
  }

  async trySyncPendingResults() {
    if (this.isSyncing || !this.isOnline) return;
    
    this.isSyncing = true;
    console.log('🔄 Starting sync...');
    
    try {
      const pendingResults = await getPendingSyncResults();
      
      if (pendingResults.length === 0) {
        console.log('✅ No pending results to sync');
        this.isSyncing = false;
        return;
      }

      console.log(`📤 Syncing ${pendingResults.length} pending results...`);
      
      const successCount = await this.syncResultsToBackend(pendingResults);
      
      if (successCount > 0) {
        await clearSyncedResults(successCount);
        console.log(`✅ Successfully synced ${successCount} results`);
      }
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  async syncResultsToBackend(results) {
    let successCount = 0;
    
    for (const result of results) {
      try {
        await sendResultToBackend(result);
        successCount++;
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to sync result ${result.id}:`, error);
        // Continue with next result even if one fails
      }
    }
    
    return successCount;
  }
}

// Initialize sync manager
export const syncManager = new SyncManager();

// Core result functions
export async function saveResult(
  department,
  questionId,
  totalQuestions,
  answered,
  correct,
  percentage,
  performance,
  timeTakenSeconds = 0,
  questions
) {
  try {
    const result = {
      id: Date.now().toString(),
      department,
      questionId,
      totalQuestions,
      answered,
      correct,
      percentage: parseFloat(percentage),
      performance,
      timeTakenSeconds,
      timestamp: new Date().toISOString(),
      questions,
      synced: false, // Track sync status
      userId: await getUserId() // Get current user ID
    };

    // Get existing results
    const existingResultsJson = await AsyncStorage.getItem(RESULTS_KEY);
    const existingResults = existingResultsJson ? JSON.parse(existingResultsJson) : [];
    
    // Add new result (limit to last 100 results to prevent storage issues)
    const updatedResults = [result, ...existingResults].slice(0, 100);
    
    // Save to main storage
    await AsyncStorage.setItem(RESULTS_KEY, JSON.stringify(updatedResults));
    
    // Add to pending sync
    await addToPendingSync(result);
    
    console.log('✅ Result saved locally:', result.id);
    
    // Try to sync immediately if online
    if (syncManager.isOnline) {
      syncManager.trySyncPendingResults();
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error saving result:', error);
    throw error;
  }
}

export async function getResults() {
  try {
    const resultsJson = await AsyncStorage.getItem(RESULTS_KEY);
    return resultsJson ? JSON.parse(resultsJson) : [];
  } catch (error) {
    console.error('❌ Error getting results:', error);
    return [];
  }
}

export async function clearResults() {
  try {
    await AsyncStorage.removeItem(RESULTS_KEY);
    await AsyncStorage.removeItem(PENDING_SYNC_KEY);
    console.log('✅ Results cleared');
  } catch (error) {
    console.error('❌ Error clearing results:', error);
  }
}

// Sync management functions
async function addToPendingSync(result) {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    const pendingResults = pendingJson ? JSON.parse(pendingJson) : [];
    
    // Avoid duplicates
    const existingIndex = pendingResults.findIndex(r => r.id === result.id);
    if (existingIndex === -1) {
      pendingResults.push(result);
      await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingResults));
    }
  } catch (error) {
    console.error('❌ Error adding to pending sync:', error);
  }
}

async function getPendingSyncResults() {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    return pendingJson ? JSON.parse(pendingJson) : [];
  } catch (error) {
    console.error('❌ Error getting pending sync results:', error);
    return [];
  }
}

async function clearSyncedResults(count) {
  try {
    const pendingJson = await AsyncStorage.getItem(PENDING_SYNC_KEY);
    if (!pendingJson) return;
    
    const pendingResults = JSON.parse(pendingJson);
    // Keep only unsynced results (remove first 'count' items)
    const updatedPending = pendingResults.slice(count);
    await AsyncStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(updatedPending));
  } catch (error) {
    console.error('❌ Error clearing synced results:', error);
  }
}

// Get user ID from storage
async function getUserId() {
  try {
    const userInfo = await AsyncStorage.getItem("userInfo");
    if (userInfo) {
      const user = JSON.parse(userInfo);
      return user.userId;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    return null;
  }
}

// Manual sync trigger (can be called from UI if needed)
export async function manualSync() {
  console.log('🔄 Manual sync triggered');
  await syncManager.trySyncPendingResults();
}

// Check sync status
export async function getSyncStatus() {
  try {
    const pendingResults = await getPendingSyncResults();
    const allResults = await getResults();
    
    return {
      totalResults: allResults.length,
      pendingSync: pendingResults.length,
      lastSync: await AsyncStorage.getItem(SYNC_STATUS_KEY),
      isOnline: syncManager.isOnline,
      isSyncing: syncManager.isSyncing
    };
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    return {
      totalResults: 0,
      pendingSync: 0,
      lastSync: null,
      isOnline: false,
      isSyncing: false
    };
  }
}

// Backend communication
async function sendResultToBackend(result) {
  try {
    const userId = result.userId;
    
    if (!userId) {
      throw new Error('User ID not available');
    }

    const response = await fetch(`${API_BASE_URL}/api/jsave-result/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        department: result.department,
        question_id: result.questionId,
        total_questions: result.totalQuestions,
        answered: result.answered,
        correct: result.correct,
        percentage: result.percentage,
        performance: result.performance,
        time_taken_seconds: result.timeTakenSeconds,
        timestamp: result.timestamp,
        questions_data: result.questions
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown backend error');
    }

    console.log('✅ Result synced to backend:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending result to backend:', error);
    throw error;
  }
}

// Initialize sync on app start
export function initializeSync() {
  console.log('🔄 Sync system initialized');
  // The sync manager auto-initializes
}