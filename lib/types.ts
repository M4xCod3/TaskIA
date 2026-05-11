export interface Task {
  id: string
  subject: string
  description: string | null
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  due_date: string | null
  source: 'web' | 'whatsapp'
  created_at: string
  updated_at: string
}

export interface WhatsAppUpdate {
  id: string
  message_type: 'sync' | 'reminder' | 'insight' | 'alert'
  title: string
  content: string | null
  is_read: boolean
  related_task_id: string | null
  created_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  event_date: string
  event_type: 'exam' | 'study' | 'project' | 'deadline'
  subject: string | null
  source: 'web' | 'whatsapp'
  created_at: string
}
