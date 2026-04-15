class OfferLetterRepository {
    /**
     * Inserts a placeholder offer letter record returning the auto-generated code.
     * The cloud link is explicitly set to NULL awaiting the async post-commit upload.
     */
    static async insertPlaceholder(client, userId) {
        // 1. Pre-fetch ID to reliably generate the Offer Letter code
        const seqResult = await client.query(`SELECT nextval('offer_letters_id_seq')`);
        const nextId = seqResult.rows[0].nextval;
        
        const paddedId = String(nextId).padStart(3, '0');
        const offerLetterCode = `OL${paddedId}`;

        // 2. Insert the placeholder row
        const query = `
            INSERT INTO offer_letters (id, user_id, link, offer_letter_code)
            VALUES ($1, $2, NULL, $3)
            RETURNING *;
        `;
        const result = await client.query(query, [nextId, userId, offerLetterCode]);
        return result.rows[0];
    }

    /**
     * Updates an existing placeholder with the actual cloud infrastructure link.
     */
    static async updateLink(client, offerLetterId, cloudLink) {
        const query = `
            UPDATE offer_letters 
            SET link = $1
            WHERE id = $2
            RETURNING *;
        `;
        const result = await client.query(query, [cloudLink, offerLetterId]);
        return result.rows[0];
    }
}

module.exports = OfferLetterRepository;
