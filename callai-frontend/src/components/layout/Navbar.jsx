import { Button } from "@/components/ui/button"
import { User } from "lucide-react"

export default function Navbar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 select-none">
        <img
          src="/logo.svg"
          alt="CallAI"
          className="h-8 w-8"
        />
        <span className="text-xl font-bold tracking-tight text-primary">
          CallAI
        </span>
      </div>

      {/* Right: My Triggers + Profile */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" className="font-medium">
          My Triggers
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
