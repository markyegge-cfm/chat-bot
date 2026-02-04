import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

interface EscalationEmailData {
    userEmail: string;
    question: string;
    sessionId: string;
    conversationHistory: any[];
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isConfigured = false;

    constructor() {
        this.init();
    }

    private init() {
        const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

        if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
            this.transporter = nodemailer.createTransport({
                host: SMTP_HOST,
                port: parseInt(SMTP_PORT),
                secure: parseInt(SMTP_PORT) === 465,
                auth: {
                    user: SMTP_USER,
                    pass: SMTP_PASS,
                },
            });
            this.isConfigured = true;
            console.log('✅ Email Service Initialized');
        } else {
            console.warn('⚠️ Email Service not configured. Check SMTP environment variables.');
        }
    }

    async sendEscalationNotification(data: EscalationEmailData) {
        if (!this.isConfigured || !this.transporter) {
            console.warn('📧 Cannot send email: SMTP not configured');
            return;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error('❌ ADMIN_EMAIL not set in environment');
            return;
        }

        const { userEmail, question, sessionId, conversationHistory } = data;

        // Create a text version of history for attachment
        const historyText = conversationHistory.map(m =>
            `${m.sender.toUpperCase()}: ${m.content} [${new Date(m.timestamp).toLocaleString()}]`
        ).join('\n\n');

        const mailOptions = {
            from: `"ChatBot Support" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            subject: `🚨 New Escalation: ${userEmail}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #E5A000;">New Escalation Request</h2>
                    <p>A user has requested human assistance.</p>
                    <hr/>
                    <p><strong>User Email:</strong> ${userEmail}</p>
                    <p><strong>Session ID:</strong> ${sessionId}</p>
                    <p>The full conversation history is attached to this email.</p>
                    <br/>
                    <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin/index.html#conversations/${sessionId}" 
                       style="background: #E5A000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                       View Session in Admin Dashboard
                    </a>
                </div>
            `,
            attachments: [
                {
                    filename: `chat_history_${sessionId}.txt`,
                    content: historyText
                }
            ]
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Escalation email sent to ${adminEmail}`);
        } catch (error) {
            console.error('❌ Failed to send escalation email:', error);
        }
    }

    async sendPasswordResetEmail(email: string, resetLink: string) {
        if (!this.isConfigured || !this.transporter) {
            console.error('❌ Cannot send password reset email: SMTP not configured');
            console.error('Missing environment variables. Check: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
            return false;
        }

        console.log(`📧 Preparing password reset email for: ${email}`);
        console.log(`📧 SMTP Config - Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}, User: ${process.env.SMTP_USER}`);

        const mailOptions = {
            from: `"ChatBot Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `🔐 Reset Your Password`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                         <h2 style="color: #E5A000;">Password Reset Request</h2>
                    </div>
                    <p>Hello,</p>
                    <p>We received a request to reset your password for the Admin Dashboard. Click the button below to set a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background: #E5A000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                           Reset Password
                        </a>
                    </div>
                    <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
                    <p style="font-size: 12px; color: #999;">
                        If you're having trouble clicking the button, copy and paste this link into your browser:<br/>
                        <a href="${resetLink}" style="color: #E5A000;">${resetLink}</a>
                    </p>
                </div>
            `
        };

        try {
            console.log('📧 Sending password reset email...');
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent successfully to ${email}`);
            console.log(`📧 Message ID: ${info.messageId}`);
            return true;
        } catch (error: any) {
            console.error('❌ Failed to send password reset email:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                response: error.response
            });
            return false;
        }
    }
}

export const emailService = new EmailService();
export default emailService;
