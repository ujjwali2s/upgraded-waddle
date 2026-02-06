"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import Link from "next/link"

export default function VerifyPage() {
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const router = useRouter()

    useEffect(() => {
        const stored = localStorage.getItem("shipspro-email")
        if (stored) setEmail(stored)
    }, [])

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        if (!email) {
            toast.error("Email not found. Please sign up again.")
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Verification failed")
            }

            toast.success("Email verified successfully! Please login.")
            localStorage.removeItem("shipspro-email") // Cleanup
            router.push("/auth/login")
            router.refresh()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleResend = async () => {
        if (!email) {
            toast.error("Email not found")
            return
        }
        try {
            const res = await fetch("/api/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })
            if (!res.ok) throw new Error("Failed to send OTP")
            toast.success("OTP resent successfully")
        } catch (error) {
            toast.error("Failed to resend OTP")
        }
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <Link href="/" className="flex items-center gap-2">
                            <img
                                src="/images/logo.png"
                                alt="ShipsPro Logo"
                                className="h-12 w-12 rounded-full"
                            />
                        </Link>
                        <h1 className="text-xl font-bold text-foreground">ShipsPro</h1>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl text-card-foreground">Verify Email</CardTitle>
                            <CardDescription>
                                Enter the 6-digit code sent to your email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleVerify}>
                                <div className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="otp">Verification Code</Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="123456"
                                            required
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            maxLength={6}
                                            className="text-center text-lg tracking-widest"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Verifying..." : "Verify Account"}
                                    </Button>
                                </div>
                                <div className="mt-4 text-center text-sm text-muted-foreground">
                                    Didn't receive the code?{" "}
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        Resend
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
