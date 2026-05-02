"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  BookOpen, 
  FlaskConical, 
  Calculator, 
  Languages, 
  Atom, 
  Palette,
  Plus,
  Trash2,
  MessageCircle,
  Globe,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/types"

const subjectIcons: Record<string, React.ReactNode> = {
  mathematics: <Calculator className="size-4" />,
  chemistry: <FlaskConical className="size-4" />,
  literature: <BookOpen className="size-4" />,
  spanish: <Languages className="size-4" />,
  physics: <Atom className="size-4" />,
  art: <Palette className="size-4" />,
}

const getSubjectIcon = (subject: string) => {
  const key = subject.toLowerCase()
  for (const [name, icon] of Object.entries(subjectIcons)) {
    if (key.includes(name)) return icon
  }
  return <BookOpen className="size-4" />
}

const priorityColors = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

const sourceIcons = {
  whatsapp: <MessageCircle className="size-3" />,
  web: <Globe className="size-3" />,
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({ subject: "", description: "", priority: "medium" as const })
  const [isAdding, setIsAdding] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()

    // Set up real-time subscription
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? (payload.new as Task) : task
              )
            )
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error && data) {
      setTasks(data)
    }
    setLoading(false)
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed, updated_at: new Date().toISOString() })
      .eq("id", taskId)

    if (error) {
      console.error("Error updating task:", error)
    }
  }

  const addTask = async () => {
    if (!newTask.subject.trim() || !newTask.description.trim()) return

    setIsAdding(true)
    const { error } = await supabase.from("tasks").insert({
      subject: newTask.subject,
      description: newTask.description,
      priority: newTask.priority,
      source: "web",
    })

    if (!error) {
      setNewTask({ subject: "", description: "", priority: "medium" })
    }
    setIsAdding(false)
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) {
      console.error("Error deleting task:", error)
    }
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

      {/* Add Task Form */}
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border/30 bg-secondary/20 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Subject"
            value={newTask.subject}
            onChange={(e) => setNewTask((prev) => ({ ...prev, subject: e.target.value }))}
            className="flex-1 border-border/50 bg-background/50"
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value as Task["priority"] }))}
            className="rounded-md border border-border/50 bg-background/50 px-3 text-sm text-foreground"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
            className="flex-1 border-border/50 bg-background/50"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button
            onClick={addTask}
            disabled={isAdding || !newTask.subject.trim() || !newTask.description.trim()}
            className="gap-2"
          >
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No tasks yet. Add one above or send a message via WhatsApp!
        </div>
      ) : (
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
                onCheckedChange={() => toggleTask(task.id, task.completed)}
                className="size-5 rounded-md border-muted-foreground/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />

              <div className="flex size-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                {getSubjectIcon(task.subject)}
              </div>

              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium text-foreground transition-all duration-300",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.description || task.subject}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{task.subject}</span>
                  <span className="flex items-center gap-1 text-xs">
                    {sourceIcons[task.source]}
                    {task.source === "whatsapp" ? "WhatsApp" : "Web"}
                  </span>
                </div>
              </div>

              <Badge
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize",
                  priorityColors[task.priority]
                )}
              >
                {task.priority}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask(task.id)}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
