import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { key: 'present', label: 'Present', short: 'P', color: 'bg-green-100 text-green-700 border-green-300' },
  { key: 'absent', label: 'Absent', short: 'A', color: 'bg-red-100 text-red-700 border-red-300' },
  { key: 'half_day', label: 'Half Day', short: 'H', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { key: 'leave', label: 'Leave', short: 'L', color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

function getStatusStyle(status) {
  return STATUS_OPTIONS.find((s) => s.key === status)?.color || 'bg-gray-100 text-gray-500';
}

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = ['plant_admin', 'tenant_admin'].includes(user?.role);
  const [tab, setTab] = useState('daily'); // daily | summary
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Attendance</h2>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab('daily')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'daily' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setTab('summary')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'summary' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {tab === 'daily' ? (
        <DailyAttendance date={date} setDate={setDate} isAdmin={isAdmin} />
      ) : (
        <MonthlySummary month={month} setMonth={setMonth} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Daily Attendance — mark attendance for each emp    */
/* ═══════════════════════════════════════════════════ */
function DailyAttendance({ date, setDate, isAdmin }) {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState({}); // { employee_id: { status, notes } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        api.get('/employees', { params: { status: 'active' } }),
        api.get('/attendance', { params: { date } }),
      ]);
      const empList = Array.isArray(empRes.data?.data) ? empRes.data.data : [];
      const attList = Array.isArray(attRes.data?.data) ? attRes.data.data : [];

      setEmployees(empList);

      // Build entries map from existing records
      const map = {};
      for (const emp of empList) {
        const existing = attList.find((a) => a.employee_id === emp.id);
        map[emp.id] = {
          status: existing?.status || '',
          check_in: existing?.check_in || '',
          check_out: existing?.check_out || '',
          notes: existing?.notes || '',
          saved: !!existing,
        };
      }
      setEntries(map);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const updateEntry = (empId, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value, saved: false },
    }));
  };

  const handleSave = async () => {
    const toSave = Object.entries(entries)
      .filter(([, e]) => e.status && !e.saved)
      .map(([employee_id, e]) => ({
        employee_id,
        status: e.status,
        check_in: e.check_in || undefined,
        check_out: e.check_out || undefined,
        notes: e.notes || undefined,
      }));

    if (toSave.length === 0) return toast('No changes to save');

    setSaving(true);
    try {
      await api.post('/attendance/mark', { date, entries: toSave });
      toast.success(`${toSave.length} attendance records saved`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const markAll = (status) => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const empId of Object.keys(next)) {
        if (!next[empId].status) {
          next[empId] = { ...next[empId], status, saved: false };
        }
      }
      return next;
    });
  };

  const unmarkedCount = Object.values(entries).filter((e) => !e.status).length;
  const changedCount = Object.values(entries).filter((e) => e.status && !e.saved).length;

  return (
    <div className="space-y-4">
      {/* Date picker + Quick marks */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        {isAdmin && unmarkedCount > 0 && (
          <button
            onClick={() => markAll('present')}
            className="px-3 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100"
          >
            ✅ Mark All Present
          </button>
        )}
      </div>

      {/* Summary bar */}
      {!loading && employees.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => {
            const count = Object.values(entries).filter((e) => e.status === s.key).length;
            return (
              <span key={s.key} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${s.color}`}>
                {s.short}: {count}
              </span>
            );
          })}
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
            Unmarked: {unmarkedCount}
          </span>
        </div>
      )}

      {/* Employee Attendance Cards */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No active employees found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const entry = entries[emp.id] || {};
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {emp.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.phone}</p>
                    </div>
                  </div>
                  {entry.saved && entry.status && (
                    <span className="text-[10px] text-green-600 font-medium">✓ Saved</span>
                  )}
                </div>

                {/* Status buttons */}
                {isAdmin ? (
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => updateEntry(emp.id, 'status', s.key)}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors border ${
                          entry.status === s.key ? s.color + ' border-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${entry.status ? getStatusStyle(entry.status) : 'bg-gray-50 text-gray-400'}`}>
                      {entry.status ? STATUS_OPTIONS.find((s) => s.key === entry.status)?.label : 'Not marked'}
                    </span>
                  </div>
                )}

                {/* Notes (admin only, shown when status is set) */}
                {isAdmin && entry.status && (
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={entry.notes || ''}
                    onChange={(e) => updateEntry(emp.id, 'notes', e.target.value)}
                    className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {isAdmin && changedCount > 0 && (
        <div className="sticky bottom-20 md:bottom-4 z-20">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-lg"
          >
            {saving ? 'Saving...' : `Save ${changedCount} Attendance Record${changedCount > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Monthly Summary — overview by employee             */
/* ═══════════════════════════════════════════════════ */
function MonthlySummary({ month, setMonth }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/summary', { params: { month } });
      setSummaries(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex-1 min-w-[150px] max-w-xs">
        <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : summaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No attendance data for {month}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => {
            const pct = s.totalDays > 0 ? Math.round((s.present / s.totalDays) * 100) : 0;
            return (
              <div key={s.employee.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {s.employee.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.employee.name}</p>
                      <p className="text-xs text-gray-400">{s.employee.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{pct}%</p>
                    <p className="text-[10px] text-gray-400">{s.markedDays}/{s.totalDays} days</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Stat pills */}
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                    P: {s.present}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                    A: {s.absent}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 text-yellow-700">
                    H: {s.half_day}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                    L: {s.leave}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
