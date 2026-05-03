"use client"

import { useState, useEffect } from "react"
import { Bell, Search, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const [currentDate, setCurrentDate] = useState<string>("")

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }))
  }, [])

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome back, <span className="text-primary"></span>
        </h1>
        <p className="mt-1 text-muted-foreground" suppressHydrationWarning>{currentDate || "\u00A0"}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="h-10 w-64 rounded-xl border border-border/50 bg-secondary/30 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"
          />
        </div>

        <button className="relative flex size-10 items-center justify-center rounded-xl border border-border/50 bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground backdrop-blur-sm">
          <Bell className="size-5" />
          <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary p-0 text-xs font-semibold text-primary-foreground">
            3
          </Badge>
        </button>

        <button className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground transition-transform hover:scale-105">
          <User className="size-5" />
        </button>
      </div>
    </header>
  )
}
