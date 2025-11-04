import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "@/components/layout/Navbar"
import Dashboard from "@/pages/Dashboard"
import BatchMode from "@/pages/BatchMode"
import ScheduleMode from "@/pages/ScheduleMode"
import CallExplorer from "@/pages/CallExplorer"
import Agents from "@/pages/Agents"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/batch-mode" element={<BatchMode />} />
            <Route path="/schedule-mode" element={<ScheduleMode />} />
            <Route path="/call-explorer" element={<CallExplorer />} />
            <Route path="/agents" element={<Agents />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
