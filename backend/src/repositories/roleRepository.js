class RoleRepository {
    async getAllRoles(client) {
        const query = `
            SELECT id, name 
            FROM roles 
            ORDER BY name ASC
        `;
        const { rows } = await client.query(query);
        return rows;
    }

    async insertRole(client, name) {
        const query = `
            INSERT INTO roles (name) 
            VALUES ($1) 
            RETURNING id, name
        `;
        const { rows } = await client.query(query, [name]);
        return rows[0];
    }

    async deleteRole(client, id) {
        const query = `
            DELETE FROM roles 
            WHERE id = $1
            RETURNING id, name
        `;
        const { rows } = await client.query(query, [id]);
        return rows[0];
    }

    async updateRole(client, id, name) {
        const query = `
            UPDATE roles 
            SET name = $1 
            WHERE id = $2
            RETURNING id, name
        `;
        const { rows } = await client.query(query, [name, id]);
        return rows[0];
    }
}

module.exports = new RoleRepository();
