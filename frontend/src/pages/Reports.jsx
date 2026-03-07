import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('employees');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const tabs = [
    { key: 'employees', label: 'Employees' },
    { key: 'distribution', label: 'Distribution' },
    { key: 'collection', label: 'Collection' },
    { key: 'outstanding', label: 'Outstanding' },
    { key: 'revenue', label: 'Revenue' },
  ];

  const loadReport = async () => {
    if (activeTab === 'employees') return; // handled by EmployeeReport
    setLoading(true);
    try {
      const endpoints = {
        distribution: '/reports/daily-distribution',
        collection: '/reports/collection',
        outstanding: '/reports/outstanding',
        revenue: '/reports/revenue',
      };
      const res = await api.get(endpoints[activeTab], { params: dateRange });
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (activeTab !== 'employees') loadReport(); }, [activeTab]);

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h2>

      {/* Mobile: Dropdown */}
      <div className="md:hidden">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none appearance-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b7280'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px' }}
        >
          {tabs.map((tab) => (
            <option key={tab.key} value={tab.key}>{tab.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop: Tab bar */}
      <div className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees' ? (
        <EmployeeReport />
      ) : (
        <>
          {/* Date filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" />
            </div>
            <button onClick={loadReport}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
              Go
            </button>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : !data ? (
              <p className="text-gray-400 text-center py-8">Select a report and date range</p>
            ) : (
              <ReportContent type={activeTab} data={data} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  Employee Report Tab                        */
/* ═══════════════════════════════════════════ */
function EmployeeReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('today');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showSettlement, setShowSettlement] = useState(null);
  const [employees, setEmployees] = useState([]);

  const getDateRange = (p) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    if (p === 'today') return { startDate: fmt(today), endDate: fmt(today) };
    if (p === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { startDate: fmt(start), endDate: fmt(today) };
    }
    if (p === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: fmt(start), endDate: fmt(today) };
    }
    return { startDate: fmt(today), endDate: fmt(today) };
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const range = getDateRange(period);
      const res = await api.get('/employee-reports/summary', { params: range });
      setData(res.data.data);
    } catch {
      toast.error('Failed to load employee report');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get('/employee-reports/employees');
      setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadSummary(); loadEmployees(); }, [period]);

  const handleSettlement = async (formData) => {
    try {
      await api.post('/employee-reports/settlement', formData);
      toast.success('Settlement recorded');
      setShowSettlement(null);
      loadSummary();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to record settlement');
    }
  };

  if (selectedEmployee) {
    return (
      <EmployeeDetail
        employeeId={selectedEmployee.id}
        employeeName={selectedEmployee.name}
        period={period}
        getDateRange={getDateRange}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  const totals = data?.totals || {};
  const empList = data?.employees || [];

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {['today', 'week', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <SummaryCard label="Total Distributions" value={totals.totalDistributions || 0} sub={`₹${(totals.totalDistributionAmount || 0).toLocaleString()}`} color="blue" />
            <SummaryCard label="Total Collections" value={totals.totalCollections || 0} sub={`₹${(totals.totalCollectionAmount || 0).toLocaleString()}`} color="green" />
            <SummaryCard label="Cash with Employees" value={`₹${(totals.totalCashWithEmployees || 0).toLocaleString()}`} sub={`Settled: ₹${(totals.totalSettled || 0).toLocaleString()}`} color="orange" />
          </div>

          {/* Employee List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Employee Performance</h3>
            </div>

            {empList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
                No employees found
              </div>
            ) : (
              empList.map((emp) => (
                <div key={emp.employee.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  {/* Employee header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {emp.employee.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.employee.name}</p>
                        <p className="text-xs text-gray-400">{emp.employee.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowSettlement(emp.employee)}
                        className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100"
                      >
                        Settle
                      </button>
                      <button
                        onClick={() => setSelectedEmployee(emp.employee)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <MiniStat label="Distributed" value={`${emp.distributions.count} (${emp.distributions.quantity} units)`} sub={`₹${emp.distributions.amount.toLocaleString()}`} />
                    <MiniStat label="Collected" value={`${emp.collections.count} payments`} sub={`₹${emp.collections.amount.toLocaleString()}`} />
                    <MiniStat label="Settled" value={`₹${emp.settlements.total.toLocaleString()}`} sub="Given to admin" />
                    <MiniStat
                      label="Cash Balance"
                      value={`₹${emp.cashWithEmployee.toLocaleString()}`}
                      sub="With employee"
                      highlight={emp.cashWithEmployee > 0}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Settlement Modal */}
      {showSettlement && (
        <SettlementModal
          employee={showSettlement}
          onClose={() => setShowSettlement(null)}
          onSave={handleSettlement}
        />
      )}
    </div>
  );
}

/* ── Employee Detail View ── */
function EmployeeDetail({ employeeId, employeeName, period, getDateRange, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('distributions');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const range = getDateRange(period);
        const res = await api.get(`/employee-reports/detail/${employeeId}`, { params: range });
        setData(res.data.data);
      } catch {
        toast.error('Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employeeId, period]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="font-bold text-gray-900">{employeeName} — Details</h3>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {['distributions', 'collections', 'settlements'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'distributions' && (
            (data?.distributions || []).length === 0 ? (
              <EmptyState text="No distributions" />
            ) : (
              (data?.distributions || []).map((d) => (
                <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{d.customer?.name || '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(d.distribution_date).toLocaleDateString('en-IN')} &middot; {d.quantity} × ₹{d.rate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">₹{Number(d.total_amount).toLocaleString()}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      d.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>{d.payment_status}</span>
                  </div>
                </div>
              ))
            )
          )}
          {tab === 'collections' && (
            (data?.payments || []).length === 0 ? (
              <EmptyState text="No collections" />
            ) : (
              (data?.payments || []).map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{p.customer?.name || '—'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.payment_date).toLocaleDateString('en-IN')} &middot; <span className="capitalize">{p.payment_method}</span>
                    </p>
                  </div>
                  <p className="font-bold text-green-600 text-sm">₹{Number(p.amount).toLocaleString()}</p>
                </div>
              ))
            )
          )}
          {tab === 'settlements' && (
            (data?.settlements || []).length === 0 ? (
              <EmptyState text="No settlements" />
            ) : (
              (data?.settlements || []).map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">₹{Number(s.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.settlement_date).toLocaleDateString('en-IN')}
                      {s.receiver ? ` · To: ${s.receiver.name}` : ''}
                    </p>
                    {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600">Settled</span>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ── Settlement Modal ── */
function SettlementModal({ employee, onClose, onSave }) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    await onSave({ employee_user_id: employee.id, amount: Number(amount), notes: notes || undefined });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm sm:mx-4 rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Record Settlement</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
              {employee.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{employee.name}</p>
              <p className="text-xs text-gray-500">{employee.phone}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="0"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Cash handover"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !amount}
            className="w-full py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Recording...' : `Record ₹${amount ? Number(amount).toLocaleString() : '0'} Settlement`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*  Standard Report Content                    */
/* ═══════════════════════════════════════════ */
function ReportContent({ type, data }) {
  if (type === 'distribution') {
    const summary = data.summary || {};
    const distributions = data.distributions || [];
    return (
      <div>
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <StatCard label="Total Distributions" value={summary.totalDistributions || summary.total || 0} />
          <StatCard label="Total Containers" value={summary.totalContainers || summary.totalQuantity || 0} />
          <StatCard label="Total Amount" value={`₹${(summary.totalAmount || 0).toLocaleString()}`} />
        </div>
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-gray-500">
              <th className="pb-2">Customer</th><th className="pb-2">Qty</th><th className="pb-2">Amount</th>
            </tr></thead>
            <tbody>
              {distributions.map((d, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2">{d.customer?.name || d.Customer?.name || '—'}</td>
                  <td className="py-2">{d.quantity}</td>
                  <td className="py-2">₹{Number(d.total_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-2">
          {distributions.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{d.customer?.name || d.Customer?.name || '—'}</p>
                <p className="text-xs text-gray-400">{d.quantity} units</p>
              </div>
              <p className="text-sm font-semibold">₹{Number(d.total_amount).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'collection') {
    const summary = data.summary || {};
    return (
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <StatCard label="Total Collected" value={`₹${(summary.totalCollected || 0).toLocaleString()}`} />
        <StatCard label="Total Payments" value={summary.totalTransactions || summary.totalPayments || 0} />
      </div>
    );
  }

  if (type === 'outstanding') {
    const customers = data.customers || [];
    const total = data.totalOutstanding || 0;
    return (
      <div>
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          <StatCard label="Total Outstanding" value={`₹${Number(total).toLocaleString()}`} />
          <StatCard label="Customers with Due" value={data.count || customers.length} />
        </div>
        <div className="space-y-2">
          {customers.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>
              <p className="text-sm font-semibold text-red-600">₹{Number(c.outstanding_balance).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'revenue') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <StatCard label="Total Revenue" value={`₹${(data.totalRevenue || 0).toLocaleString()}`} />
        <StatCard label="Transactions" value={data.transactionCount || 0} />
      </div>
    );
  }

  return <p className="text-gray-400">No data</p>;
}

/* ── Helper Components ── */
function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 md:p-4">
      <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs md:text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
  };
  return (
    <div className={`rounded-xl p-3 md:p-4 border ${colors[color] || 'bg-gray-50 border-gray-100'}`}>
      <p className="text-lg md:text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? 'bg-orange-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
      {text}
    </div>
  );
}
