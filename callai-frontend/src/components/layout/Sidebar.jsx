import { Link, useLocation } from "react-router-dom"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Clock,
  CalendarClock,
  PhoneCall,
  Users,
} from "lucide-react"

export default function Sidebar({ open, setOpen }) {
  const { pathname } = useLocation()

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Batch Mode", icon: Clock, path: "/batch-mode" },
    { name: "Schedule Mode", icon: CalendarClock, path: "/schedule-mode" },
    { name: "Call Explorer", icon: PhoneCall, path: "/call-explorer" },
    { name: "Agents", icon: Users, path: "/agents" },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <nav className="flex flex-col mt-4">
          {navItems.map(({ name, icon: Icon, path }) => (
            <Link key={path} to={path} onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className={`w-full justify-start px-6 py-3 ${
                  pathname === path ? "bg-muted text-primary" : ""
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {name}
              </Button>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
