
const PLISIO_API_URL = "https://api.plisio.net/api/v1"
const API_KEY = process.env.PLISIO_SECRET_KEY

export async function createInvoice(params: {
    amount: number
    source_currency: string
    order_number: string
    order_name: string
    callback_url?: string
    email?: string
    currency?: string
}) {
    if (!API_KEY) {
        throw new Error("PLISIO_SECRET_KEY is not defined")
    }

    const queryParams = new URLSearchParams({
        api_key: API_KEY,
        source_currency: params.source_currency,
        source_amount: params.amount.toString(),
        order_number: params.order_number,
        order_name: params.order_name,
        currency: params.currency || "USDT_TRX", // Default to USDT on TRON
        callback_url: params.callback_url || "",
        email: params.email || "",
    })

    // Add keys if we want to valid

    const res = await fetch(`${PLISIO_API_URL}/invoices/new?${queryParams.toString()}`)

    if (!res.ok) {
        const errorText = await res.text()
        console.error("Plisio API Error:", errorText)
        throw new Error(`Plisio API failed: ${res.statusText}`)
    }

    const data = await res.json()

    if (data.status !== "success") {
        console.error("Plisio Error Response:", data)
        throw new Error(data.data?.message || "Failed to create invoice")
    }

    return data.data
}
