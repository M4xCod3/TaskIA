"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, GraduationCap, Users, Clock, Plus, Trash2, MessageCircle, Globe, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/lib/types"

const typeConfig = {
  exam: {
    icon: GraduationCap,
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    dotColor: "bg-red-500",
  },
  study: {
    icon: BookOpen,
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    dotColor: "bg-indigo-500",
  },
  project: {
    icon: Users,
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  deadline: {
    icon: Clock,
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
}

const sourceIcons = {
  whatsapp: <MessageCircle className="size-3" />,
  web: <Globe className="size-3" />,
}

export function StudyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    subject: "",
    event_type: "study" as CalendarEvent["event_type"],
  })
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()

    // Set up real-time subscription
    const channel = supabase
      .channel("calendar-events-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setEvents((prev) => [...prev, payload.new as CalendarEvent])
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((event) =>
                event.id === payload.new.id ? (payload.new as CalendarEvent) : event
              )
            )
          } else if (payload.eventType === "DELETE") {
            setEvents((prev) => prev.filter((event) => event.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true })

    if (!error && data) {
      setEvents(data)
    }
    setLoading(false)
  }

  const addEvent = async () => {
    if (!newEvent.title.trim() || !selectedDate) return

    await supabase.from("calendar_events").insert({
      title: newEvent.title,
      subject: newEvent.subject || null,
      event_type: newEvent.event_type,
      event_date: selectedDate.toISOString().split("T")[0],
      source: "web",
    })

    setNewEvent({ title: "", subject: "", event_type: "study" })
    setShowAddForm(false)
  }

  const deleteEvent = async (eventId: string) => {
    await supabase.from("calendar_events").delete().eq("id", eventId)
  }

  const eventDates = events.map((e) => new Date(e.event_date).toDateString())

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => new Date(e.event_date).toDateString() === date.toDateString())
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 4)

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Study Calendar</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-2"
        >
          <Plus className="size-4" />
          Add Event
        </Button>
      </div>

      {showAddForm && selectedDate && (
        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/30 bg-secondary/20 p-4">
          <p className="text-sm text-muted-foreground">
            Adding event for {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
              className="flex-1 border-border/50 bg-background/50"
            />
            <Input
              placeholder="Subject (optional)"
              value={newEvent.subject}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, subject: e.target.value }))}
              className="w-40 border-border/50 bg-background/50"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={newEvent.event_type}
              onChange={(e) => setNewEvent((prev) => ({ ...prev, event_type: e.target.value as CalendarEvent["event_type"] }))}
              className="rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground"
            >
              <option value="exam">Exam</option>
              <option value="study">Study Session</option>
              <option value="project">Project</option>
              <option value="deadline">Deadline</option>
            </select>
            <Button onClick={addEvent} disabled={!newEvent.title.trim()}>
              Add Event
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex justify-center rounded-xl border border-border/30 bg-secondary/20 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="[--cell-size:--spacing(10)]"
              modifiers={{
                event: (date) => eventDates.includes(date.toDateString()),
              }}
              modifiersClassNames={{
                event: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-primary",
              }}
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {selectedDate && selectedEvents.length > 0
                ? `Events on ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Upcoming Events"}
            </h3>
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (selectedEvents.length > 0 ? selectedEvents : upcomingEvents).length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No events. Add one or sync from WhatsApp!
                </div>
              ) : (
                (selectedEvents.length > 0 ? selectedEvents : upcomingEvents).map((event) => {
                  const config = typeConfig[event.event_type]
                  const Icon = config.icon
                  return (
                    <div
                      key={event.id}
                      className="group flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          config.color
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {event.subject && <span>{event.subject}</span>}
                          <span className="flex items-center gap-1">
                            {sourceIcons[event.source]}
                          </span>
                        </div>
                      </div>
                      {selectedEvents.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {Object.entries(typeConfig).map(([type, config]) => (
              <Badge
                key={type}
                className={cn(
                  "rounded-lg border px-2 py-1 text-xs capitalize",
                  config.color
                )}
              >
                <span className={cn("mr-1.5 size-2 rounded-full", config.dotColor)} />
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
