const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/tenants', require('./tenant.routes'));
router.use('/plants', require('./plant.routes'));
router.use('/users', require('./user.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/distributions', require('./distribution.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/events', require('./event.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/salaries', require('./salary.routes'));
router.use('/subscriptions', require('./subscription.routes'));
router.use('/reports', require('./report.routes'));
router.use('/employee-reports', require('./employeeReport.routes'));
router.use('/rates', require('./rate.routes'));
router.use('/customer-portal', require('./customerPortal.routes'));

module.exports = router;
