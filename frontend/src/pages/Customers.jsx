import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [rateCustomer, setRateCustomer] = useState(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { page, limit: 20, search } });
      // ApiResponse.paginated returns { data: [...rows], pagination: {...} }
      const body = res.data;
      setCustomers(Array.isArray(body.data) ? body.data : body.data?.customers || []);
      setPagination(body.pagination || body.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (formData) => {
    try {
      if (editCustomer) {
        await api.put(`/customers/${editCustomer.id}`, formData);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created');
      }
      setShowForm(false);
      setEditCustomer(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to save customer');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    {
      key: 'custom_rate',
      label: 'Rate',
      render: (val) => val ? (
        <span className="text-green-600 font-medium">₹{val}/unit</span>
      ) : (
        <span className="text-gray-400 text-xs">Default</span>
      ),
    },
    {
      key: 'outstanding_balance',
      label: 'Outstanding',
      render: (val) => (
        <span className={`font-semibold ${Number(val) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ₹{Number(val).toLocaleString()}
        </span>
      ),
    },
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
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setEditCustomer(row); setShowForm(true); }}
            className="text-brand-primary hover:underline text-sm"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setRateCustomer(row); }}
            className="text-green-600 hover:underline text-sm"
          >
            Rate
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => { setEditCustomer(null); setShowForm(true); }}
          className="px-3 py-2 md:px-4 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex-shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none text-sm"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers found"
        pagination={pagination}
        onPageChange={(p) => load(p)}
        mobileCard={(row) => (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                {row.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{row.name}</p>
                <p className="text-xs text-gray-400">{row.phone}</p>
                {row.custom_rate ? (
                  <p className="text-xs text-green-600 font-medium">₹{row.custom_rate}/unit</p>
                ) : (
                  <p className="text-[10px] text-gray-300">Default rate</p>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className={`font-semibold text-sm ${Number(row.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Number(row.outstanding_balance || 0).toLocaleString()}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>{row.status}</span>
            </div>
          </div>
        )}
        onRowClick={(row) => { setEditCustomer(row); setShowForm(true); }}
      />

      {/* Edit Modal */}
      {showForm && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => { setShowForm(false); setEditCustomer(null); }}
          onSave={handleSave}
        />
      )}

      {/* Rate Modal */}
      {rateCustomer && (
        <RateModal
          customer={rateCustomer}
          onClose={() => setRateCustomer(null)}
          onSaved={() => { setRateCustomer(null); load(); }}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    status: customer?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {customer ? 'Edit Customer' : 'New Customer'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
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

function RateModal({ customer, onClose, onSaved }) {
  const [rate, setRate] = useState(customer.custom_rate || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/customers/${customer.id}/rate`, {
        custom_rate: rate ? Number(rate) : null,
      });
      toast.success(rate ? `Rate set to ₹${rate}/unit` : 'Rate reset to default');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to set rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm sm:mx-4 rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Set Rate</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          {/* Customer Info */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
              {customer.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{customer.name}</p>
              <p className="text-xs text-gray-500">{customer.phone}</p>
            </div>
          </div>

          {/* Rate Input */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Custom Rate (₹ per unit)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="Leave empty for plant default"
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-center">
              Leave empty to use plant default rate
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {customer.custom_rate && (
              <button
                type="button"
                onClick={() => { setRate(''); }}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Rate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
