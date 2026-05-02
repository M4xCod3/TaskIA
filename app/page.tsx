import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { TaskList } from "@/components/task-list"
import { StudyCalendar } from "@/components/study-calendar"
import { WhatsAppUpdates } from "@/components/whatsapp-updates"

export default function StudentDashboard() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-slate-500/10 blur-[80px]" />
      </div>

      <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardHeader />

        <div className="mt-8">
          <StatsCards />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* Priority Tasks - Top Section */}
            <TaskList />

            {/* Study Calendar - Bottom Section */}
            <StudyCalendar />
          </div>

          {/* WhatsApp Updates - Sidebar */}
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <WhatsAppUpdates />
          </aside>
        </div>
      </main>
    </div>
  )
}
