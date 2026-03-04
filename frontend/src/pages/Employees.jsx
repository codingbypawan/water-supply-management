import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [resettingId, setResettingId] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/employees', { params: { page, limit: 20 } });
      const body = res.data;
      setEmployees(Array.isArray(body.data) ? body.data : []);
      setPagination(body.pagination || { page: 1, limit: 20, total: body.data?.length || 0, totalPages: 1 });
    } catch {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData) => {
    try {
      if (editEmp) {
        await api.put(`/employees/${editEmp.id}`, formData);
        toast.success('Employee updated');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee added');
      }
      setShowForm(false);
      setEditEmp(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save');
    }
  };

  const handleResetPassword = async (emp) => {
    if (!window.confirm(`Reset password for ${emp.name} to their phone number (${emp.phone})?`)) return;
    setResettingId(emp.id);
    try {
      await api.post(`/employees/${emp.id}/reset-password`);
      toast.success(`Password reset to ${emp.phone}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to reset password');
    } finally {
      setResettingId(null);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role', render: (val) => <span className="capitalize">{val?.replace('_', ' ')}</span> },
    { key: 'salary_amount', label: 'Salary', render: (val) => val ? `₹${Number(val).toLocaleString()}` : '—' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          val === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>{val}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); setEditEmp(row); setShowForm(true); }}
            className="text-brand-primary hover:underline text-sm">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); handleResetPassword(row); }}
            disabled={resettingId === row.id}
            className="text-orange-600 hover:underline text-sm disabled:opacity-50">
            {resettingId === row.id ? 'Resetting...' : 'Reset Pwd'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Employees</h2>
        <button onClick={() => { setEditEmp(null); setShowForm(true); }}
          className="px-3 py-2 md:px-4 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex-shrink-0">
          + Add
        </button>
      </div>
      <DataTable columns={columns} data={employees} loading={loading}
        emptyMessage="No employees found" pagination={pagination} onPageChange={(p) => load(p)}
        mobileCard={(row) => (
          <div>
            <div className="flex items-center justify-between" onClick={() => { setEditEmp(row); setShowForm(true); }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                  {row.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{row.name}</p>
                  <p className="text-xs text-gray-400">{row.phone}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <span className="capitalize text-xs text-gray-600">{row.role?.replace('_',' ')}</span>
                {row.salary_amount && <p className="text-xs font-semibold text-gray-900">₹{Number(row.salary_amount).toLocaleString()}</p>}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{row.status}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
              <button onClick={() => { setEditEmp(row); setShowForm(true); }}
                className="text-brand-primary text-xs font-medium">Edit</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => handleResetPassword(row)}
                disabled={resettingId === row.id}
                className="text-orange-600 text-xs font-medium disabled:opacity-50">
                {resettingId === row.id ? 'Resetting...' : '🔑 Reset Password'}
              </button>
            </div>
          </div>
        )}
      />
      {showForm && (
        <EmployeeModal employee={editEmp} onClose={() => { setShowForm(false); setEditEmp(null); }} onSave={handleSave} />
      )}
    </div>
  );
}

function EmployeeModal({ employee, onClose, onSave }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    phone: employee?.phone || '',
    role: employee?.role || 'employee',
    salary_amount: employee?.salary_amount || '',
    address: employee?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{employee ? 'Edit Employee' : 'New Employee'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                <option value="employee">Employee</option>
                <option value="plant_admin">Plant Admin</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input type="number" value={form.salary_amount} onChange={(e) => setForm({ ...form, salary_amount: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
