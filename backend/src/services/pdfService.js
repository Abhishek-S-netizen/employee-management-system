const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const QrService = require('./qrService');

class PdfService {
    /**
     * Converts an HTML template to a PDF Buffer using Puppeteer.
     */
    static async generateOfferLetterPdf(userData) {
        // 1. Select Template based on type
        const templateName = userData.type === 'employee' ? 'offerLetterEmployee.html' : 'offerLetterIntern.html';
        const templatePath = path.join(__dirname, '../templates', templateName);

        // 2. Read HTML content
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // 3. Generate QR Code for the Public ID Card link
        // Link format: {BASE_URL}/verify/{employee_code}
        const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrContent = `${siteUrl}/verify/${userData.employee_code}`;
        const qrCodeDataUrl = await QrService.generateDataUrl(qrContent);

        // 4. Inject dynamic variables using Regex replacements
        const variables = {
            current_date: new Date().toLocaleDateString(),
            name: userData.name,
            title: userData.title,
            employee_code: userData.employee_code,
            start_date: new Date(userData.start_date).toLocaleDateString(),
            end_date: userData.end_date ? new Date(userData.end_date).toLocaleDateString() : 'N/A',
            qr_code: qrCodeDataUrl
        };

        for (const [key, value] of Object.entries(variables)) {
            // Replace all instances of {{key}}
            const regex = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(regex, value);
        }

        // 4. Puppeteer PDF Generation
        const browser = await puppeteer.launch({
            // Optimized flags for server environments
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();

        // Load the injected HTML content. networkidle0 ensures CSS is fully loaded.
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        await browser.close();

        return pdfBuffer;
    }
}

module.exports = PdfService;
