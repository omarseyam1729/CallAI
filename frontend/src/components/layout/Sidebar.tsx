import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  MessageSquare,
  Phone, 
  Upload, 
  Users, 
  Zap, 
  FolderTree, 
  Search 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/callai', label: 'callAI', icon: MessageSquare },
  { path: '/calls', label: 'Calls', icon: Phone },
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/agents', label: 'Agents', icon: Users },
  { path: '/triggers', label: 'Triggers', icon: Zap },
  { path: '/batch', label: 'Batch', icon: FolderTree },
  { path: '/search', label: 'Search', icon: Search },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-64 border-r bg-card">
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path))
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

