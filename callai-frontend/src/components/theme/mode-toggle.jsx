import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/useTheme"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
