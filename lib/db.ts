import { Schedule, ScheduleType } from "@/types/schedule";
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

    // Create schedules table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        type INTEGER NOT NULL,
        days TEXT NOT NULL,
        start_time TEXT,
        end_time TEXT,
        ready_by TEXT,
        desired_charge_level INTEGER,
        desired_mileage INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log("Schedules table ensured.");

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

// Schedule CRUD Operations

// Helper to convert database row to Schedule object
function rowToSchedule(row: any): Schedule {
    const days = JSON.parse(row.days) as number[];
    
    const baseSchedule = {
        id: row.id,
        user_id: row.user_id,
        description: row.description,
        days,
    };

    switch (row.type) {
        case ScheduleType.TIME:
            return {
                ...baseSchedule,
                type: ScheduleType.TIME,
                start_time: row.start_time,
                end_time: row.end_time,
            };
        case ScheduleType.CHARGE_LEVEL:
            return {
                ...baseSchedule,
                type: ScheduleType.CHARGE_LEVEL,
                ready_by: row.ready_by,
                desired_charge_level: row.desired_charge_level,
            };
        case ScheduleType.MILEAGE:
            return {
                ...baseSchedule,
                type: ScheduleType.MILEAGE,
                ready_by: row.ready_by,
                desired_mileage: row.desired_mileage,
            };
        default:
            throw new Error(`Unknown schedule type: ${row.type}`);
    }
}

// Create a new schedule
export async function createSchedule(
    userId: number,
    schedule: Omit<Schedule, 'id' | 'user_id'>
): Promise<{ success: boolean; message: string; scheduleId?: number }> {
    try {
        const database = await ensureDbReady();
        
        const daysJson = JSON.stringify(schedule.days);
        
        // Extract all possible fields, setting null for fields not in this schedule type
        const startTime = schedule.type === ScheduleType.TIME ? schedule.start_time : null;
        const endTime = schedule.type === ScheduleType.TIME ? schedule.end_time : null;
        const readyBy = schedule.type === ScheduleType.CHARGE_LEVEL || schedule.type === ScheduleType.MILEAGE 
            ? schedule.ready_by 
            : null;
        const desiredChargeLevel = schedule.type === ScheduleType.CHARGE_LEVEL 
            ? schedule.desired_charge_level 
            : null;
        const desiredMileage = schedule.type === ScheduleType.MILEAGE 
            ? schedule.desired_mileage 
            : null;

        const result = await database.runAsync(
            `INSERT INTO schedules (
                user_id, description, type, days, 
                start_time, end_time, ready_by, 
                desired_charge_level, desired_mileage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                schedule.description,
                schedule.type,
                daysJson,
                startTime,
                endTime,
                readyBy,
                desiredChargeLevel,
                desiredMileage,
            ]
        );
        
        return {
            success: true,
            message: 'Schedule created successfully',
            scheduleId: result.lastInsertRowId,
        };
    } catch (error) {
        console.error('Failed to create schedule:', error);
        return { success: false, message: 'Failed to create schedule' };
    }
}

// Get all schedules for a user
export async function getSchedules(userId: number): Promise<Schedule[]> {
    try {
        const database = await ensureDbReady();
        const rows = await database.getAllAsync<any>(
            'SELECT * FROM schedules WHERE user_id = ? ORDER BY id DESC',
            [userId]
        );
        
        return rows.map(rowToSchedule);
    } catch (error) {
        console.error('Failed to get schedules:', error);
        return [];
    }
}

// Get a single schedule by ID
export async function getScheduleById(
    scheduleId: number,
    userId: number
): Promise<Schedule | null> {
    try {
        const database = await ensureDbReady();
        const row = await database.getFirstAsync<any>(
            'SELECT * FROM schedules WHERE id = ? AND user_id = ?',
            [scheduleId, userId]
        );
        
        if (!row) return null;
        
        return rowToSchedule(row);
    } catch (error) {
        console.error('Failed to get schedule:', error);
        return null;
    }
}

// Update a schedule
export async function updateSchedule(
    scheduleId: number,
    userId: number,
    schedule: Omit<Schedule, 'id' | 'user_id'>
): Promise<{ success: boolean; message: string }> {
    try {
        const database = await ensureDbReady();
        
        const daysJson = JSON.stringify(schedule.days);
        
        // Extract all possible fields, setting null for fields not in this schedule type
        const startTime = schedule.type === ScheduleType.TIME ? schedule.start_time : null;
        const endTime = schedule.type === ScheduleType.TIME ? schedule.end_time : null;
        const readyBy = schedule.type === ScheduleType.CHARGE_LEVEL || schedule.type === ScheduleType.MILEAGE 
            ? schedule.ready_by 
            : null;
        const desiredChargeLevel = schedule.type === ScheduleType.CHARGE_LEVEL 
            ? schedule.desired_charge_level 
            : null;
        const desiredMileage = schedule.type === ScheduleType.MILEAGE 
            ? schedule.desired_mileage 
            : null;

        const result = await database.runAsync(
            `UPDATE schedules 
             SET description = ?, type = ?, days = ?,
                 start_time = ?, end_time = ?, ready_by = ?,
                 desired_charge_level = ?, desired_mileage = ?
             WHERE id = ? AND user_id = ?`,
            [
                schedule.description,
                schedule.type,
                daysJson,
                startTime,
                endTime,
                readyBy,
                desiredChargeLevel,
                desiredMileage,
                scheduleId,
                userId,
            ]
        );
        
        if (result.changes === 0) {
            return { success: false, message: 'Schedule not found or unauthorized' };
        }
        
        return { success: true, message: 'Schedule updated successfully' };
    } catch (error) {
        console.error('Failed to update schedule:', error);
        return { success: false, message: 'Failed to update schedule' };
    }
}

// Delete a schedule
export async function deleteSchedule(
    scheduleId: number,
    userId: number
): Promise<{ success: boolean; message: string }> {
    try {
        const database = await ensureDbReady();
        const result = await database.runAsync(
            'DELETE FROM schedules WHERE id = ? AND user_id = ?',
            [scheduleId, userId]
        );
        
        if (result.changes === 0) {
            return { success: false, message: 'Schedule not found or unauthorized' };
        }
        
        return { success: true, message: 'Schedule deleted successfully' };
    } catch (error) {
        console.error('Failed to delete schedule:', error);
        return { success: false, message: 'Failed to delete schedule' };
    }
}

// Export the database getter for other operations
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
    return ensureDbReady();
}
