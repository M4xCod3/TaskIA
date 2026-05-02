"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Bot, Sparkles, Bell, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WhatsAppUpdate } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

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
  const [updates, setUpdates] = useState<WhatsAppUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUpdates()

    // Set up real-time subscription
    const channel = supabase
      .channel("whatsapp-updates-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_updates" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setUpdates((prev) => [payload.new as WhatsAppUpdate, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setUpdates((prev) =>
              prev.map((update) =>
                update.id === payload.new.id ? (payload.new as WhatsAppUpdate) : update
              )
            )
          } else if (payload.eventType === "DELETE") {
            setUpdates((prev) => prev.filter((update) => update.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from("whatsapp_updates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (!error && data) {
      setUpdates(data)
    }
    setLoading(false)
  }

  const unreadCount = updates.filter((u) => !u.is_read).length

  const markAsRead = async (id: string) => {
    await supabase.from("whatsapp_updates").update({ is_read: true }).eq("id", id)
  }

  const dismissUpdate = async (id: string) => {
    await supabase.from("whatsapp_updates").delete().eq("id", id)
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
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
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : updates.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No updates yet. Messages from your WhatsApp AI agent will appear here.
            </div>
          ) : (
            updates.map((update) => {
              const config = typeConfig[update.message_type]
              const Icon = config.icon
              return (
                <div
                  key={update.id}
                  onClick={() => markAsRead(update.id)}
                  className={cn(
                    "group relative cursor-pointer rounded-xl border p-3 transition-all duration-200 hover:bg-secondary/50",
                    update.is_read
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
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {update.title}
                        </p>
                        {!update.is_read && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {update.content}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground/60">
                        {formatTime(update.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
