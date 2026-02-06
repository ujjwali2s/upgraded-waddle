"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile/get")
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        const data = await res.json()
        if (res.ok) {
          setEmail(data.email || "")
          setFullName(data.full_name || "")
          setUsername(data.username || "")
        }
      } catch (error) {
        toast.error("Failed to load profile.")
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadProfile()
  }, [router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username })
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Profile updated successfully")
        router.refresh()
      } else {
        toast.error(data.error || "Update failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingPassword(true)

    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match")
      setIsLoadingPassword(false)
      return
    }

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()

      if (res.ok) {
        toast.success("Password updated successfully. Please login again.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmNewPassword("")

        // Sign out
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/auth/login")
      } else {
        toast.error(data.error || "Password update failed")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoadingPassword(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">
          Update your personal information.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Personal Information</CardTitle>
            <CardDescription>Update your name and username</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
              />
            </div>
            <Button type="submit" className="w-fit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
            <User className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-card-foreground">Security</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="********"
                required
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-fit"
              disabled={isLoadingPassword}
            >
              {isLoadingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
