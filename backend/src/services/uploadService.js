const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class UploadService {
    /**
     * Uploads a Buffer to Cloudinary as a RAW PDF file.
     * Returns the secure public URL link.
     */
    static async uploadPdfBuffer(pdfBuffer, fileName) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'offer_letters',
                    resource_type: 'raw', // 'raw' is critical for PDFs so they can be downloaded/viewed
                    public_id: fileName,    // e.g. E001 or IN005
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            
            // Convert Node buffer to a readable stream and pipe to cloudinary
            streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
        });
    }
}

module.exports = UploadService;
