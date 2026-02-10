import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
})

export const sendData = async (to: string, subject: string, html: string) => {
    try {
        const info = await transporter.sendMail({
            from: `"ShipsPro" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        })
        console.log("Message sent: %s", info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error }
    }
}

interface OrderItem {
    product_name: string
    quantity: number
    price: number
}

export const sendOrderNotification = async (
    orderId: string,
    userEmail: string,
    items: OrderItem[],
    total: number,
    paymentMethod: string
) => {
    console.log(`Preparing to send order notification to ${process.env.ORDER_NOTIFICATION_EMAIL || 'Shipspro.orders@gmail.com'}...`)
    const orderItemsHtml = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product_name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.price.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('')

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Received</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">New Order Received</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px;">
                    <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 25px;">
                        <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">Order Details</h2>
                        <p style="margin: 5px 0; color: #4b5563;"><strong>Order ID:</strong> ${orderId}</p>
                        <p style="margin: 5px 0; color: #4b5563;"><strong>Customer Email:</strong> ${userEmail}</p>
                        <p style="margin: 5px 0; color: #4b5563;"><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</p>
                        <p style="margin: 5px 0; color: #4b5563;"><strong>Order Date:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <h3 style="color: #1f2937; margin-bottom: 15px;">Order Items</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #d1d5db;">Product</th>
                                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #d1d5db;">Qty</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #d1d5db;">Price</th>
                                <th style="padding: 12px; text-align: right; border-bottom: 2px solid #d1d5db;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderItemsHtml}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f9fafb;">
                                <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                                <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px; color: #667eea;">$${total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 20px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            <strong>⚠️ Action Required:</strong> Please process this order and prepare for shipment.
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                        ShipsPro - Global Air Cargo<br>
                        This is an automated notification email.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `

    const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL || 'Shipspro.orders@gmail.com'

    return await sendData(
        notificationEmail,
        `New Order #${orderId} - ${userEmail}`,
        html
    )
}

export const sendPasswordResetOTP = async (email: string, otp: string) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Reset Password</h1>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #4b5563; font-size: 16px;">Hello,</p>
                    <p style="color: #4b5563; font-size: 16px;">
                        You have requested to reset your password. Please use the following One-Time Password (OTP) to proceed.
                    </p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${otp}</span>
                    </div>
                    <p style="color: #4b5563; font-size: 14px;">
                        This code will expire in 10 minutes. If you did not request this, please ignore this email.
                    </p>
                </div>
                <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">ShipsPro Security Team</p>
                </div>
            </div>
        </body>
        </html>
    `
    return await sendData(email, "Reset Your Password - ShipsPro", html)
}
