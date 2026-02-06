"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ProductSearchProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export function ProductSearch({ onSearch, placeholder = "Search products..." }: ProductSearchProps) {
    const [query, setQuery] = React.useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)
        onSearch(value)
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleChange}
                className="pl-9"
            />
        </div>
    )
}
