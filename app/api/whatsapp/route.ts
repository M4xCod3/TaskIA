"use server"

import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import twilio from "twilio"

const MessagingResponse = twilio.twiml.MessagingResponse

// Parse AI response to extract action data
function parseAIResponse(response: string): {
  action: string
  data: Record<string, unknown>
  reply: string
} {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1])
      return {
        action: parsed.action || "none",
        data: parsed.data || {},
        reply: parsed.reply || "Entendido.",
      }
    }

    // Try direct JSON parse
    const parsed = JSON.parse(response)
    return {
      action: parsed.action || "none",
      data: parsed.data || {},
      reply: parsed.reply || "Entendido.",
    }
  } catch {
    return {
      action: "none",
      data: {},
      reply: response,
    }
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const body = formData.get("Body") as string
    const from = formData.get("From") as string

    if (!body) {
      return new Response("No message body", { status: 400 })
    }

    // Use AI to understand the message and extract structured data
    const { text: aiResponse } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `Eres un asistente de estudio que ayuda a estudiantes a organizar sus tareas y eventos.
      
Cuando el usuario envíe un mensaje, analiza si quiere:
1. Agregar una tarea (add_task)
2. Agregar un evento al calendario (add_event)
3. Ver sus tareas (list_tasks)
4. Marcar una tarea como completada (complete_task)
5. Solo chatear (none)

SIEMPRE responde en formato JSON así:
\`\`\`json
{
  "action": "add_task" | "add_event" | "list_tasks" | "complete_task" | "none",
  "data": {
    // Para add_task:
    "subject": "nombre de la materia",
    "description": "descripción de la tarea",
    "priority": "high" | "medium" | "low"
    
    // Para add_event:
    "title": "título del evento",
    "event_date": "YYYY-MM-DD",
    "event_type": "exam" | "study" | "project" | "deadline",
    "subject": "materia relacionada"
    
    // Para complete_task:
    "task_description": "descripción parcial de la tarea a completar"
  },
  "reply": "Mensaje amigable para responder al usuario"
}
\`\`\`

Ejemplos de mensajes:
- "Tengo que estudiar cálculo para el examen del viernes" → add_task con priority high
- "Examen de física el 15 de mayo" → add_event tipo exam
- "Recordar hacer tarea de español" → add_task con priority medium
- "Qué tareas tengo?" → list_tasks
- "Ya terminé lo de química" → complete_task

Sé amigable y usa emojis en tu respuesta. Responde en español.`,
      prompt: body,
    })

    const parsed = parseAIResponse(aiResponse)
    const supabase = await createClient()

    let responseMessage = parsed.reply

    // Execute the action based on AI understanding
    switch (parsed.action) {
      case "add_task": {
        const taskData = parsed.data as {
          subject?: string
          description?: string
          priority?: string
        }

        const { error } = await supabase.from("tasks").insert({
          subject: taskData.subject || "General",
          description: taskData.description || body,
          priority: taskData.priority || "medium",
          source: "whatsapp",
        })

        if (error) {
          responseMessage = "Hubo un error al guardar la tarea. Intenta de nuevo."
        } else {
          // Also create a WhatsApp update notification
          await supabase.from("whatsapp_updates").insert({
            message_type: "sync",
            title: "Nueva tarea agregada",
            content: `Tarea de ${taskData.subject}: ${taskData.description}`,
          })
        }
        break
      }

      case "add_event": {
        const eventData = parsed.data as {
          title?: string
          event_date?: string
          event_type?: string
          subject?: string
        }

        // Parse relative dates
        let eventDate = eventData.event_date
        if (!eventDate) {
          // Default to tomorrow if no date specified
          const tomorrow = new Date()
          tomorrow.setDate(tomorrow.getDate() + 1)
          eventDate = tomorrow.toISOString().split("T")[0]
        }

        const { error } = await supabase.from("calendar_events").insert({
          title: eventData.title || "Evento",
          event_date: eventDate,
          event_type: eventData.event_type || "study",
          subject: eventData.subject || null,
          source: "whatsapp",
        })

        if (error) {
          responseMessage = "Hubo un error al guardar el evento. Intenta de nuevo."
        } else {
          await supabase.from("whatsapp_updates").insert({
            message_type: "reminder",
            title: "Nuevo evento en calendario",
            content: `${eventData.title} programado para ${eventDate}`,
          })
        }
        break
      }

      case "list_tasks": {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("completed", false)
          .order("priority", { ascending: true })
          .limit(5)

        if (tasks && tasks.length > 0) {
          const taskList = tasks
            .map((t, i) => {
              const priorityEmoji =
                t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🟢"
              return `${i + 1}. ${priorityEmoji} ${t.subject}: ${t.description || "Sin descripción"}`
            })
            .join("\n")
          responseMessage = `📋 Tus tareas pendientes:\n\n${taskList}`
        } else {
          responseMessage = "🎉 ¡No tienes tareas pendientes! Disfruta tu tiempo libre."
        }
        break
      }

      case "complete_task": {
        const completeData = parsed.data as { task_description?: string }
        if (completeData.task_description) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("*")
            .eq("completed", false)
            .ilike("description", `%${completeData.task_description}%`)
            .limit(1)

          if (tasks && tasks.length > 0) {
            await supabase
              .from("tasks")
              .update({ completed: true, updated_at: new Date().toISOString() })
              .eq("id", tasks[0].id)

            responseMessage = `✅ ¡Excelente! Marqué como completada: "${tasks[0].subject}"`

            await supabase.from("whatsapp_updates").insert({
              message_type: "insight",
              title: "Tarea completada",
              content: `Completaste: ${tasks[0].subject}`,
              related_task_id: tasks[0].id,
            })
          } else {
            responseMessage = "No encontré esa tarea. ¿Puedes ser más específico?"
          }
        }
        break
      }
    }

    // Create TwiML response
    const twiml = new MessagingResponse()
    twiml.message(responseMessage)

    return new Response(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)

    const twiml = new MessagingResponse()
    twiml.message("Ocurrió un error. Por favor intenta de nuevo.")

    return new Response(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    })
  }
}

// Handle GET for webhook verification
export async function GET() {
  return new Response("WhatsApp webhook is active", { status: 200 })
}
