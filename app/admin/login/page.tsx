"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Shield } from "lucide-react"

export default function AdminLoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Login failed")
            }

            toast.success("Admin login successful")
            router.push("/admin")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-gray-100 p-6 md:p-10 dark:bg-zinc-950">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">Admin Portal</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl text-card-foreground">Admin Login</CardTitle>
                            <CardDescription>
                                Enter your credentials to access the admin dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin}>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@example.com"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Authenticating..." : "Login"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
