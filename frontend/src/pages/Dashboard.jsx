import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ─── Plant-level stat cards ─── */
const PLANT_STAT_CARDS = [
  { key: 'totalCustomers', label: 'Total Customers', icon: 'users', color: '#3B82F6' },
  { key: 'todayDistributions', label: "Today's Distributions", icon: 'truck', color: '#10B981' },
  { key: 'todayCollections', label: "Today's Collections", icon: 'currency', color: '#8B5CF6' },
  { key: 'totalOutstanding', label: 'Total Outstanding', icon: 'alert', color: '#F59E0B' },
];

/* ─── Platform admin stat cards ─── */
const ADMIN_STAT_CARDS = [
  { key: 'totalTenants', label: 'Total Tenants', color: '#3B82F6' },
  { key: 'totalPlants', label: 'Total Plants', color: '#10B981' },
  { key: 'activeSubscriptions', label: 'Active Subscriptions', color: '#8B5CF6' },
  { key: 'totalUsers', label: 'Total Users', color: '#F59E0B' },
];

/* ═══════════════════════════════════════════════════ */
/*  Platform Admin Dashboard                           */
/* ═══════════════════════════════════════════════════ */
function PlatformAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const loadAdminDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tenants');
      const list = res.data?.data?.tenants || res.data?.data || [];
      setTenants(list);

      // Compute stats from tenants
      let plantCount = 0;
      let activeSubs = 0;
      list.forEach((t) => {
        plantCount += t.plants?.length || 0;
        if (t.subscriptions) {
          activeSubs += t.subscriptions.filter((s) => s.status === 'active').length;
        }
      });

      setStats({
        totalTenants: list.length,
        totalPlants: plantCount,
        activeSubscriptions: activeSubs,
        totalUsers: '—',
      });
    } catch (err) {
      console.error('Admin dashboard failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Platform Overview
        </h2>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.name?.split(' ')[0] || 'Admin'}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {ADMIN_STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              if (card.key === 'totalTenants') navigate('/tenants');
              if (card.key === 'totalPlants') navigate('/plants');
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: card.color + '15' }}
              >
                <div className="w-5 h-5 rounded" style={{ backgroundColor: card.color }} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {loading ? '—' : stats[card.key] ?? '—'}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Tenants</h3>
          <button
            onClick={() => navigate('/tenants')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage All →
          </button>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No tenants yet. Create your first tenant.</p>
            <button
              onClick={() => navigate('/tenants')}
              className="mt-3 text-sm text-blue-600 hover:underline"
            >
              + Create Tenant
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tenants.slice(0, 8).map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: t.primary_color || '#1E40AF' }}
                  >
                    {t.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.slug} • {t.plants?.length || 0} plants</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    t.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.status || 'active'}
                  </span>
                  <button
                    onClick={() => navigate('/tenants')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Plant-Level Dashboard (tenant/plant admin + emp)   */
/* ═══════════════════════════════════════════════════ */
function PlantDashboard({ user }) {
  const [stats, setStats] = useState({});
  const [recentDistributions, setRecentDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [custRes, distRes, collectRes, outRes] = await Promise.allSettled([
        api.get('/customers?limit=1'),
        api.get('/reports/daily-distribution'),
        api.get('/reports/collection'),
        api.get('/reports/outstanding'),
      ]);

      setStats({
        totalCustomers: custRes.status === 'fulfilled' ? custRes.value.data?.pagination?.total || 0 : 0,
        todayDistributions: distRes.status === 'fulfilled' ? distRes.value.data?.data?.summary?.totalContainers || 0 : 0,
        todayCollections: collectRes.status === 'fulfilled'
          ? `₹${collectRes.value.data?.data?.summary?.totalCollected || 0}`
          : '₹0',
        totalOutstanding: outRes.status === 'fulfilled'
          ? `₹${outRes.value.data?.data?.totalOutstanding || 0}`
          : '₹0',
      });

      try {
        const res = await api.get('/distributions?limit=5');
        setRecentDistributions(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch { /* ignore */ }
    } catch (err) {
      console.error('Dashboard load error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h2>
        <p className="text-sm text-gray-500 mt-1">Here's what's happening today</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        {PLANT_STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: card.color + '15' }}
              >
                <div className="w-5 h-5 rounded" style={{ backgroundColor: card.color }} />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900">
              {loading ? '—' : stats[card.key] ?? '—'}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Recent Distributions</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recentDistributions.length === 0 ? (
          <p className="text-gray-400 text-sm">No distributions today</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentDistributions.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {d.customer?.name || d.Customer?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400">{d.customer?.address || d.Customer?.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">
                    {d.quantity} containers
                  </p>
                  <p className="text-xs text-gray-400">₹{d.total_amount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Employee Dashboard — personal stats & activity     */
/* ═══════════════════════════════════════════════════ */
function EmployeeDashboard({ user }) {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState('distributions');
  const [detailLoading, setDetailLoading] = useState(false);
  const [period, setPeriod] = useState('today');

  const getDateRange = (p) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (p === 'today') return { startDate: today, endDate: today };
    if (p === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().split('T')[0], endDate: today };
    }
    if (p === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: d.toISOString().split('T')[0], endDate: today };
    }
    return {};
  };

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const params = getDateRange(period);
        const res = await api.get('/employee-reports/my-summary', { params });
        setSummary(res.data.data);
      } catch { /* ignore */ }
      setLoading(false);
    };
    loadSummary();
  }, [period]);

  useEffect(() => {
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const params = { ...getDateRange(period), type: detailTab };
        const res = await api.get('/employee-reports/my-detail', { params });
        setDetail(res.data.data);
      } catch { /* ignore */ }
      setDetailLoading(false);
    };
    loadDetail();
  }, [period, detailTab]);

  const dist = summary?.distributions || {};
  const coll = summary?.collections || {};
  const cashInHand = summary?.cashInHand || 0;
  const settled = summary?.settlements?.total || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Hi, {user?.name?.split(' ')[0] || 'Employee'}! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Your activity summary</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all', label: 'All Time' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              period === p.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Cash in Hand - Hero Card */}
          <div className={`rounded-2xl p-5 text-white ${
            cashInHand > 0 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">💰 Cash in Hand</p>
                <p className="text-3xl font-bold mt-1">₹{cashInHand.toLocaleString()}</p>
                <p className="text-xs opacity-80 mt-1">Collected ₹{(coll.cashCollected || 0).toLocaleString()} • Settled ₹{settled.toLocaleString()}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                💵
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-base">🚰</div>
                <p className="text-xs text-gray-400">Water Supplied</p>
              </div>
              <p className="text-xl font-bold text-gray-900">{dist.quantity || 0}</p>
              <p className="text-xs text-gray-400">containers • {dist.count || 0} deliveries</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-base">💸</div>
                <p className="text-xs text-gray-400">Total Collected</p>
              </div>
              <p className="text-xl font-bold text-green-600">₹{(coll.amount || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">{coll.count || 0} payments</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-base">📱</div>
                <p className="text-xs text-gray-400">UPI Collected</p>
              </div>
              <p className="text-xl font-bold text-purple-600">₹{(coll.upiCollected || 0).toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-base">🏦</div>
                <p className="text-xs text-gray-400">Bank/Online</p>
              </div>
              <p className="text-xl font-bold text-indigo-600">₹{(coll.bankCollected || 0).toLocaleString()}</p>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/distribution')}
          className="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition-colors"
        >
          <span className="text-2xl">🚛</span>
          <p className="text-sm font-semibold text-blue-700 mt-1">Distribute</p>
        </button>
        <button
          onClick={() => navigate('/payments')}
          className="bg-green-50 rounded-xl p-4 text-center hover:bg-green-100 transition-colors"
        >
          <span className="text-2xl">💰</span>
          <p className="text-sm font-semibold text-green-700 mt-1">Collect Payment</p>
        </button>
      </div>

      {/* Activity Detail Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: 'distributions', label: '🚰 Supplies' },
            { key: 'collections', label: '💰 Collections' },
            { key: 'settlements', label: '🤝 Settlements' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setDetailTab(t.key)}
              className={`flex-1 py-3 text-xs font-medium transition-colors ${
                detailTab === t.key
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {detailTab === 'distributions' && (
                (detail?.distributions || []).length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No distributions</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(detail?.distributions || []).map((d) => (
                      <div key={d.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(d.distribution_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' • '}{d.customer?.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{d.quantity} qty</p>
                          <p className="text-xs text-gray-400">₹{parseFloat(d.total_amount).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === 'collections' && (
                (detail?.payments || []).length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No collections</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(detail?.payments || []).map((p) => (
                      <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.customer?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' • '}<span className="capitalize">{p.payment_method}</span>
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-green-600">₹{parseFloat(p.amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {detailTab === 'settlements' && (
                (detail?.settlements || []).length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-sm">No settlements</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(detail?.settlements || []).map((s) => (
                      <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">₹{parseFloat(s.amount).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(s.settlement_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {s.receiver ? ` • To: ${s.receiver.name}` : ''}
                          </p>
                          {s.notes && <p className="text-xs text-gray-400">{s.notes}</p>}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Settled</span>
                      </div>
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*  Main Dashboard – role switch                       */
/* ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'platform_admin') {
    return <PlatformAdminDashboard user={user} />;
  }
  if (user?.role === 'employee') {
    return <EmployeeDashboard user={user} />;
  }
  return <PlantDashboard user={user} />;
}
