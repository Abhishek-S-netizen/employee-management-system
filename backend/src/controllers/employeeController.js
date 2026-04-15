const bcrypt = require('bcrypt');
const pool = require('../config/db');
const UserRepository = require('../repositories/userRepository');
const RoleRepository = require('../repositories/roleRepository');
const OfferLetterRepository = require('../repositories/offerLetterRepository');
const PdfService = require('../services/pdfService');
const UploadService = require('../services/uploadService');
const EmailService = require('../services/emailService');
const OfferLetterOrchestrator = require('../orchestrators/offerLetterOrchestrator');

const appointEmployee = async (req, res) => {
    // Phase 1: Heavy I/O Validation & Fast Database Transaction Sequence
    const { name, email, role, type, title, start_date, end_date, password } = req.body;

    // Basic Validation Strategy
    if (!name || !email || !role || !type || !title || !start_date || !password) {
        return res.status(400).json({ error: 'Missing required configuration fields, including password.' });
    }

    if (type !== 'employee' && type !== 'intern') {
        return res.status(400).json({ error: 'System constraint: type must be either employee or intern.' });
    }

    if (type === 'intern' && !end_date) {
        return res.status(400).json({ error: 'System constraint: Interns must have a defined end date.' });
    }

    // Connect to Database Pool
    const client = await pool.connect();

    try {
        // --- [ DB TRANSACTION SCOPE START ] ---
        await client.query('BEGIN');

        // 1. Core Entry - Prepares Code and Link automatically via Sequence logic
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await UserRepository.insertUser(client, {
            name, email, role, type, title, start_date, end_date, password: hashedPassword
        });

        // 2. Auxiliary Entry - Prepares the Null placeholder in advance
        const offerLetter = await OfferLetterRepository.insertPlaceholder(client, newUser.id);

        await client.query('COMMIT');
        // --- [ DB TRANSACTION SCOPE END ] ---

        // ====================================================================
        // PHASE 2: Asynchronous Post-Commit Processing
        // ====================================================================
        // Hand off to the Orchestrator. We do NOT await this background task.
        OfferLetterOrchestrator.processOfferLetter(newUser);

        // Phase 1 Response -> Acknowledges state safely locked in Postgres.
        return res.status(201).json({
            message: 'User registered successfully. Post-commit processing queued.',
            user: {
                id: newUser.id,
                name: newUser.name,
                employee_code: newUser.employee_code,
                employee_code_link: newUser.employee_code_link
            },
            offerLetterPlaceholderId: offerLetter.id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Critical Transaction Failure:', error);

        // Catch Postgres Duplicate Unique Constraint Violation
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Conflict: This email address is already in the system.' });
        }
        res.status(500).json({ error: 'Internal server error while resolving transaction sequence.' });
    } finally {
        // Always release the client back to the pool
        client.release();
    }
};

const getAllEmployees = async (req, res) => {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const client = await pool.connect();
    try {
        const result = await UserRepository.getUsersPaginated(client, page, limit, search, role);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    } finally {
        client.release();
    }
};

const deleteEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const success = await UserRepository.deleteUserByCode(client, req.params.code);
        if (!success) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete error', error);
        res.status(500).json({ error: 'Failed to delete' });
    } finally {
        client.release();
    }
};

const updateEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const user = await UserRepository.updateUserByCode(client, req.params.code, req.body);
        if (!user) return res.status(404).json({ error: 'Employee not found' });
        res.status(200).json({ message: 'Employee updated', user });
    } catch (error) {
        console.error('Update error', error);
        res.status(500).json({ error: 'Failed to update' });
    } finally {
        client.release();
    }
};

const getEmployeeOfferLetter = async (req, res) => {
    const client = await pool.connect();
    try {
        const link = await UserRepository.getOfferLetterByCode(client, req.params.code);
        if (!link) return res.status(404).json({ error: 'Link pending or missing' });
        res.status(200).json({ link });
    } catch (error) {
        console.error('Fetch link error', error);
        res.status(500).json({ error: 'Failed to fetch link' });
    } finally {
        client.release();
    }
};

const getPublicEmployeeDetails = async (req, res) => {
    const client = await pool.connect();
    try {
        const user = await UserRepository.getUserByCode(client, req.params.code);
        if (!user) return res.status(404).json({ error: 'Employee record not found or inaccessible.' });

        // Return only non-sensitive data
        res.status(200).json(user);
    } catch (error) {
        console.error('Fetch public details error', error);
        res.status(500).json({ error: 'Internal server error while verifying certificate.' });
    } finally {
        client.release();
    }
};

const updatePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { code } = req.params;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords are required.' });
    }

    const client = await pool.connect();
    try {
        const storedHash = await UserRepository.getUserPasswordByCode(client, code);
        if (!storedHash) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, storedHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Verification failed: Current password does not match.' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await UserRepository.updateUserPassword(client, code, newHashedPassword);

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error', error);
        res.status(500).json({ error: 'Failed to update password.' });
    } finally {
        client.release();
    }
};

const retryOfferLetter = async (req, res) => {
    const client = await pool.connect();
    try {
        const user = await UserRepository.getUserByCode(client, req.params.code);
        if (!user) return res.status(404).json({ error: 'Employee not found' });

        // Hand off to the Orchestrator
        OfferLetterOrchestrator.processOfferLetter(user);

        res.status(200).json({ message: 'Retry initiated. Background process started.' });
    } catch (error) {
        console.error('Retry error', error);
        res.status(500).json({ error: 'Failed to initiate retry' });
    } finally {
        client.release();
    }
};

module.exports = {
    appointEmployee,
    getAllEmployees,
    deleteEmployee,
    updateEmployee,
    updatePassword,
    getEmployeeOfferLetter,
    getPublicEmployeeDetails,
    retryOfferLetter,
    getRoles: async (req, res) => {
        try {
            const roles = await RoleRepository.getAllRoles(pool);
            res.json(roles);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch roles.' });
        }
    },
    addRole: async (req, res) => {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Role name is required.' });
        try {
            const newRole = await RoleRepository.insertRole(pool, name);
            res.status(201).json(newRole);
        } catch (err) {
            res.status(400).json({ error: 'Role already exists or invalid data.' });
        }
    },
    deleteRole: async (req, res) => {
        try {
            const deleted = await RoleRepository.deleteRole(pool, req.params.id);
            if (!deleted) return res.status(404).json({ error: 'Role not found.' });
            res.json({ message: 'Role deleted.' });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete role.' });
        }
    },
    updateRole: async (req, res) => {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Role name is required.' });
        try {
            const updated = await RoleRepository.updateRole(pool, req.params.id, name);
            if (!updated) return res.status(404).json({ error: 'Role not found.' });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: 'Failed to update role.' });
        }
    }
};
