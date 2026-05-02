"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, GraduationCap, Users, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  date: Date
  title: string
  type: "exam" | "study" | "group" | "deadline"
  subject: string
}

const events: CalendarEvent[] = [
  {
    date: new Date(2026, 4, 5),
    title: "Calculus Midterm",
    type: "exam",
    subject: "Mathematics",
  },
  {
    date: new Date(2026, 4, 8),
    title: "Study Session",
    type: "study",
    subject: "Chemistry",
  },
  {
    date: new Date(2026, 4, 10),
    title: "Group Project",
    type: "group",
    subject: "Literature",
  },
  {
    date: new Date(2026, 4, 12),
    title: "Physics Final",
    type: "exam",
    subject: "Physics",
  },
  {
    date: new Date(2026, 4, 15),
    title: "Essay Due",
    type: "deadline",
    subject: "History",
  },
  {
    date: new Date(2026, 4, 18),
    title: "Chemistry Lab",
    type: "study",
    subject: "Chemistry",
  },
  {
    date: new Date(2026, 4, 22),
    title: "Spanish Oral",
    type: "exam",
    subject: "Spanish",
  },
  {
    date: new Date(2026, 4, 25),
    title: "Art Review",
    type: "study",
    subject: "Art History",
  },
]

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
  group: {
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

export function StudyCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const eventDates = events.map((e) => e.date.toDateString())

  const getEventsForDate = (date: Date) => {
    return events.filter((e) => e.date.toDateString() === date.toDateString())
  }

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const upcomingEvents = events
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 4)

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl">
      <h2 className="mb-6 text-xl font-semibold text-foreground">Study Calendar</h2>
      
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex justify-center rounded-xl border border-border/30 bg-secondary/20 p-4">
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
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              {selectedDate && selectedEvents.length > 0
                ? `Events on ${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : "Upcoming Events"}
            </h3>
            <div className="space-y-2">
              {(selectedEvents.length > 0 ? selectedEvents : upcomingEvents).map(
                (event, index) => {
                  const config = typeConfig[event.type]
                  const Icon = config.icon
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-xl border border-border/30 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
                    >
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          config.color
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.subject}
                        </p>
                      </div>
                      {selectedEvents.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          {event.date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  )
                }
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
