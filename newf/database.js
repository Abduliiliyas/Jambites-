import { Platform } from "react-native";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
let db = null;
let isInitialized = false;

// Initialize database and create all tables
async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department TEXT,
        questionId TEXT,
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
    
    console.log('All database tables initialized successfully');
    isInitialized = true;
    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    isInitialized = false;
    throw error;
  }
}

// Export getDatabase function
export async function getDatabase() {
  if (!db) {
    try {
      console.log('Opening database connection...');
      db = await SQLite.openDatabaseAsync("healthprof.db");
      await initializeDatabase();
    } catch (error) {
      console.error('Failed to open database:', error);
      throw error;
    }
  } else if (!isInitialized) {
    // Database is open but not initialized
    await initializeDatabase();
  }
  return db;
}

function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Database status check utility
export async function checkDatabaseStatus() {
  try {
    const db = await getDatabase();
    
    const tables = await db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    console.log('Existing tables:', tables.map(t => t.name));
    
    // Check each table's row count
    for (let table of tables) {
      try {
        const count = await db.getFirstAsync(
          `SELECT COUNT(*) as count FROM ${table.name}`
        );
        console.log(`Table ${table.name}: ${count.count} rows`);
      } catch (e) {
        console.log(`Table ${table.name}: error counting rows - ${e.message}`);
      }
    }
    
    return tables;
  } catch (error) {
    console.error('Error checking database status:', error);
    return [];
  }
}

// Reset database completely
export async function resetDatabase() {
  try {
    const db = await getDatabase();
    
    await db.execAsync(`
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS levels;
      DROP TABLE IF EXISTS results;
    `);
    
    console.log('Database reset completed');
    isInitialized = false;
    
    // Reinitialize tables
    await initializeDatabase();
    
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
}

// Ultra-fast bulk insertion
export const saveQuestions = async (questions, progressCallback = null) => {
  try {
    console.log('Starting bulk save of questions...');
    const db = await getDatabase();
    
    // Clear existing questions first
    await db.runAsync("DELETE FROM questions;");
    console.log('Cleared existing questions');
    
    let successfulInserts = 0;
    let skippedQuestions = 0;
    let totalQuestions = questions.questions || questions;
    const departments = new Set(); // Track all departments

    // If totalQuestions is not an array, handle it appropriately
    if (!Array.isArray(totalQuestions)) {
      totalQuestions = totalQuestions.questions || [];
    }
    
    // Process in batches of 500 to avoid SQLite limits
    const BATCH_SIZE = 1500;
    const totalBatches = Math.ceil(totalQuestions.length / BATCH_SIZE);
  
    console.log(`Processing ${totalQuestions.length} questions in ${totalBatches} batches...`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * BATCH_SIZE;
      const end = Math.min(start + BATCH_SIZE, totalQuestions.length);
      const batch = totalQuestions.slice(start, end);
      
      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (questions ${start + 1}-${end})`);

      // Build batch INSERT statement
      let insertStatement = "INSERT INTO questions (department, questionId, question, option1, option2, option3, option4, correct_option, description) VALUES ";
      const values = [];
      let batchValuesCount = 0;

      for (let i = 0; i < batch.length; i++) {
        const question = batch[i];
        
        // Validate required fields
        if (!question || !question.questionId || !question.question || !question.department) {
          console.warn(`Skipping question ${i + start}: missing required fields`, question);
          skippedQuestions++;
          continue;
        }

        if (batchValuesCount > 0) {
          insertStatement += ", ";
        }

        insertStatement += `(?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        // Store department for tracking
        const department = question.department.toString().trim();
        departments.add(department);
        
        values.push(
          department,
          question.questionId.toString().trim(),
          question.question.toString().trim(),
          question.option1 ? question.option1.toString().trim() : '',
          question.option2 ? question.option2.toString().trim() : '',
          question.option3 ? question.option3.toString().trim() : '',
          question.option4 ? question.option4.toString().trim() : '',
          question.correct_option ? question.correct_option.toString().trim() : '',
          question.description ? question.description.toString().trim() : ''
        );

        batchValuesCount++;
      }

      if (batchValuesCount > 0) {
        try {
          await db.runAsync(insertStatement, values);
          successfulInserts += batchValuesCount;
          
          // Update progress if callback provided
          if (progressCallback && typeof progressCallback === 'function') {
            progressCallback({
              loaded: start + batchValuesCount,
              total: totalQuestions.length
            });
          }
          
          console.log(`Batch ${batchIndex + 1} completed: ${batchValuesCount} questions saved`);
        } catch (batchError) {
          console.error(`Error in batch ${batchIndex + 1}:`, batchError.message);
          // Try individual inserts for this batch as fallback
          await saveIndividualQuestions(db, batch);
          successfulInserts += batchValuesCount;
          
          // Update progress if callback provided
          if (progressCallback && typeof progressCallback === 'function') {
            progressCallback({
              loaded: start + batchValuesCount,
              total: totalQuestions.length
            });
          }
        }
      }
    }

    console.log(`Save completed: ${successfulInserts} saved, ${skippedQuestions} skipped out of ${totalQuestions.length} total`);
    
    // Save unique departments to AsyncStorage
    try {
      const uniqueDepartments = Array.from(departments);
      await AsyncStorage.setItem('uniqueDepartments', JSON.stringify(uniqueDepartments));
      await AsyncStorage.setItem('departmentsLastUpdated', Date.now().toString());
      console.log(`Saved ${uniqueDepartments.length} unique departments to AsyncStorage`);
    } catch (storageError) {
      console.warn("Could not save departments to AsyncStorage:", storageError);
    }
    
    return {
      success: successfulInserts > 0,
      saved: successfulInserts,
      skipped: skippedQuestions,
      total: totalQuestions.length,
      departments: Array.from(departments)
    };
    
  } catch (error) {
    console.error("Critical error in saveQuestions:", error.message);
    
    return {
      success: false,
      error: error.message,
      saved: 0,
      skipped: questions ? (questions.questions ? questions.questions.length : questions.length) : 0
    };
  }
};

// Add this helper function to your database file if not already present
const saveIndividualQuestions = async (db, questions) => {
  for (const question of questions) {
    try {
      await db.runAsync(
        "INSERT INTO questions (department, questionId, question, option1, option2, option3, option4, correct_option, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          question.department.toString().trim(),
          question.questionId.toString().trim(),
          question.question.toString().trim(),
          question.option1 ? question.option1.toString().trim() : '',
          question.option2 ? question.option2.toString().trim() : '',
          question.option3 ? question.option3.toString().trim() : '',
          question.option4 ? question.option4.toString().trim() : '',
          question.correct_option ? question.correct_option.toString().trim() : '',
          question.description ? question.description.toString().trim() : ''
        ]
      );
    } catch (error) {
      console.error("Error saving individual question:", error.message);
    }
  }
};
// Fallback function for batch processing
const saveQuestionsInBatches = async (questions) => {
  const db = await getDatabase();
  let successfulInserts = 0;
  let skippedQuestions = 0;
  let department = '';
  const batchSize = 500;

  const totalBatches = Math.ceil(questions.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, questions.length);
    const batch = questions.slice(start, end);

    console.log(`Processing fallback batch ${batchIndex + 1}/${totalBatches}`);

    await db.execAsync("BEGIN TRANSACTION;");

    try {
      for (const question of batch) {
        if (!question || !question.questionId || !question.question) {
          skippedQuestions++;
          continue;
        }

        await db.runAsync(
          `INSERT INTO questions 
           (department, questionId, question, option1, option2, option3, option4, correct_option, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            question.department ? question.department.toString().trim() : 'Unknown',
            question.questionId.toString().trim(),
            question.question.toString().trim(),
            question.option1 ? question.option1.toString().trim() : '',
            question.option2 ? question.option2.toString().trim() : '',
            question.option3 ? question.option3.toString().trim() : '',
            question.option4 ? question.option4.toString().trim() : '',
            question.correct_option ? question.correct_option.toString().trim() : '',
            question.description ? question.description.toString().trim() : ''
          ]
        );

        // Store department for level generation
        if (!department && question.department) {
          department = question.department.toString().trim();
        }

        successfulInserts++;
      }

      await db.execAsync("COMMIT;");
      
    } catch (error) {
      await db.execAsync("ROLLBACK;");
      console.error('Error in fallback batch:', error.message);
      // Continue with next batch even if one fails
    }
  }

  // AUTO-GENERATE LEVELS AFTER SUCCESSFUL FALLBACK SAVE
  if (successfulInserts > 0 && department) {
    console.log(`Auto-generating levels for department: ${department}`);
    await generateLevels(department);
  }

  return {
    success: successfulInserts > 0,
    saved: successfulInserts,
    skipped: skippedQuestions
  };
};
// Helper function to get departments from cache or database
 export const getCachedDepartments = async () => {
  try {
    // Try to get from AsyncStorage first
    const cachedDepartments = await AsyncStorage.getItem('uniqueDepartments');
    const lastUpdated = await AsyncStorage.getItem('departmentsLastUpdated');
    
    if (cachedDepartments && lastUpdated) {
      const timestamp = parseInt(lastUpdated);
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1 week cache
      
      // Return cached departments if less than 1 week old
      if (Date.now() - timestamp < oneWeek) {
        return JSON.parse(cachedDepartments);
      }
    }
    
    // If no cache or cache expired, get from database
    const rows = await getQuestions();
    if (!rows || rows.length === 0) {
      return [];
    }
    
    const uniqueDepartments = [...new Set(rows.map(q => q.department))];
    
    // Update cache
    await AsyncStorage.setItem('uniqueDepartments', JSON.stringify(uniqueDepartments));
    await AsyncStorage.setItem('departmentsLastUpdated', Date.now().toString());
    
    return uniqueDepartments;
    
  } catch (error) {
    console.error("Error getting cached departments:", error);
    return [];
  }
};
export const clearQuestions = async () => {
  try {
    const db = await getDatabase();
    await db.runAsync("DELETE FROM questions;");
    console.log("Questions table cleared");
    return true;
  } catch (error) {
    console.error("Error clearing questions:", error);
    throw error;
  }
};

export const getQuestions = async () => {
  try {
    const db = await getDatabase();
    const rows = await db.getAllAsync("SELECT * FROM questions");
    return rows;
  } catch (error) {
    console.error("Error getting questions:", error);
    return [];
  }
};

// FIXED: Improved generateLevels function with better error handling
export async function generateLevels(department) {
  let transactionCompleted = false;
  
  try {
    const db = await getDatabase();
    
    console.time('Level Generation Time');
    console.log(`Starting level generation for department: ${department}`);
    
    // Start transaction
    await db.execAsync("BEGIN TRANSACTION;");
    
    // Clear existing levels
    await db.runAsync("DELETE FROM levels;");
    console.log('Cleared existing levels');
    
    // Get questions for the department
    const questions = await db.getAllAsync(
      `SELECT id FROM questions WHERE department = ?`,
      [department]
    );
    
    console.log(`Found ${questions.length} questions for department: ${department}`);
    
    if (questions.length === 0) {
      await db.execAsync("ROLLBACK;");
      transactionCompleted = true;
      console.log('No questions found for level generation');
      return { success: false, message: 'No questions found' };
    }

    const ids = questions.map((q) => q.id);
    const shuffled = shuffleArray(ids);
    
    console.log(`Shuffled ${shuffled.length} question IDs`);
    
    // Build individual INSERT statements instead of bulk insert
    // This is more compatible with preview builds
    let level = 1;
    let levelsCreated = 0;
    
    for (let i = 0; i < shuffled.length; i += 20) {
      const chunk = shuffled.slice(i, i + 20);
      
      // Use JSON.stringify safely
      let qidsString;
      try {
        qidsString = JSON.stringify(chunk);
      } catch (jsonError) {
        console.error('JSON stringify error:', jsonError);
        qidsString = '[]';
      }
      
      // Insert level individually
      await db.runAsync(
        "INSERT INTO levels (level, qids) VALUES (?, ?)",
        [level, qidsString]
      );
      
      level++;
      levelsCreated++;
    }
    
    // Commit transaction
    await db.execAsync("COMMIT;");
    transactionCompleted = true;
    
    console.timeEnd('Level Generation Time');
    console.log(`Generated ${levelsCreated} levels for ${department} with ${shuffled.length} questions`);
    
    return { 
      success: true, 
      levels: levelsCreated, 
      questions: shuffled.length 
    };
    
  } catch (error) {
    console.error("Error generating levels:", error);
    
    // Only rollback if transaction wasn't completed
    if (!transactionCompleted) {
      try {
        await db.execAsync("ROLLBACK;");
      } catch (rollbackError) {
        console.error("Error during rollback:", rollbackError);
      }
    }
    
    // Fallback: try without transaction
    try {
      console.log('Attempting level generation without transaction...');
      return await generateLevelsWithoutTransaction(department);
    } catch (fallbackError) {
      console.error('Fallback level generation also failed:', fallbackError);
      return { success: false, error: fallbackError.message };
    }
  }
}

// Fallback level generation without transactions
async function generateLevelsWithoutTransaction(department) {
  try {
    const db = await getDatabase();
    
    console.log('Starting fallback level generation without transaction...');
    
    // Clear existing levels
    await db.runAsync("DELETE FROM levels;");
    
    // Get questions
    const questions = await db.getAllAsync(
      `SELECT id FROM questions WHERE department = ?`,
      [department]
    );
    
    if (questions.length === 0) {
      console.log('No questions found for fallback level generation');
      return { success: false, message: 'No questions found' };
    }

    const ids = questions.map((q) => q.id);
    const shuffled = shuffleArray(ids);
    
    let level = 1;
    let levelsCreated = 0;
    
    // Insert levels one by one
    for (let i = 0; i < shuffled.length; i += 20) {
      const chunk = shuffled.slice(i, i + 20);
      
      let qidsString;
      try {
        qidsString = JSON.stringify(chunk);
      } catch (jsonError) {
        console.error('JSON stringify error in fallback:', jsonError);
        qidsString = '[]';
      }
      
      await db.runAsync(
        "INSERT INTO levels (level, qids) VALUES (?, ?)",
        [level, qidsString]
      );
      
      level++;
      levelsCreated++;
    }
    
    console.log(`Fallback: Generated ${levelsCreated} levels for ${department}`);
    
    return { 
      success: true, 
      levels: levelsCreated, 
      questions: shuffled.length 
    };
    
  } catch (error) {
    console.error('Error in fallback level generation:', error);
    throw error;
  }
}

export async function getLevels(level) {
  try {
    const db = await getDatabase();
    return await db.getAllAsync(
      "SELECT * FROM levels ORDER BY level ASC",
      []
    );
  } catch (error) {
    console.error("Error getting levels:", error);
    return [];
  }
}

export async function saveResult(
  department,
  questionId,
  totalQuestions,
  answered,
  correct,
  percentage,
  performance
) {
  try {
    const db = await getDatabase();

    // Insert result
    const result = await db.runAsync(
      `INSERT INTO results 
       (department, questionId, totalQuestions, answered, correct, percentage, performance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [department, questionId, totalQuestions, answered, correct, percentage, performance]
    );

    return result;
  } catch (error) {
    console.error("Error saving result:", error);
    throw error;
  }
}

export async function getResults() {
  try {
    const db = await getDatabase();
    const results = await db.getAllAsync(
      "SELECT * FROM results ORDER BY id DESC"
    );
    return results;
  } catch (error) {
    console.error("Error getting results:", error);
    return [];
  }
}

// Export initialization status
export { isInitialized };