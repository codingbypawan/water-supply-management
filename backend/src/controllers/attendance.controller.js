const { Attendance, Employee } = require('../models');
const ApiResponse = require('../utils/response');
const { Op } = require('sequelize');

/**
 * Get attendance for a date (or date range). Returns all employees with their status.
 */
exports.list = async (req, res, next) => {
  try {
    const { date, startDate, endDate, employee_id } = req.query;
    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    if (date) {
      where.date = date;
    } else if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    if (employee_id) where.employee_id = employee_id;

    const records = await Attendance.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name', 'phone'] }],
      order: [['date', 'DESC'], ['created_at', 'ASC']],
    });

    return ApiResponse.success(res, records);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark / update attendance for one or more employees on a given date.
 * Body: { date, entries: [{ employee_id, status, check_in, check_out, notes }] }
 */
exports.mark = async (req, res, next) => {
  try {
    const plantId = req.user.plantId;
    if (!plantId) return ApiResponse.badRequest(res, 'Plant context required');

    const { date, entries } = req.body;
    if (!date) return ApiResponse.badRequest(res, 'Date is required');
    if (!Array.isArray(entries) || entries.length === 0) {
      return ApiResponse.badRequest(res, 'At least one attendance entry is required');
    }

    const results = [];
    for (const entry of entries) {
      const { employee_id, status, check_in, check_out, notes } = entry;
      if (!employee_id || !status) continue;

      // Verify employee belongs to same tenant
      const emp = await Employee.findOne({
        where: { id: employee_id, tenant_id: req.user.tenantId },
      });
      if (!emp) continue;

      // Upsert — update if already exists for this employee+date
      const [record, created] = await Attendance.findOrCreate({
        where: { employee_id, date },
        defaults: {
          tenant_id: req.user.tenantId,
          plant_id: plantId,
          employee_id,
          date,
          status,
          check_in: check_in || null,
          check_out: check_out || null,
          notes: notes || null,
          marked_by: req.user.id,
        },
      });

      if (!created) {
        await record.update({
          status,
          check_in: check_in || record.check_in,
          check_out: check_out || record.check_out,
          notes: notes !== undefined ? notes : record.notes,
          marked_by: req.user.id,
        });
      }

      results.push(record);
    }

    return ApiResponse.success(res, results, `${results.length} attendance records saved`);
  } catch (error) {
    next(error);
  }
};

/**
 * Monthly summary: per-employee count of present, absent, half_day, leave days
 */
exports.summary = async (req, res, next) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return ApiResponse.badRequest(res, 'Valid month (YYYY-MM) is required');
    }

    const where = { tenant_id: req.user.tenantId };
    if (req.user.plantId) where.plant_id = req.user.plantId;

    // Get all employees for the plant
    const empWhere = { tenant_id: req.user.tenantId, status: 'active' };
    if (req.user.plantId) empWhere.plant_id = req.user.plantId;
    const employees = await Employee.findAll({ where: empWhere, order: [['name', 'ASC']] });

    // Get month boundaries
    const [year, mon] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const records = await Attendance.findAll({
      where: { ...where, date: { [Op.between]: [startDate, endDate] } },
    });

    // Build per-employee map
    const byEmployee = {};
    for (const r of records) {
      if (!byEmployee[r.employee_id]) {
        byEmployee[r.employee_id] = { present: 0, absent: 0, half_day: 0, leave: 0 };
      }
      byEmployee[r.employee_id][r.status] = (byEmployee[r.employee_id][r.status] || 0) + 1;
    }

    const summaries = employees.map((emp) => {
      const counts = byEmployee[emp.id] || { present: 0, absent: 0, half_day: 0, leave: 0 };
      return {
        employee: { id: emp.id, name: emp.name, phone: emp.phone },
        ...counts,
        totalDays: lastDay,
        markedDays: counts.present + counts.absent + counts.half_day + counts.leave,
      };
    });

    return ApiResponse.success(res, summaries);
  } catch (error) {
    next(error);
  }
};
