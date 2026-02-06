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
