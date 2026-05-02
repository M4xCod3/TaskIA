import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// Create a Supabase client with the service role for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Handle different types of webhook events from WhatsApp AI agent
    switch (type) {
      case "add_task": {
        const { subject, description, priority = "medium", due_date } = data
        
        if (!subject) {
          return NextResponse.json({ error: "Subject is required" }, { status: 400 })
        }

        // Insert the task
        const { data: task, error: taskError } = await supabase
          .from("tasks")
          .insert({
            subject,
            description,
            priority,
            due_date,
            source: "whatsapp",
          })
          .select()
          .single()

        if (taskError) {
          return NextResponse.json({ error: taskError.message }, { status: 500 })
        }

        // Create a WhatsApp update notification
        await supabase.from("whatsapp_updates").insert({
          message_type: "sync",
          title: "New Task Added",
          content: `Task "${description || subject}" has been synced from WhatsApp`,
          related_task_id: task.id,
        })

        return NextResponse.json({ success: true, task })
      }

      case "add_event": {
        const { title, description, event_date, event_type = "study", subject } = data

        if (!title || !event_date) {
          return NextResponse.json({ error: "Title and event_date are required" }, { status: 400 })
        }

        const { data: event, error: eventError } = await supabase
          .from("calendar_events")
          .insert({
            title,
            description,
            event_date,
            event_type,
            subject,
            source: "whatsapp",
          })
          .select()
          .single()

        if (eventError) {
          return NextResponse.json({ error: eventError.message }, { status: 500 })
        }

        // Create a WhatsApp update notification
        await supabase.from("whatsapp_updates").insert({
          message_type: "sync",
          title: "New Event Added",
          content: `Event "${title}" scheduled for ${new Date(event_date).toLocaleDateString()} has been synced from WhatsApp`,
        })

        return NextResponse.json({ success: true, event })
      }

      case "send_reminder": {
        const { title, content, message_type = "reminder" } = data

        if (!title) {
          return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        const { data: update, error: updateError } = await supabase
          .from("whatsapp_updates")
          .insert({
            message_type,
            title,
            content,
          })
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, update })
      }

      case "complete_task": {
        const { task_id } = data

        if (!task_id) {
          return NextResponse.json({ error: "task_id is required" }, { status: 400 })
        }

        const { error } = await supabase
          .from("tasks")
          .update({ completed: true, updated_at: new Date().toISOString() })
          .eq("id", task_id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        await supabase.from("whatsapp_updates").insert({
          message_type: "sync",
          title: "Task Completed",
          content: "A task has been marked as complete via WhatsApp",
          related_task_id: task_id,
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: "Unknown webhook type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to fetch current data (for the AI agent to sync)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")

  try {
    switch (type) {
      case "tasks": {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ tasks: data })
      }

      case "events": {
        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .gte("event_date", new Date().toISOString().split("T")[0])
          .order("event_date", { ascending: true })

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ events: data })
      }

      default:
        return NextResponse.json({ error: "Type parameter required (tasks or events)" }, { status: 400 })
    }
  } catch (error) {
    console.error("GET webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
