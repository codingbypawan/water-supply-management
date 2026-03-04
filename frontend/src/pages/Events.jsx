import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [customers, setCustomers] = useState([]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/events', { params: { page, limit: 20 } });
      const body = res.data;
      setEvents(Array.isArray(body.data) ? body.data : []);
      setPagination(body.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (formData) => {
    try {
      await api.post('/events', formData);
      toast.success('Event created');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create event');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.patch(`/events/${id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const columns = [
    {
      key: 'event_date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN'),
    },
    { key: 'event_type', label: 'Type', render: (val) => <span className="capitalize">{val?.replace('_', ' ')}</span> },
    { key: 'Customer', label: 'Customer', render: (val) => val?.name || '—' },
    { key: 'location', label: 'Location' },
    { key: 'containers_needed', label: 'Containers' },
    { key: 'total_amount', label: 'Amount', render: (val) => `₹${Number(val || 0).toLocaleString()}` },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleStatusUpdate(row.id, e.target.value)}
          className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
            val === 'confirmed' ? 'bg-green-100 text-green-700'
            : val === 'pending' ? 'bg-yellow-100 text-yellow-700'
            : val === 'completed' ? 'bg-blue-100 text-blue-700'
            : 'bg-red-100 text-red-700'
          }`}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Events</h2>
        <button
          onClick={async () => {
            try {
              const res = await api.get('/customers?limit=500');
              setCustomers(Array.isArray(res.data.data) ? res.data.data : []);
            } catch { /* ignore */ }
            setShowForm(true);
          }}
          className="px-3 py-2 md:px-4 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex-shrink-0"
        >
          + New Event
        </button>
      </div>

      <DataTable
        columns={columns}
        data={events}
        loading={loading}
        emptyMessage="No events found"
        pagination={pagination}
        onPageChange={(p) => load(p)}
        mobileCard={(row) => (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-gray-900 text-sm">{row.Customer?.name || '—'}</p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                row.status === 'confirmed' ? 'bg-green-100 text-green-700'
                : row.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                : row.status === 'completed' ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
              }`}>{row.status}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="capitalize">{row.event_type?.replace('_',' ')}</span>
              <span>•</span>
              <span>{new Date(row.event_date).toLocaleDateString('en-IN')}</span>
              {row.location && <><span>•</span><span className="truncate">{row.location}</span></>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-gray-600">{row.containers_needed} containers</span>
              <span className="font-semibold text-gray-900">₹{Number(row.total_amount || 0).toLocaleString()}</span>
            </div>
          </div>
        )}
      />

      {showForm && (
        <EventModal customers={customers} onClose={() => setShowForm(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function EventModal({ customers, onClose, onSave }) {
  const [form, setForm] = useState({
    customer_id: '',
    event_type: 'wedding',
    event_date: '',
    location: '',
    containers_needed: '',
    rate_per_unit: '',
    notes: '',
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">New Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select required value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                <option value="">Select</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                <option value="wedding">Wedding</option>
                <option value="party">Party</option>
                <option value="construction">Construction</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Containers *</label>
              <input type="number" min="1" required value={form.containers_needed} onChange={(e) => setForm({ ...form, containers_needed: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate/unit</label>
              <input type="number" step="0.01" value={form.rate_per_unit} onChange={(e) => setForm({ ...form, rate_per_unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
