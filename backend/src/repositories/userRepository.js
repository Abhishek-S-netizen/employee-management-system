class UserRepository {
    /**
     * Inserts a user and generates their exact employee code within the transaction.
     * By using PostgreSQL sequences directly, we avoid UNIQUE constraint violations 
     * common with temporary placeholder values in highly concurrent environments.
     */
    static async insertUser(client, userData) {
        const { name, email, role, type, title, start_date } = userData;
        const end_date = userData.end_date === '' ? null : userData.end_date;

        // 1. Pre-fetch the next ID from the sequence to generate the code safely
        const seqResult = await client.query(`SELECT nextval('users_id_seq')`);
        const nextId = seqResult.rows[0].nextval;

        // 2. Format the custom Employee/Intern Code
        const prefix = type === 'employee' ? 'E' : 'IN';
        const paddedId = String(nextId).padStart(3, '0');
        const employeeCode = `${prefix}${paddedId}`;

        // 3. Generate the future-ready URL for the QR code
        const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const employeeCodeLink = `${siteUrl}/verify/${employeeCode}`;

        // 4. Insert all finalized data in a single transactional query
        const query = `
            INSERT INTO users (id, name, email, role, type, title, start_date, end_date, employee_code, employee_code_link, offer_letter_status, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
            RETURNING *;
        `;
        const values = [nextId, name, email, role, type, title, start_date, end_date, employeeCode, employeeCodeLink, userData.password];

        const result = await client.query(query, values);
        return result.rows[0];
    }

    /**
     * Fetches paginated users from the database.
     */
    static async getUsersPaginated(client, page = 1, limit = 10, search = '', filterRole = '') {
        const offset = (page - 1) * limit;

        let conditions = [];
        let searchParams = [];

        if (search) {
            searchParams.push(`%${search}%`);
            conditions.push(`(name ILIKE $${searchParams.length} OR email ILIKE $${searchParams.length} OR employee_code ILIKE $${searchParams.length})`);
        }
        if (filterRole) {
            searchParams.push(filterRole);
            conditions.push(`role ILIKE $${searchParams.length}`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const mainValues = [...searchParams, limit, offset];

        const query = `
            SELECT id, name, email, role, title, type, employee_code, start_date, end_date, offer_letter_status
            FROM users
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${searchParams.length + 1} OFFSET $${searchParams.length + 2};
        `;
        const countQuery = `SELECT COUNT(*) FROM users ${whereClause};`;

        const [usersResult, countResult] = await Promise.all([
            client.query(query, mainValues),
            client.query(countQuery, searchParams)
        ]);

        return {
            users: usersResult.rows,
            total: parseInt(countResult.rows[0].count, 10),
            page: parseInt(page, 10),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit)
        };
    }

    static async deleteUserByCode(client, employeeCode) {
        // Requires deleting offer_letter first to respect foreign keys
        const userResult = await client.query('SELECT id FROM users WHERE employee_code = $1', [employeeCode]);
        if (userResult.rows.length === 0) return false;

        await client.query('DELETE FROM offer_letters WHERE user_id = $1', [userResult.rows[0].id]);
        await client.query('DELETE FROM users WHERE id = $1', [userResult.rows[0].id]);
        return true;
    }

    static async updateUserByCode(client, employeeCode, updates) {
        // Utilizing COALESCE protects from nullifying fields accidentally if omitted during PUT
        const { name, role, title, type } = updates;
        const query = `
            UPDATE users
            SET name = COALESCE($1, name),
                role = COALESCE($2, role),
                title = COALESCE($3, title),
                type = COALESCE($4, type)
            WHERE employee_code = $5
            RETURNING *;
        `;
        const result = await client.query(query, [name, role, title, type, employeeCode]);
        return result.rows[0];
    }

    static async getOfferLetterByCode(client, employeeCode) {
        const query = `
            SELECT ol.link
            FROM offer_letters ol
            JOIN users u ON ol.user_id = u.id
            WHERE u.employee_code = $1;
        `;
        const result = await client.query(query, [employeeCode]);
        return result.rows[0]?.link || null;
    }

    /**
     * Fetches non-sensitive user details by employee code for public verification.
     */
    static async getUserByCode(client, employeeCode) {
        const query = `
            SELECT name, email, role, type, title, employee_code, start_date, offer_letter_status
            FROM users
            WHERE employee_code = $1;
        `;
        const result = await client.query(query, [employeeCode]);
        return result.rows[0] || null;
    }

    /**
     * Updates the onboarding status of an employee.
     */
    static async updateUserStatus(client, employeeCode, status) {
        const query = `
            UPDATE users 
            SET offer_letter_status = $1
            WHERE employee_code = $2
            RETURNING *;
        `;
        const result = await client.query(query, [status, employeeCode]);
        return result.rows[0];
    }

    /**
     * Fetches only the hashed password for comparison.
     */
    static async getUserPasswordByCode(client, employeeCode) {
        const query = `SELECT password FROM users WHERE employee_code = $1;`;
        const result = await client.query(query, [employeeCode]);
        return result.rows[0]?.password || null;
    }

    /**
     * Updates the password field only.
     */
    static async updateUserPassword(client, employeeCode, hashedPassword) {
        const query = `
            UPDATE users 
            SET password = $1
            WHERE employee_code = $2
            RETURNING id;
        `;
        const result = await client.query(query, [hashedPassword, employeeCode]);
        return result.rows.length > 0;
    }
}

module.exports = UserRepository;
