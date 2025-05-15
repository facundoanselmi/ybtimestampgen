import {Service} from "typedi";
import nodemailer from 'nodemailer';
import 'dotenv/config';

@Service()
export class MailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT as unknown as number,
            secure: false, // use STARTTLS
            requireTLS: true, // Require STARTTLS for encryption
            headers: {
                'X-PM-Message-Stream': 'outbound',
            },
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    async sendEmail(
        recipient: string,
        subject: string,
        htmlContent: string,
    ): Promise<void> {
        const message = {
            from: process.env.SMTP_NOREPLY,
            to: recipient,
            subject: subject,
            html: htmlContent,
        };

        try {
            await this.transporter.sendMail(message);
        } catch (e) {
            console.error(`Failed to send email: ${(e as Error).message}`);
        }
    }
    async sendEmailVerification(email: string, token: string): Promise<void> {
        const subject = 'Verify your email';
        const htmlContent = `
      <p>Click <a href="${process.env.API_URL}/auth/verify-email/${token}">here</a> to verify your email.</p>
    `;

        await this.sendEmail(email, subject, htmlContent);
    }

    async sendPasswordReset(email: string, token: string): Promise<void> {
        const subject = 'Reset your password';
        const htmlContent = `
      <p>Click <a href="${process.env.WEB_URL}/reset-password/${token}">here</a> to reset your password.</p>
    `;

        await this.sendEmail(email, subject, htmlContent);
    }
}
