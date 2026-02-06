import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
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
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-card-foreground">
                Check your email
              </CardTitle>
              <CardDescription>
                We sent you a confirmation link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Please check your email to confirm your account before signing
                in. Once confirmed, you can log in and start using ShipsPro.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
