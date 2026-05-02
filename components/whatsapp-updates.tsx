"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Bot, Sparkles, Bell, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface Update {
  id: string
  title: string
  message: string
  time: string
  type: "sync" | "reminder" | "insight" | "alert"
  read: boolean
}

const initialUpdates: Update[] = [
  {
    id: "1",
    title: "Study Schedule Updated",
    message: "Your AI agent synced 3 new study sessions from your group chat",
    time: "2 min ago",
    type: "sync",
    read: false,
  },
  {
    id: "2",
    title: "Exam Reminder",
    message: "Physics final exam is in 2 days. Review quantum mechanics notes.",
    time: "15 min ago",
    type: "reminder",
    read: false,
  },
  {
    id: "3",
    title: "Smart Insight",
    message: "Based on your study patterns, consider a 30-min break now.",
    time: "1 hour ago",
    type: "insight",
    read: true,
  },
  {
    id: "4",
    title: "Group Chat Activity",
    message: "5 new messages in Math Study Group about tomorrow's quiz",
    time: "2 hours ago",
    type: "alert",
    read: true,
  },
  {
    id: "5",
    title: "Resource Shared",
    message: "Maria shared chemistry flashcards to your study materials",
    time: "3 hours ago",
    type: "sync",
    read: true,
  },
]

const typeConfig = {
  sync: {
    icon: MessageCircle,
    color: "bg-emerald-500/20 text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  reminder: {
    icon: Bell,
    color: "bg-amber-500/20 text-amber-400",
    borderColor: "border-amber-500/30",
  },
  insight: {
    icon: Sparkles,
    color: "bg-indigo-500/20 text-indigo-400",
    borderColor: "border-indigo-500/30",
  },
  alert: {
    icon: Bot,
    color: "bg-sky-500/20 text-sky-400",
    borderColor: "border-sky-500/30",
  },
}

export function WhatsAppUpdates() {
  const [updates, setUpdates] = useState<Update[]>(initialUpdates)
  const [isExpanded, setIsExpanded] = useState(true)

  const unreadCount = updates.filter((u) => !u.read).length

  const markAsRead = (id: string) => {
    setUpdates((prev) =>
      prev.map((update) =>
        update.id === id ? { ...update, read: true } : update
      )
    )
  }

  const dismissUpdate = (id: string) => {
    setUpdates((prev) => prev.filter((update) => update.id !== id))
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-4 flex w-full items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <MessageCircle className="size-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">WhatsApp Updates</h3>
            <p className="text-xs text-muted-foreground">AI Agent Sync</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            {unreadCount} new
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2.5">
          {updates.map((update) => {
            const config = typeConfig[update.type]
            const Icon = config.icon
            return (
              <div
                key={update.id}
                onClick={() => markAsRead(update.id)}
                className={cn(
                  "group relative cursor-pointer rounded-xl border p-3 transition-all duration-200 hover:bg-secondary/50",
                  update.read
                    ? "border-border/30 bg-secondary/20"
                    : "border-primary/30 bg-primary/5"
                )}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    dismissUpdate(update.id)
                  }}
                  className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                >
                  <X className="size-3.5 text-muted-foreground" />
                </button>
                
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                      config.color
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {update.title}
                      </p>
                      {!update.read && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {update.message}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground/60">
                      {update.time}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
