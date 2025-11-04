import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"

export default function LoginModal({ open, setOpen }) {
  const [form, setForm] = useState({ username: "", password: "" })

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = () => {
    console.log("Login with:", form)
    setOpen(false)
  }

  const handleRegister = () => {
    console.log("Register new user:", form)
    setOpen(false)
  }

  const handleGoogle = () => {
    console.log("Google OAuth clicked")
    setOpen(false)
  }

  const handleFacebook = () => {
    console.log("Facebook OAuth clicked")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary">
            Welcome Back
          </DialogTitle>
          <DialogDescription>
            Sign in to continue to CallAI
          </DialogDescription>
        </DialogHeader>

        {/* Username + Password */}
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Sign In / Register */}
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button onClick={handleLogin}>Sign In</Button>
          <Button variant="outline" onClick={handleRegister}>
            Register
          </Button>
        </DialogFooter>

        {/* OAuth */}
        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="outline"
            className="flex items-center gap-2 w-full justify-center"
            onClick={handleGoogle}
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with Google
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 w-full justify-center text-blue-600"
            onClick={handleFacebook}
          >
            <FaFacebook className="h-5 w-5" />
            Sign in with Facebook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
