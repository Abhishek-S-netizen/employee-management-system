const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    /**
     * Sends an email via Nodemailer containing the downloadable PDF link.
     */
    static async sendOfferLetterEmail(userEmail, userName, pdfLink) {
        // Support for both "Service" (Gmail) and "Custom SMTP" (Mailtrap)
        const transportConfig = process.env.SMTP_HOST
            ? {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                auth: {
                    user: process.env.SMTP_EMAIL,
                    pass: process.env.SMTP_PASSWORD
                }
            }
            : {
                service: process.env.SMTP_SERVICE || 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            };

        const transporter = nodemailer.createTransport(transportConfig);

        const mailOptions = {
            from: process.env.FROM_NAME,
            to: userEmail,
            subject: 'Your Official Offer Letter',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Congratulations, ${userName}!</h2>
                    <p>We are thrilled to officially extend an offer for you to join our team.</p>
                    <p>You can view and download your full, personalized offer letter by clicking the link below:</p>
                    <p style="margin: 25px 0;">
                        <a href="${pdfLink}" style="padding: 12px 20px; background-color: #205493; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View Offer Letter
                        </a>
                    </p>
                    <p>If the button doesn't work, copy and paste this link safely into your browser:<br>
                    <a href="${pdfLink}">${pdfLink}</a></p>
                    <br>
                    <p>Welcome aboard!</p>
                    <p>Best Regards,</p>
                    <p><b>Human Resources</b></p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    }
}

module.exports = EmailService;
