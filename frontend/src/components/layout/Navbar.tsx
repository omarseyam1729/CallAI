import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export default function Navbar() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Phone className="h-6 w-6" />
          <span className="text-xl font-bold">CallAI</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}

