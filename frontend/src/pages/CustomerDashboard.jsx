import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('home'); // home | supplies | payments
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const res = await api.get('/customer-portal/dashboard');
      setDashboard(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const cust = dashboard?.customer;
  const outstanding = parseFloat(cust?.outstanding_balance || 0);
  const rate = dashboard?.rate;
  const totals = dashboard?.totals || {};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            {cust?.name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{cust?.name}</p>
            <p className="text-xs text-gray-400">Customer Portal</p>
          </div>
        </div>
        <button onClick={logout} className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50">
          Logout
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'home' && (
          <HomeView
            cust={cust}
            outstanding={outstanding}
            rate={rate}
            totals={totals}
            distributions={dashboard?.recentDistributions || []}
            payments={dashboard?.recentPayments || []}
            onPay={() => setPayModal(true)}
            onViewAll={(v) => setView(v)}
          />
        )}
        {view === 'supplies' && <SuppliesView onBack={() => setView('home')} />}
        {view === 'payments' && <PaymentsView onBack={() => setView('home')} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40">
        <div className="flex items-center justify-around px-1">
          {[
            { key: 'home', label: 'Home', icon: homeIcon },
            { key: 'supplies', label: 'Supplies', icon: truckIcon },
            { key: 'payments', label: 'Payments', icon: currencyIcon },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 flex-1 ${
                view === tab.key ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{tab.icon}</svg>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Pay Modal */}
      {payModal && (
        <CustomerPayModal
          outstanding={outstanding}
          onClose={() => setPayModal(false)}
          onSuccess={() => { setPayModal(false); loadDashboard(); }}
        />
      )}
    </div>
  );
}

/* ═══ Home View ═══ */
function HomeView({ cust, outstanding, rate, totals, distributions, payments, onPay, onViewAll }) {
  return (
    <div className="space-y-4 p-4">
      {/* Outstanding Card */}
      <div className={`rounded-2xl p-5 text-white ${outstanding > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
        <p className="text-sm opacity-90">Outstanding Balance</p>
        <p className="text-3xl font-bold mt-1">₹{outstanding.toLocaleString()}</p>
        {rate && <p className="text-xs opacity-80 mt-2">Rate: ₹{rate.rate_per_unit}/{rate.unit_type}</p>}
        {outstanding > 0 && (
          <button
            onClick={onPay}
            className="mt-4 w-full py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
          >
            💰 Pay Now
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400">Total Supplied</p>
          <p className="text-xl font-bold text-gray-900">{totals.totalSupplied || 0}</p>
          <p className="text-xs text-gray-400">containers</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400">Total Paid</p>
          <p className="text-xl font-bold text-green-600">₹{(totals.totalPaid || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">Your Details</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Phone</span><span className="text-gray-700">{cust?.phone}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Address</span><span className="text-gray-700">{cust?.address || '-'}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Default Containers</span><span className="text-gray-700">{cust?.default_container_count || '-'}</span></div>
          {cust?.custom_rate && (
            <div className="flex justify-between"><span className="text-gray-400">Custom Rate</span><span className="text-gray-700">₹{cust.custom_rate}</span></div>
          )}
        </div>
      </div>

      {/* Recent Supplies */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <p className="text-sm font-semibold text-gray-900">Recent Supplies</p>
          <button onClick={() => onViewAll('supplies')} className="text-xs text-blue-600 font-medium">View All</button>
        </div>
        {distributions.length === 0 ? (
          <p className="text-xs text-gray-400 px-4 pb-4">No supplies yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {distributions.slice(0, 5).map((d) => (
              <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{d.quantity} containers</p>
                  <p className="text-xs text-gray-400">
                    {new Date(d.distribution_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-700">₹{parseFloat(d.total_amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 pb-2">
          <p className="text-sm font-semibold text-gray-900">Recent Payments</p>
          <button onClick={() => onViewAll('payments')} className="text-xs text-blue-600 font-medium">View All</button>
        </div>
        {payments.length === 0 ? (
          <p className="text-xs text-gray-400 px-4 pb-4">No payments yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.slice(0, 5).map((p) => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-semibold">₹{parseFloat(p.amount).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}<span className="capitalize">{p.payment_method}</span>
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Paid</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Supplies View (All Distributions) ═══ */
function SuppliesView({ onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(p === 1);
    try {
      const res = await api.get('/customer-portal/distributions', { params: { page: p, limit: 30 } });
      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      const pag = res.data.pagination;
      if (p === 1) setData(rows); else setData((prev) => [...prev, ...rows]);
      setHasMore(pag && pag.page < pag.totalPages);
      setPage(p);
    } catch {
      toast.error('Failed to load supplies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200 z-10">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-900">All Supplies</h3>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No supply records found</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.map((d) => (
            <div key={d.id} className="px-4 py-3 flex items-center justify-between bg-white">
              <div>
                <p className="text-sm text-gray-900 font-medium">{d.quantity} containers</p>
                <p className="text-xs text-gray-400">
                  {new Date(d.distribution_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {d.rate_applied ? ` · @₹${d.rate_applied}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">₹{parseFloat(d.total_amount || 0).toLocaleString()}</p>
                <p className={`text-[10px] font-medium ${d.payment_status === 'paid' ? 'text-green-500' : 'text-orange-500'}`}>
                  {d.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                </p>
              </div>
            </div>
          ))}
          {hasMore && (
            <button onClick={() => load(page + 1)} className="w-full py-3 text-blue-600 text-sm font-medium hover:bg-blue-50">
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Payments View (All Payments) ═══ */
function PaymentsView({ onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (p = 1) => {
    setLoading(p === 1);
    try {
      const res = await api.get('/customer-portal/payments', { params: { page: p, limit: 30 } });
      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      const pag = res.data.pagination;
      if (p === 1) setData(rows); else setData((prev) => [...prev, ...rows]);
      setHasMore(pag && pag.page < pag.totalPages);
      setPage(p);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200 z-10">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-bold text-gray-900">All Payments</h3>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No payment records found</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center justify-between bg-white">
              <div>
                <p className="text-sm text-green-600 font-semibold">₹{parseFloat(p.amount).toLocaleString()}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}<span className="capitalize">{p.payment_method}</span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Completed</span>
            </div>
          ))}
          {hasMore && (
            <button onClick={() => load(page + 1)} className="w-full py-3 text-blue-600 text-sm font-medium hover:bg-blue-50">
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Payment Modal ═══ */
function CustomerPayModal({ outstanding, onClose, onSuccess }) {
  const [amount, setAmount] = useState(String(outstanding));
  const [method, setMethod] = useState('upi');
  const [saving, setSaving] = useState(false);

  const methods = [
    { key: 'cash', label: '💵 Cash' },
    { key: 'upi', label: '📱 UPI' },
    { key: 'bank', label: '🏦 Bank' },
    { key: 'online', label: '🌐 Online' },
  ];

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      const res = await api.post('/customer-portal/pay', { amount: Number(amount), payment_method: method });
      toast.success(res.data?.message || 'Payment successful!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Payment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm sm:mx-4 rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Make Payment</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Outstanding info */}
          <div className="bg-red-50 rounded-xl p-3 text-center">
            <p className="text-xs text-red-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-red-600">₹{outstanding.toLocaleString()}</p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Amount (₹)</label>
            <input
              type="number"
              min="1"
              max={outstanding}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setAmount(String(outstanding))} className="flex-1 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                Full (₹{outstanding.toLocaleString()})
              </button>
              <button onClick={() => setAmount(String(Math.round(outstanding / 2)))} className="flex-1 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                Half (₹{Math.round(outstanding / 2).toLocaleString()})
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    method === m.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={saving || !amount}
            className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Processing...' : `Pay ₹${amount ? Number(amount).toLocaleString() : '0'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Icons ═══ */
const homeIcon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const truckIcon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />;
const currencyIcon = <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
