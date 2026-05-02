"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FlaskConical, Calculator, Languages, Atom, Palette } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  subject: string
  priority: "high" | "medium" | "low"
  completed: boolean
  icon: React.ReactNode
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Complete Chapter 5 exercises",
    subject: "Mathematics",
    priority: "high",
    completed: false,
    icon: <Calculator className="size-4" />,
  },
  {
    id: "2",
    title: "Review organic chemistry notes",
    subject: "Chemistry",
    priority: "high",
    completed: false,
    icon: <FlaskConical className="size-4" />,
  },
  {
    id: "3",
    title: "Write essay draft on modernism",
    subject: "Literature",
    priority: "medium",
    completed: false,
    icon: <BookOpen className="size-4" />,
  },
  {
    id: "4",
    title: "Practice verb conjugations",
    subject: "Spanish",
    priority: "low",
    completed: false,
    icon: <Languages className="size-4" />,
  },
  {
    id: "5",
    title: "Solve quantum mechanics problems",
    subject: "Physics",
    priority: "high",
    completed: false,
    icon: <Atom className="size-4" />,
  },
  {
    id: "6",
    title: "Finish color theory assignment",
    subject: "Art History",
    priority: "medium",
    completed: false,
    icon: <Palette className="size-4" />,
  },
]

const priorityColors = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Priority Tasks</h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {tasks.length} completed
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <span className="text-lg font-bold text-primary">
            {tasks.length - completedCount}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "group flex items-center gap-4 rounded-xl border border-border/30 bg-secondary/30 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-secondary/50",
              task.completed && "opacity-60"
            )}
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
              className="size-5 rounded-md border-muted-foreground/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
            />
            
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              {task.icon}
            </div>

            <div className="flex-1">
              <p
                className={cn(
                  "font-medium text-foreground transition-all duration-300",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
              <p className="text-sm text-muted-foreground">{task.subject}</p>
            </div>

            <Badge
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize",
                priorityColors[task.priority]
              )}
            >
              {task.priority}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
