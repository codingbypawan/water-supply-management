import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';
import DataTable from '../components/common/DataTable';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/payments', { params: { page, limit: 20 } });
      const body = res.data;
      setPayments(Array.isArray(body.data) ? body.data : []);
      setPagination(body.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (formData) => {
    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to record payment');
    }
  };

  const columns = [
    {
      key: 'payment_date',
      label: 'Date',
      render: (val) => new Date(val).toLocaleDateString('en-IN'),
    },
    { key: 'customer', label: 'Customer', render: (val) => val?.name || '—' },
    { key: 'amount', label: 'Amount', render: (val) => `₹${Number(val).toLocaleString()}` },
    {
      key: 'payment_method',
      label: 'Method',
      render: (val) => (
        <span className="capitalize px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {val?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          val === 'completed' ? 'bg-green-100 text-green-700'
            : val === 'pending' ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}>{val}</span>
      ),
    },
  ];

  /* ── Mobile card renderer ── */
  const renderMobileCard = (row) => (
    <div key={row.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-sm">{row.customer?.name || '—'}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          row.status === 'completed' ? 'bg-green-50 text-green-700'
          : row.status === 'pending' ? 'bg-yellow-50 text-yellow-700'
          : 'bg-red-50 text-red-600'
        }`}>{row.status}</span>
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Date(row.payment_date).toLocaleDateString('en-IN')}</span>
        <span className="capitalize">{row.payment_method?.replace('_', ' ')}</span>
      </div>
      <div className="text-right text-sm font-semibold text-gray-900">
        ₹{Number(row.amount).toLocaleString()}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Payments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">Record</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={payments}
          loading={loading}
          emptyMessage="No payments recorded"
          pagination={pagination}
          onPageChange={(p) => load(p)}
        />
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)
        ) : payments.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No payments recorded</div>
        ) : (
          <>
            {payments.map(renderMobileCard)}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Prev</button>
                <span className="px-3 py-2 text-sm text-gray-500">{pagination.page}/{pagination.totalPages}</span>
                <button disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <QuickPaymentForm onClose={() => setShowForm(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  Quick Payment Form — search customer, enter amount, go    */
/* ═══════════════════════════════════════════════════════════ */
const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: '💵' },
  { key: 'upi', label: 'UPI', icon: '📱' },
  { key: 'bank', label: 'Bank', icon: '🏦' },
  { key: 'online', label: 'Online', icon: '🌐' },
];

function QuickPaymentForm({ onClose, onSave }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Focus search on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  const searchCustomers = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get('/customers/search', { params: { q } });
      setResults(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedCustomer(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCustomers(val), 300);
  };

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setQuery(`${c.name} — ${c.phone}`);
    setResults([]);
    // Pre-fill outstanding as amount if available
    if (c.outstanding_balance && Number(c.outstanding_balance) > 0) {
      setAmount(String(Number(c.outstanding_balance)));
    }
    setTimeout(() => document.getElementById('pay-amount')?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return toast.error('Select a customer');
    if (!amount || Number(amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    await onSave({
      customer_id: selectedCustomer.id,
      amount: Number(amount),
      payment_method: method,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md sm:mx-4 rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Record Payment</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Customer Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Customer</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleQueryChange}
                placeholder="Search name or mobile..."
                autoComplete="off"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              {selectedCustomer && (
                <button type="button" onClick={() => { setQuery(''); setSelectedCustomer(null); setResults([]); setAmount(''); inputRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Results */}
            {!selectedCustomer && (results.length > 0 || searching) && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="p-3 text-center text-gray-400 text-sm">Searching...</div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-left transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                        {c.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.phone}</p>
                      </div>
                      {Number(c.outstanding_balance) > 0 && (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          Due ₹{Number(c.outstanding_balance).toLocaleString()}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Customer Card */}
          {selectedCustomer && (
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                {selectedCustomer.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${Number(selectedCustomer.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{Number(selectedCustomer.outstanding_balance || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">Outstanding</p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount (₹)</label>
            <input
              id="pay-amount"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              placeholder="0"
            />
            {selectedCustomer && Number(selectedCustomer.outstanding_balance) > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(Number(selectedCustomer.outstanding_balance)))}
                className="mt-1.5 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                Pay full outstanding ₹{Number(selectedCustomer.outstanding_balance).toLocaleString()}
              </button>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    method === m.key
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{m.icon}</span>
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date (auto today) */}
          <p className="text-xs text-gray-400 text-center">
            Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (today)
          </p>
        </div>

        {/* Submit */}
        <div className="p-4 border-t border-gray-100 safe-area-bottom">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !selectedCustomer || !amount}
            className="w-full py-3.5 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
          >
            {saving ? 'Recording...' : `Record ₹${amount ? Number(amount).toLocaleString() : '0'} Payment`}
          </button>
        </div>
      </div>
    </div>
  );
}
