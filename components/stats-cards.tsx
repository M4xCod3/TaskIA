"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, Clock, Target, TrendingUp, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Stats {
  totalTasks: number
  completedTasks: number
  upcomingEvents: number
  subjects: Set<string>
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalTasks: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    subjects: new Set(),
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchStats()

    // Set up real-time subscriptions
    const tasksChannel = supabase
      .channel("stats-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchStats)
      .subscribe()

    const eventsChannel = supabase
      .channel("stats-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, fetchStats)
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(eventsChannel)
    }
  }, [])

  const fetchStats = async () => {
    const [tasksResponse, eventsResponse] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("calendar_events").select("*").gte("event_date", new Date().toISOString().split("T")[0]),
    ])

    const tasks = tasksResponse.data || []
    const events = eventsResponse.data || []

    const subjects = new Set<string>()
    tasks.forEach((t) => subjects.add(t.subject))
    events.forEach((e) => e.subject && subjects.add(e.subject))

    setStats({
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.completed).length,
      upcomingEvents: events.length,
      subjects,
    })
    setLoading(false)
  }

  const statsConfig = [
    {
      title: "Upcoming Events",
      value: stats.upcomingEvents.toString(),
      unit: "events",
      icon: Clock,
      color: "from-indigo-500/20 to-indigo-600/20 text-indigo-400",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Tasks Done",
      value: stats.completedTasks.toString(),
      unit: `/${stats.totalTasks}`,
      icon: Target,
      color: "from-emerald-500/20 to-emerald-600/20 text-emerald-400",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Completion",
      value: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100).toString() : "0",
      unit: "%",
      icon: TrendingUp,
      color: "from-amber-500/20 to-amber-600/20 text-amber-400",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Subjects",
      value: stats.subjects.size.toString(),
      unit: "active",
      icon: BookOpen,
      color: "from-sky-500/20 to-sky-600/20 text-sky-400",
      borderColor: "border-sky-500/30",
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex h-32 items-center justify-center rounded-2xl border border-border/30 bg-card/30 backdrop-blur-xl"
          >
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.title}
            className={cn(
              "rounded-2xl border bg-card/30 p-5 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
              stat.borderColor
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br",
                  stat.color
                )}
              >
                <Icon className="size-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-foreground">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.unit}</span>
            </div>
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              Real-time sync
            </p>
          </div>
        )
      })}
    </div>
  )
}
