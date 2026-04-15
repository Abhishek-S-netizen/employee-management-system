const QRCode = require('qrcode');

class QrService {
    /**
     * Generates a Base64 Data URL for a given string.
     * @param {string} text The URL or text to encode.
     * @returns {Promise<string>} The Base64 Data URL.
     */
    static async generateDataUrl(text) {
        try {
            // QR Code settings: 
            // - scale: 4 (size)
            // - margin: 1 (border padding)
            // - color: dark blue/black for professionalism
            const dataUrl = await QRCode.toDataURL(text, {
                scale: 4,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            return dataUrl;
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }
}

module.exports = QrService;
