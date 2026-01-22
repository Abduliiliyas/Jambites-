// platformDb.js
import { Platform } from "react-native";

class PlatformDB {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (Platform.OS === 'web') {
      return this.initializeWebDB();
    } else {
      return this.initializeMobileDB();
    }
  }

  async initializeWebDB() {
    try {
      console.log('Initializing IndexedDB for web...');
      
      if (!window.indexedDB) {
        throw new Error("IndexedDB is not supported in this browser");
      }

      return new Promise((resolve, reject) => {
        const request = indexedDB.open("healthprof_db", 2);

        request.onerror = (event) => {
          console.error("IndexedDB error:", event.target.error);
          reject(event.target.error);
        };

        request.onsuccess = (event) => {
          this.db = event.target.result;
          console.log("IndexedDB opened successfully");
          this.isInitialized = true;
          resolve(this.db);
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          console.log('Upgrading IndexedDB...');
          
          // Create object stores
          if (!db.objectStoreNames.contains('questions')) {
            const questionStore = db.createObjectStore('questions', { keyPath: 'id', autoIncrement: true });
            questionStore.createIndex('department', 'department', { unique: false });
            questionStore.createIndex('questionId', 'questionId', { unique: true });
          }
          
          if (!db.objectStoreNames.contains('levels')) {
            const levelStore = db.createObjectStore('levels', { keyPath: 'id', autoIncrement: true });
            levelStore.createIndex('level', 'level', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('results')) {
            const resultStore = db.createObjectStore('results', { keyPath: 'id', autoIncrement: true });
            resultStore.createIndex('department', 'department', { unique: false });
            resultStore.createIndex('questionId', 'questionId', { unique: false });
          }
          
          console.log('IndexedDB object stores created');
        };
      });
    } catch (error) {
      console.error('Error initializing Web DB:', error);
      throw error;
    }
  }

  async initializeMobileDB() {
    try {
      console.log('Initializing SQLite for mobile...');
      
      // Dynamic import to avoid web bundling issues
      const SQLite = require('expo-sqlite');
      
      if (!this.db) {
        this.db = await SQLite.openDatabaseAsync("healthprof.db");
      }
      
      await this.db.execAsync(`
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
      
      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('Error initializing Mobile DB:', error);
      throw error;
    }
  }

  async getDatabase() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.db;
  }

  // Helper for IndexedDB transactions
  async executeTransaction(storeName, mode, operation) {
    if (Platform.OS !== 'web') return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      
      const request = operation(store);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromStore(storeName) {
    if (Platform.OS !== 'web') return [];
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export a singleton instance
const platformDb = new PlatformDB();
export default platformDb;