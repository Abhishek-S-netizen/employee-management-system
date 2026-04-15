import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Service to handle employee-related API requests.
 */
const employeeService = {
    /**
     * Fetches public details for an employee by their code.
     * @param {string} code The employee or intern code.
     * @returns {Promise<Object>} The employee details.
     */
    getPublicDetails: async (code) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/employees/public/${code}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching public employee details:', error);
            throw error;
        }
    },

    /**
     * Retries the onboarding process for a failed record.
     * @param {string} code The employee or intern code.
     * @returns {Promise<Object>} Success message.
     */
    retryOnboarding: async (code) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/employees/${code}/retry`);
            return response.data;
        } catch (error) {
            console.error('Error retrying onboarding:', error);
            throw error;
        }
    }
};

export default employeeService;
