// utils/email.js
const nodemailer = require("nodemailer");

class Email {
  constructor(user, otp) {
    this.to = user.email;
    this.firstName = user.first_name || user.name?.split(" ")[0];
    this.otp = otp;
    this.from = `E-SHOP <${process.env.EMAIL_FROM}>`;
  }

  // create the transporter
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // ✅ Production: SendGrid (recommended)
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    // ✅ Development: Mailtrap or Gmail
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // send the actual email
  async send(subject, message) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      text: message, // plain text
      html: `<p>${message}</p>`,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendEmailVerification() {
    const subject = "Your E-SHOP email verification code";
    const message = `Hi ${
      this.firstName || ""
    },\n\nYour verification code is: ${
      this.otp
    }\n\nThis code is valid for 10 minutes.\n\nIf you didn’t request this, please ignore this email.`;
    await this.send(subject, message);
  }

  async sendPasswordReset(url) {
    const subject = "Your password reset link (valid for 10 minutes)";
    const message = `Hi ${
      this.firstName || ""
    },\n\nYou requested a password reset.\nClick the link below to reset your password:\n${url}\n\nIf you didn’t request this, please ignore this email.`;
    await this.send(subject, message);
  }

  async sendWelcome() {
    const subject = "Welcome to E-SHOP!";
    const message = `Hi ${
      this.firstName || ""
    },\n\nWelcome to E-SHOP! We're excited to have you with us.`;
    await this.send(subject, message);
  }
}

module.exports = Email;
