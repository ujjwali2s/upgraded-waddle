"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface OrderActionsProps {
    order: {
        id: string
        status: string
        description?: string | null
    }
}

export function OrderActions({ order }: OrderActionsProps) {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState(order.status)
    const [description, setDescription] = useState(order.description || "")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleUpdate = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/admin/orders/update-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: order.id,
                    status,
                    description,
                }),
            })

            if (!res.ok) {
                throw new Error("Failed to update order")
            }

            toast.success("Order status updated")
            setOpen(false)
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit Order</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Order Status</DialogTitle>
                    <DialogDescription>
                        Change the status of order #{order.id.slice(0, 8)}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                <SelectItem value="refunded">Refunded</SelectItem>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description / Note</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note about this status change..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
