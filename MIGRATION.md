# TaskIA - SQLite Migration Guide

## Migration Completed ✅

Successfully migrated from **Supabase + Twilio** to **SQLite with better-sqlite3**.

### What Changed?

#### Dependencies
- ❌ Removed: `@supabase/supabase-js`, `@supabase/ssr`, `twilio`
- ✅ Added: `better-sqlite3`, `@types/better-sqlite3`

#### Database
- 📦 SQLite database stored in `data/taskia.db`
- 🔒 WAL mode enabled for better concurrency
- 📊 3 tables: `tasks`, `calendar_events`, `update_notifications`
- 🚀 Automatic schema initialization on first run

### New Files

| File | Purpose |
|------|---------|
| `lib/db.ts` | Database initialization & schema management |
| `lib/queries/tasks.ts` | Task CRUD operations |
| `lib/queries/events.ts` | Calendar event CRUD operations |
| `lib/queries/notifications.ts` | Notification CRUD operations |
| `app/api/tasks/route.ts` | Unified API for all database operations |
| `components/update-notifications.tsx` | Notification display component (with polling) |

### Updated Files

| File | Changes |
|------|---------|
| `package.json` | Removed Supabase/Twilio, added SQLite dependencies |
| `lib/types.ts` | Removed WhatsApp source, renamed `WhatsAppUpdate` to `UpdateNotification` |
| `app/api/webhook/route.ts` | Migrated from Supabase to SQLite queries |

### API Endpoints

#### POST /api/tasks
Available actions:
- `create-task` - Create new task
- `get-task` - Get task by ID
- `list-tasks` - Get all tasks
- `get-pending-tasks` - Get incomplete tasks
- `update-task` - Update task
- `mark-task-complete` - Mark task as complete
- `delete-task` - Delete task
- `create-event` - Create calendar event
- `get-event` - Get event by ID
- `list-events` - Get all events
- `get-upcoming-events` - Get events within N days
- `get-events-by-type` - Filter events by type
- `update-event` - Update event
- `delete-event` - Delete event
- `get-notifications` - Get all notifications
- `get-unread-notifications` - Get unread notifications
- `get-recent-notifications` - Get latest N notifications
- `mark-notification-read` - Mark notification as read
- `mark-all-notifications-read` - Mark all as read
- `delete-notification` - Delete notification
- `delete-old-notifications` - Clean up old notifications

#### GET /api/tasks
Query parameters:
- `action=list-tasks` - Get all tasks
- `action=pending-tasks` - Get incomplete tasks
- `action=list-events` - Get all events
- `action=upcoming-events&days=30` - Get events in next N days
- `action=recent-notifications&limit=10` - Get latest notifications
- `action=unread-count` - Get unread notification count

#### POST /api/webhook
Deprecated - Use `/api/tasks` instead. Legacy format still supported:
- `type=add_task`
- `type=add_event`
- `type=send_reminder`
- `type=complete_task`

### Usage Examples

**Create a task:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-task",
    "data": {
      "subject": "Study Math",
      "description": "Chapter 5",
      "priority": "high",
      "due_date": "2026-05-20"
    }
  }'
```

**Get pending tasks:**
```bash
curl http://localhost:3000/api/tasks?action=pending-tasks
```

**Mark task complete:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "action": "mark-task-complete",
    "data": { "id": "task-uuid" }
  }'
```

### Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run development server:**
   ```bash
   pnpm dev
   ```
   
   The database will be automatically created at `data/taskia.db`

3. **Update components:**
   Replace `whatsapp-updates` with `update-notifications`:
   ```typescript
   import { UpdateNotifications } from '@/components/update-notifications'
   ```

### Database Schema

```sql
-- Tasks table
CREATE TABLE tasks (
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

-- Calendar Events table
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TEXT NOT NULL,
  event_type TEXT CHECK(event_type IN ('exam', 'study', 'project', 'deadline')) DEFAULT 'study',
  subject TEXT,
  source TEXT DEFAULT 'web',
  created_at TEXT NOT NULL
)

-- Notifications table
CREATE TABLE update_notifications (
  id TEXT PRIMARY KEY,
  message_type TEXT CHECK(message_type IN ('sync', 'reminder', 'insight', 'alert')) DEFAULT 'sync',
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT 0,
  related_task_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (related_task_id) REFERENCES tasks(id)
)
```

### Notes

- ✅ Database file is automatically created and initialized
- ✅ All queries use parameterized statements for SQL injection prevention
- ✅ Notifications use polling (every 5 seconds) instead of real-time subscriptions
- ✅ No environment variables needed
- ⚠️ WhatsApp integration removed (not included in this migration)
- ⚠️ Backup `data/taskia.db` before major changes

