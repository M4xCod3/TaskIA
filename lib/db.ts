import Database from 'better-sqlite3'
import path from 'path'
import { mkdir } from 'fs/promises'

// Ensure the data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await mkdir(dataDir, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

// Initialize database
let db: Database.Database | null = null

export async function getDb() {
  if (!db) {
    await ensureDataDir()
    const dbPath = path.join(process.cwd(), 'data', 'taskia.db')
    db = new Database(dbPath)
    
    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL')
    
    // Initialize schema
    initializeSchema(db)
  }
  return db
}

function initializeSchema(database: Database.Database) {
  // Create tasks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
      completed BOOLEAN DEFAULT 0,
      due_date TEXT,
      source TEXT DEFAULT 'web',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  // Create calendar_events table
  database.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      event_type TEXT CHECK(event_type IN ('exam', 'study', 'project', 'deadline')) DEFAULT 'study',
      subject TEXT,
      source TEXT DEFAULT 'web',
      created_at TEXT NOT NULL
    )
  `)

  // Create update_notifications table
  database.exec(`
    CREATE TABLE IF NOT EXISTS update_notifications (
      id TEXT PRIMARY KEY,
      message_type TEXT CHECK(message_type IN ('sync', 'reminder', 'insight', 'alert')) DEFAULT 'sync',
      title TEXT NOT NULL,
      content TEXT,
      is_read BOOLEAN DEFAULT 0,
      related_task_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (related_task_id) REFERENCES tasks(id)
    )
  `)

  // Create indexes for better query performance
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON update_notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON update_notifications(created_at);
  `)
}

export async function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
