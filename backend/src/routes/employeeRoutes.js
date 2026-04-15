const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Route for adding a new Employee or Intern
// GET /api/employees (Paginated)
router.get('/', employeeController.getAllEmployees);

// POST /api/employees/appoint
router.post('/appoint', employeeController.appointEmployee);

// Table Controls Routes
router.delete('/:code', employeeController.deleteEmployee);
router.put('/:code', employeeController.updateEmployee);
router.put('/:code/password', employeeController.updatePassword);
router.get('/:code/offer-letter', employeeController.getEmployeeOfferLetter);

// Public Verification Route
router.get('/public/:code', employeeController.getPublicEmployeeDetails);
router.post('/:code/retry', employeeController.retryOfferLetter);

// Role Management
router.get('/roles', employeeController.getRoles);
router.post('/roles', employeeController.addRole);
router.put('/roles/:id', employeeController.updateRole);
router.delete('/roles/:id', employeeController.deleteRole);

module.exports = router;
