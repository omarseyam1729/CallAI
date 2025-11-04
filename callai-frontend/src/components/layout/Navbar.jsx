import { Button } from "@/components/ui/button"
import { User, PhoneCall } from "lucide-react"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import LoginModal from "@/components/auth/LoginModal"

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* Left: Clickable CallAI Icon */}
      <div className="flex items-center gap-2 select-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="hover:bg-muted/60"
        >
          <PhoneCall className="h-6 w-6 text-primary" strokeWidth={2.3} />
        </Button>
        <span className="text-xl font-bold tracking-tight text-primary">
          CallAI
        </span>
      </div>

      {/* Right: My Triggers + Theme + Profile */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="font-medium hidden md:inline-flex">
          My Triggers
        </Button>
        <ModeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => setLoginOpen(true)}
        >
          <User className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Login Modal */}
      <LoginModal open={loginOpen} setOpen={setLoginOpen} />
    </header>
  )
}
