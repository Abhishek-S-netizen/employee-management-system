const pool = require('../config/db');
const PdfService = require('../services/pdfService');
const UploadService = require('../services/uploadService');
const OfferLetterRepository = require('../repositories/offerLetterRepository');
const EmailService = require('../services/emailService');
const UserRepository = require('../repositories/userRepository');

class OfferLetterOrchestrator {
    /**
     * Orchestrates the background workflow for generating and sending an offer letter.
     * Updates the user's offer_letter_status to 'COMPLETED' or 'FAILED'.
     */
    static async processOfferLetter(userData) {
        const employeeCode = userData.employee_code;
        console.log(`[Orchestrator] Starting workflow for ${employeeCode}`);

        const client = await pool.connect();
        try {
            // 1. Mark as PENDING (In case this is a retry)
            await UserRepository.updateUserStatus(client, employeeCode, 'PENDING');

            // 2. Generate local PDF Buffer
            const pdfBuffer = await PdfService.generateOfferLetterPdf(userData);

            // 3. Upload to Cloudinary
            const pdfLink = await UploadService.uploadPdfBuffer(pdfBuffer, employeeCode);

            // 4. Update Offer Letter record in DB
            // We need to find the offer letter record associated with this user
            const userResult = await client.query('SELECT id FROM users WHERE employee_code = $1', [employeeCode]);
            const userId = userResult.rows[0].id;

            const olResult = await client.query('SELECT id FROM offer_letters WHERE user_id = $1', [userId]);
            const offerLetterId = olResult.rows[0].id;

            await OfferLetterRepository.updateLink(client, offerLetterId, pdfLink);

            // 5. Send the Email
            await EmailService.sendOfferLetterEmail(userData.email, userData.name, pdfLink);

            // 6. Finalize as COMPLETED
            await UserRepository.updateUserStatus(client, employeeCode, 'COMPLETED');

            console.log(`[Orchestrator] Success for ${employeeCode}`);
        } catch (error) {
            console.error(`[Orchestrator] Failure for ${employeeCode}:`, error);

            // Mark as FAILED so the UI shows the Retry button
            try {
                await UserRepository.updateUserStatus(client, employeeCode, 'FAILED');
            } catch (statusError) {
                console.error(`[Orchestrator] Error updating failure status for ${employeeCode}:`, statusError);
            }
        } finally {
            client.release();
        }
    }
}

module.exports = OfferLetterOrchestrator;
