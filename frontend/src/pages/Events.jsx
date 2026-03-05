import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [approveEvent, setApproveEvent] = useState(null);

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

  const handleStatusUpdate = async (id, status, extra = {}) => {
    try {
      await api.patch(`/events/${id}/status`, { status, ...extra });
      toast.success('Status updated');
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleApprove = (row) => {
    setApproveEvent(row);
  };

  const columns = [
    {
      key: 'event_date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN'),
    },
    { key: 'event_type', label: 'Type', render: (val) => <span className="capitalize">{val?.replace('_', ' ')}</span> },
    { key: 'customer', label: 'Customer', render: (val, row) => val?.name || row.customer_name || '—' },
    { key: 'location', label: 'Location' },
    {
      key: 'event_rate',
      label: 'Event Rate',
      render: (val, row) => val || row.total_amount
        ? `₹${Number(val || row.total_amount || 0).toLocaleString()}`
        : <span className="text-gray-400 text-xs">Not set</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <select
            value={val}
            onChange={(e) => {
              const newStatus = e.target.value;
              if (newStatus === 'approved' && !row.event_rate && !row.total_amount) {
                handleApprove(row);
              } else {
                handleStatusUpdate(row.id, newStatus);
              }
            }}
            className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
              val === 'approved' ? 'bg-green-100 text-green-700'
              : val === 'pending' ? 'bg-yellow-100 text-yellow-700'
              : val === 'completed' ? 'bg-blue-100 text-blue-700'
              : val === 'contacted' ? 'bg-purple-100 text-purple-700'
              : 'bg-red-100 text-red-700'
            }`}
          >
            <option value="pending">Pending</option>
            <option value="contacted">Contacted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {val === 'pending' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
              className="text-green-600 hover:text-green-700 text-xs font-medium whitespace-nowrap"
            >
              Set Rate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Events</h2>
        <button
          onClick={() => setShowForm(true)}
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
              <p className="font-medium text-gray-900 text-sm">{row.customer?.name || row.customer_name || '—'}</p>
              <select
                value={row.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  if (newStatus === 'approved' && !row.event_rate && !row.total_amount) {
                    handleApprove(row);
                  } else {
                    handleStatusUpdate(row.id, newStatus);
                  }
                }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-0 cursor-pointer ${
                  row.status === 'approved' ? 'bg-green-100 text-green-700'
                  : row.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                  : row.status === 'completed' ? 'bg-blue-100 text-blue-700'
                  : row.status === 'contacted' ? 'bg-purple-100 text-purple-700'
                  : 'bg-red-100 text-red-700'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="capitalize">{row.event_type?.replace('_',' ')}</span>
              <span>•</span>
              <span>{new Date(row.event_date).toLocaleDateString('en-IN')}</span>
              {row.location && <><span>•</span><span className="truncate">{row.location}</span></>}
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-semibold text-gray-900">
                {row.event_rate || row.total_amount
                  ? `₹${Number(row.event_rate || row.total_amount || 0).toLocaleString()}`
                  : <span className="text-gray-400 font-normal">Rate not set</span>}
              </span>
              {(row.status === 'pending' || row.status === 'contacted') && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleApprove(row); }}
                  className="text-green-600 text-xs font-medium"
                >
                  Set Rate & Approve
                </button>
              )}
            </div>
          </div>
        )}
      />

      {showForm && (
        <EventModal onClose={() => setShowForm(false)} onSave={handleAdd} />
      )}

      {approveEvent && (
        <ApproveModal
          event={approveEvent}
          onClose={() => setApproveEvent(null)}
          onApprove={(id, rate) => {
            handleStatusUpdate(id, 'approved', { event_rate: Number(rate) });
            setApproveEvent(null);
          }}
        />
      )}
    </div>
  );
}

/* ═══ Customer Search Hook ═══ */
function useCustomerSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const timerRef = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    setSelected(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q || q.length < 2) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/events/search-customers', { params: { q } });
        setResults(Array.isArray(res.data.data) ? res.data.data : []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
  }, []);

  const select = (customer) => {
    setSelected(customer);
    setQuery(customer.name + ' (' + customer.phone + ')');
    setResults([]);
  };

  const clear = () => {
    setQuery('');
    setSelected(null);
    setResults([]);
  };

  return { query, results, loading, selected, search, select, clear };
}

/* ═══ Event Modal — with customer search ═══ */
function EventModal({ onClose, onSave }) {
  const cs = useCustomerSearch();
  const [form, setForm] = useState({
    event_type: 'wedding',
    event_date: '',
    location: '',
    event_rate: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cs.selected) {
      toast.error('Please search and select a customer');
      return;
    }
    setSaving(true);
    await onSave({
      customer_id: cs.selected.id,
      ...form,
      event_rate: form.event_rate ? Number(form.event_rate) : null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">New Event</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer * (search by name or mobile)</label>
            <div className="relative">
              <input
                type="text"
                value={cs.query}
                onChange={(e) => { cs.search(e.target.value); setShowDropdown(true); }}
                onFocus={() => cs.results.length > 0 && setShowDropdown(true)}
                placeholder="Type name or phone to search..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm pr-8"
              />
              {cs.selected && (
                <button type="button" onClick={() => { cs.clear(); setShowDropdown(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              {cs.loading && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {showDropdown && cs.results.length > 0 && !cs.selected && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {cs.results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { cs.select(c); setShowDropdown(false); }}
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                      {c.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone} {c.address ? `• ${c.address}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && cs.query.length >= 2 && cs.results.length === 0 && !cs.loading && !cs.selected && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-400">
                No customers found for "{cs.query}"
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm">
                <option value="wedding">Wedding</option>
                <option value="party">Party</option>
                <option value="construction">Construction</option>
                <option value="commercial">Commercial</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Rate (₹)</label>
              <input type="number" step="0.01" min="0" value={form.event_rate} onChange={(e) => setForm({ ...form, event_rate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm" placeholder="Set later or now" />
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

/* ═══ Approve Modal — set event rate and approve ═══ */
function ApproveModal({ event, onClose, onApprove }) {
  const [rate, setRate] = useState(event.event_rate || event.total_amount || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rate || Number(rate) <= 0) {
      toast.error('Please enter a valid event rate');
      return;
    }
    setSaving(true);
    await onApprove(event.id, rate);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm sm:mx-4 rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Set Rate & Approve</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Event info */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="font-semibold text-gray-900 text-sm">{event.customer?.name || event.customer_name || '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="capitalize">{event.event_type?.replace('_', ' ')}</span>
              {' • '}{new Date(event.event_date).toLocaleDateString('en-IN')}
              {event.location ? ` • ${event.location}` : ''}
            </p>
            {event.notes || event.comment ? (
              <p className="text-xs text-gray-400 mt-1 italic">{event.notes || event.comment}</p>
            ) : null}
          </div>

          {/* Rate Input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Event Rate (₹) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Total charge for this event"
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              This is the flat rate for the entire event
            </p>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !rate}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Approving...' : `✓ Approve at ₹${rate ? Number(rate).toLocaleString() : '0'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
