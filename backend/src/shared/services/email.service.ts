import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';
import { logger } from '../utils/logger.js';

// Create transporter - using SendGrid or SMTP
const createTransporter = () => {
  // Check if SendGrid API key is provided
  if (config.email.sendgridApiKey) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: config.email.sendgridApiKey,
      },
    });
  }

  // Fallback to console logging in development
  if (config.env === 'development') {
    return {
      sendMail: async (options: any) => {
        logger.info({ to: options.to, subject: options.subject, html: options.html }, 'Dev email (not sent)');
        return { messageId: 'dev-' + Date.now() };
      },
    };
  }

  throw new Error('Email service not configured. Set SENDGRID_API_KEY or configure SMTP.');
};

let transporter: any;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  static async sendEmail(options: EmailOptions) {
    const transport = getTransporter();
    await transport.sendMail({
      from: `DevConnect <${config.email.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Verify your DevConnect email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin: 0 0 24px 0; font-size: 28px;">DevConnect</h1>
            <h2 style="color: #111827; margin: 0 0 16px 0;">Verify your email address</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thanks for signing up for DevConnect! Please click the button below to verify your email address.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Verify Email
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
              ${verificationUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    await this.sendEmail({
      to: email,
      subject: 'Reset your DevConnect password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin: 0 0 24px 0; font-size: 28px;">DevConnect</h1>
            <h2 style="color: #111827; margin: 0 0 16px 0;">Reset your password</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #2563eb; font-size: 14px; word-break: break-all;">
              ${resetUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
    });
  }

  static async sendWelcomeEmail(email: string, displayName: string) {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to DevConnect!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h1 style="color: #2563eb; margin: 0 0 24px 0; font-size: 28px;">DevConnect</h1>
            <h2 style="color: #111827; margin: 0 0 16px 0;">Welcome, ${displayName}!</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your account has been verified and you're all set to start connecting with developers worldwide!
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Here are some things you can do:
            </p>
            <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
              <li>Share your coding journey and projects</li>
              <li>Connect with fellow developers</li>
              <li>Share code snippets and get feedback</li>
              <li>Discover trending topics in tech</li>
            </ul>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${config.frontendUrl}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Get Started
              </a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
