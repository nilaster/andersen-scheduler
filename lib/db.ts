import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

// Initialize database
async function initializeDatabase() {
    db = await SQLite.openDatabaseAsync("tech_challenge.db");

    // Create users table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log("Users table ensured.");

    // Create default user
    await createDefaultUser();
}

// Create a default user for testing
async function createDefaultUser() {
    try {
        // Check if default user already exists
        const existingUser = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM users WHERE username = ?',
            ['testuser']
        );

        if (!existingUser) {
            // Create default user with a simple password hash (in production, use proper hashing)
            await db.runAsync(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ['testuser', 'password123'] // In production, this should be properly hashed
            );
            console.log('Default test user created: username="testuser", password="password123"');
        }
    } catch (error) {
        console.error('Failed to create default user:', error);
    }
}

// Initialize the database
const dbPromise = initializeDatabase();

// Helper to ensure db is ready
async function ensureDbReady() {
    await dbPromise;
    return db;
}

// Register a new user
export async function register(username: string, passwordHash: string): Promise<{ success: boolean; message: string }> {
    try {
        const database = await ensureDbReady();
        await database.runAsync(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, passwordHash]
        );
        return { success: true, message: 'User registered successfully' };
    } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
            return { success: false, message: 'Username already exists' };
        }
        return { success: false, message: 'Registration failed' };
    }
}

// Login user
export async function login(username: string, passwordHash: string): Promise<{ success: boolean; message: string; user?: { id: number; username: string } }> {
    try {
        const database = await ensureDbReady();
        const result = await database.getFirstAsync<{ id: number; username: string; password: string }>(
            'SELECT id, username, password FROM users WHERE username = ?',
            [username]
        );

        if (!result) {
            return { success: false, message: 'User not found' };
        }

        if (result.password !== passwordHash) {
            return { success: false, message: 'Invalid password' };
        }

        return {
            success: true,
            message: 'Login successful',
            user: { id: result.id, username: result.username }
        };
    } catch (error) {
        return { success: false, message: 'Login failed' };
    }
}

// Export the database getter for other operations
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    return ensureDbReady();
}
