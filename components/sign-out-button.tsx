"use client"


import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-destructive">
      <LogOut className="h-4 w-4" />
      Sign Out
    </DropdownMenuItem>
  )
}
