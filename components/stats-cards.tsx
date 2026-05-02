"use client"

import { BookOpen, Clock, Target, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    title: "Study Hours",
    value: "24.5",
    unit: "hrs",
    change: "+12%",
    trend: "up",
    icon: Clock,
    color: "from-indigo-500/20 to-indigo-600/20 text-indigo-400",
    borderColor: "border-indigo-500/30",
  },
  {
    title: "Tasks Done",
    value: "18",
    unit: "/24",
    change: "+8%",
    trend: "up",
    icon: Target,
    color: "from-emerald-500/20 to-emerald-600/20 text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  {
    title: "Avg. Score",
    value: "87",
    unit: "%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
    color: "from-amber-500/20 to-amber-600/20 text-amber-400",
    borderColor: "border-amber-500/30",
  },
  {
    title: "Subjects",
    value: "6",
    unit: "active",
    change: "On track",
    trend: "neutral",
    icon: BookOpen,
    color: "from-sky-500/20 to-sky-600/20 text-sky-400",
    borderColor: "border-sky-500/30",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
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
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
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
              <span className="text-3xl font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">{stat.unit}</span>
            </div>
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                stat.trend === "up"
                  ? "text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {stat.change} from last week
            </p>
          </div>
        )
      })}
    </div>
  )
}
