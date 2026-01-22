// database.js
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let db = null;
let isInitialized = false;

// Check if SQLite should be used
const shouldUseSQLite = Platform.OS !== 'web' || process.env.EXPO_NO_SQLITE !== '1';

// Initialize database
async function initializeDatabase() {
  try {
    console.log('Initializing database for platform:', Platform.OS);
    
    if (Platform.OS === 'web') {
      // Always use IndexedDB for web
      return await initializeIndexedDB();
    } else {
      // Use SQLite for mobile
      return await initializeSQLite();
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Initialize IndexedDB for web
async function initializeIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("healthprof_db", 2);

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      isInitialized = true;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains('questions')) {
        const store = database.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('department', 'department', { unique: false });
        store.createIndex('questionId', 'questionId', { unique: true });
      }
      
      if (!database.objectStoreNames.contains('levels')) {
        database.createObjectStore('levels', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!database.objectStoreNames.contains('results')) {
        database.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Initialize SQLite for mobile (only if available)
async function initializeSQLite() {
  try {
    // Dynamic import to avoid web bundling issues
    const SQLiteModule = await import('expo-sqlite');
    const SQLite = SQLiteModule.default || SQLiteModule;
    
    db = await SQLite.openDatabaseAsync("healthprof.db");
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department TEXT,
        questionId TEXT UNIQUE,
        question TEXT,
        option1 TEXT,
        option2 TEXT,
        option3 TEXT,
        option4 TEXT,
        correct_option TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level INTEGER,
        qids TEXT
      );

      CREATE TABLE IF NOT EXISTS results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department TEXT,
        questionId TEXT,
        totalQuestions INTEGER,
        answered INTEGER,
        correct INTEGER,
        percentage REAL,
        performance TEXT
      );
    `);
    
    isInitialized = true;
    return db;
  } catch (error) {
    console.error('Error initializing SQLite:', error);
    
    // If SQLite fails, fall back to AsyncStorage for mobile
    console.log('Falling back to AsyncStorage for mobile');
    return null;
  }
}

// Get database instance
export async function getDatabase() {
  if (!isInitialized) {
    await initializeDatabase();
  }
  return db;
}

// Helper functions for IndexedDB
async function executeIDBTransaction(storeName, mode, operation) {
  if (Platform.OS !== 'web' || !db) return null;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore(storeName) {
  if (Platform.OS !== 'web' || !db) return [];
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Simple database functions
export const saveQuestions = async (questions, progressCallback = null) => {
  if (Platform.OS === 'web') {
    return saveQuestionsWeb(questions, progressCallback);
  } else {
    return saveQuestionsMobile(questions, progressCallback);
  }
};

async function saveQuestionsWeb(questions, progressCallback) {
  try {
    const database = await getDatabase();
    await executeIDBTransaction('questions', 'readwrite', (store) => store.clear());
    
    const totalQuestions = Array.isArray(questions.questions) ? questions.questions : questions;
    const departments = new Set();
    
    const transaction = db.transaction(['questions'], 'readwrite');
    const store = transaction.objectStore('questions');
    
    for (let i = 0; i < totalQuestions.length; i++) {
      const question = totalQuestions[i];
      if (!question || !question.questionId) continue;
      
      store.put({
        department: question.department || '',
        questionId: question.questionId,
        question: question.question || '',
        option1: question.option1 || '',
        option2: question.option2 || '',
        option3: question.option3 || '',
        option4: question.option4 || '',
        correct_option: question.correct_option || '',
        description: question.description || ''
      });
      
      if (question.department) departments.add(question.department);
      
      if (progressCallback && i % 100 === 0) {
        progressCallback({ loaded: i, total: totalQuestions.length });
      }
    }
    
    await new Promise((resolve) => {
      transaction.oncomplete = resolve;
    });
    
    // Cache departments
    try {
      await AsyncStorage.setItem('uniqueDepartments', JSON.stringify(Array.from(departments)));
      await AsyncStorage.setItem('departmentsLastUpdated', Date.now().toString());
    } catch (e) {
      console.warn('Failed to cache departments:', e);
    }
    
    return {
      success: true,
      saved: totalQuestions.length,
      departments: Array.from(departments)
    };
  } catch (error) {
    console.error('Error saving questions:', error);
    return { success: false, error: error.message };
  }
}

async function saveQuestionsMobile(questions, progressCallback) {
  try {
    const database = await getDatabase();
    
    // If SQLite is not available, use AsyncStorage as fallback
    if (!database) {
      return saveQuestionsToStorage(questions, progressCallback);
    }
    
    await database.runAsync("DELETE FROM questions;");
    
    const totalQuestions = Array.isArray(questions.questions) ? questions.questions : questions;
    const departments = new Set();
    
    for (let i = 0; i < totalQuestions.length; i++) {
      const question = totalQuestions[i];
      if (!question || !question.questionId) continue;
      
      await database.runAsync(
        "INSERT OR REPLACE INTO questions (department, questionId, question, option1, option2, option3, option4, correct_option, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          question.department || '',
          question.questionId,
          question.question || '',
          question.option1 || '',
          question.option2 || '',
          question.option3 || '',
          question.option4 || '',
          question.correct_option || '',
          question.description || ''
        ]
      );
      
      if (question.department) departments.add(question.department);
      
      if (progressCallback && i % 100 === 0) {
        progressCallback({ loaded: i, total: totalQuestions.length });
      }
    }
    
    // Cache departments
    try {
      await AsyncStorage.setItem('uniqueDepartments', JSON.stringify(Array.from(departments)));
      await AsyncStorage.setItem('departmentsLastUpdated', Date.now().toString());
    } catch (e) {
      console.warn('Failed to cache departments:', e);
    }
    
    return {
      success: true,
      saved: totalQuestions.length,
      departments: Array.from(departments)
    };
  } catch (error) {
    console.error('Error saving questions to SQLite:', error);
    
    // Fallback to AsyncStorage
    return saveQuestionsToStorage(questions, progressCallback);
  }
}

// Fallback storage for mobile
async function saveQuestionsToStorage(questions, progressCallback) {
  try {
    const totalQuestions = Array.isArray(questions.questions) ? questions.questions : questions;
    const departments = new Set();
    
    const questionsToStore = totalQuestions.map((question, index) => {
      if (question.department) departments.add(question.department);
      
      if (progressCallback && index % 100 === 0) {
        progressCallback({ loaded: index, total: totalQuestions.length });
      }
      
      return {
        id: index + 1,
        ...question
      };
    });
    
    await AsyncStorage.setItem('questions', JSON.stringify(questionsToStore));
    await AsyncStorage.setItem('uniqueDepartments', JSON.stringify(Array.from(departments)));
    await AsyncStorage.setItem('departmentsLastUpdated', Date.now().toString());
    
    return {
      success: true,
      saved: totalQuestions.length,
      departments: Array.from(departments)
    };
  } catch (error) {
    console.error('Error saving questions to storage:', error);
    return { success: false, error: error.message };
  }
}

export const getQuestions = async () => {
  if (Platform.OS === 'web') {
    try {
      await getDatabase();
      return await getAllFromStore('questions');
    } catch (error) {
      console.error('Error getting questions from IndexedDB:', error);
      return [];
    }
  } else {
    try {
      const database = await getDatabase();
      
      // If SQLite is available, use it
      if (database) {
        return await database.getAllAsync("SELECT * FROM questions");
      } else {
        // Fallback to AsyncStorage
        const questions = await AsyncStorage.getItem('questions');
        return questions ? JSON.parse(questions) : [];
      }
    } catch (error) {
      console.error('Error getting questions:', error);
      return [];
    }
  }
};

export const clearQuestions = async () => {
  if (Platform.OS === 'web') {
    try {
      const database = await getDatabase();
      await executeIDBTransaction('questions', 'readwrite', (store) => store.clear());
      return true;
    } catch (error) {
      console.error('Error clearing questions:', error);
      return false;
    }
  } else {
    try {
      const database = await getDatabase();
      
      if (database) {
        await database.runAsync("DELETE FROM questions;");
      }
      
      // Also clear from AsyncStorage
      await AsyncStorage.removeItem('questions');
      return true;
    } catch (error) {
      console.error('Error clearing questions:', error);
      return false;
    }
  }
};

export const getCachedDepartments = async () => {
  try {
    const cached = await AsyncStorage.getItem('uniqueDepartments');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error getting cached departments:', error);
    return [];
  }
};

export async function checkDatabaseStatus() {
  try {
    const database = await getDatabase();
    
    if (Platform.OS === 'web' && database) {
      const stores = Array.from(database.objectStoreNames);
      console.log('IndexedDB stores:', stores);
      return stores;
    } else if (database) {
      const tables = await database.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      console.log('SQLite tables:', tables.map(t => t.name));
      return tables;
    } else {
      console.log('Using AsyncStorage fallback');
      return ['AsyncStorage'];
    }
  } catch (error) {
    console.error('Error checking database status:', error);
    return [];
  }
}

// Export other functions (simplified for now)
export async function generateLevels(department) {
  console.log('generateLevels called for:', department);
  return { success: true };
}

export async function getLevels() {
  return [];
}

export async function saveResult() {
  return { success: true };
}

export async function getResults() {
  return [];
}

export async function resetDatabase() {
  return { success: true };
}

export { isInitialized };