import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Salaries() {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generating, setGenerating] = useState(false);
  const [payModal, setPayModal] = useState(null); // salary object
  const [historyModal, setHistoryModal] = useState(null); // salary object

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/salaries', { params: { month } });
      setSalaries(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error('Failed to load salaries');
    } finally {
      setLoading(false);
    }
  }, [month]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.get('/employee-reports/employees');
      setEmployees(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/salaries/generate', { month });
      const msg = res.data?.message || res.data?.data?.message || 'Salaries generated';
      toast.success(msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (salaryId, amount, payment_method, notes) => {
    try {
      await api.patch(`/salaries/${salaryId}/pay`, { amount, payment_method, notes });
      toast.success('Payment recorded');
      setPayModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to record payment');
    }
  };

  // Stats
  const totalSalary = salaries.reduce((s, r) => s + parseFloat(r.salary_amount || 0), 0);
  const totalPaid = salaries.reduce((s, r) => s + parseFloat(r.paid_amount || 0), 0);
  const totalPending = totalSalary - totalPaid;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Salary Management</h2>
      </div>

      {/* Month Selector + Generate */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
        >
          {generating ? 'Generating...' : '⚡ Generate Salaries'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 md:p-4">
          <p className="text-lg md:text-xl font-bold text-gray-900">₹{totalSalary.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Salary</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 md:p-4">
          <p className="text-lg md:text-xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Paid</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 md:p-4">
          <p className="text-lg md:text-xl font-bold text-orange-600">₹{totalPending.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {/* Salary List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : salaries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">No salary entries for {month}</p>
          <p className="text-xs text-gray-300 mt-1">Click "Generate Salaries" to create entries for all employees</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salaries.map((sal) => {
            const salaryAmt = parseFloat(sal.salary_amount || 0);
            const paidAmt = parseFloat(sal.paid_amount || 0);
            const remaining = salaryAmt - paidAmt;
            const pctPaid = salaryAmt > 0 ? Math.min(100, (paidAmt / salaryAmt) * 100) : 0;

            return (
              <div key={sal.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                      {sal.employee?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sal.employee?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{sal.employee?.phone}</p>
                    </div>
                  </div>
                  <StatusBadge status={sal.status} />
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>₹{paidAmt.toLocaleString()} paid</span>
                    <span>₹{salaryAmt.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        sal.status === 'paid' ? 'bg-green-500' : sal.status === 'partial' ? 'bg-yellow-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${pctPaid}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {sal.status !== 'paid' && (
                    <button
                      onClick={() => setPayModal(sal)}
                      className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                    >
                      💰 Pay {remaining > 0 ? `₹${remaining.toLocaleString()}` : ''}
                    </button>
                  )}
                  <button
                    onClick={() => setHistoryModal(sal)}
                    className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    📋 Payment History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <PaySalaryModal
          salary={payModal}
          onClose={() => setPayModal(null)}
          onPay={handlePay}
        />
      )}

      {/* History Modal */}
      {historyModal && (
        <PaymentHistoryModal
          salary={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function PaySalaryModal({ salary, onClose, onPay }) {
  const remaining = parseFloat(salary.salary_amount) - parseFloat(salary.paid_amount);
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const methods = [
    { key: 'cash', label: '💵 Cash' },
    { key: 'upi', label: '📱 UPI' },
    { key: 'bank', label: '🏦 Bank' },
    { key: 'online', label: '🌐 Online' },
  ];

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    await onPay(salary.id, Number(amount), method, notes || undefined);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-sm sm:mx-4 rounded-t-2xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Pay Salary</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Employee info */}
          <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
              {salary.employee?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{salary.employee?.name}</p>
              <p className="text-xs text-gray-500">
                Salary: ₹{parseFloat(salary.salary_amount).toLocaleString()} · Remaining: ₹{remaining.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Amount (₹)</label>
            <input
              type="number"
              min="1"
              max={remaining}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(String(remaining))}
                className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
              >
                Full (₹{remaining.toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(remaining / 2)))}
                className="flex-1 py-1.5 text-xs font-medium bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Half (₹{Math.round(remaining / 2).toLocaleString()})
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
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                    method === m.key
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !amount}
            className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Processing...' : `Pay ₹${amount ? Number(amount).toLocaleString() : '0'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentHistoryModal({ salary, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/salaries/${salary.id}/payments`);
        setPayments(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        toast.error('Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [salary.id]);

  const salaryAmt = parseFloat(salary.salary_amount || 0);
  const paidAmt = parseFloat(salary.paid_amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white w-full sm:rounded-2xl sm:max-w-md sm:mx-4 rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-400">✕</button>
        </div>

        {/* Summary */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
              {salary.employee?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{salary.employee?.name}</p>
              <p className="text-xs text-gray-500">
                Salary: ₹{salaryAmt.toLocaleString()} · Paid: ₹{paidAmt.toLocaleString()} · Month: {salary.month}
              </p>
            </div>
          </div>
        </div>

        {/* Payment list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No payments recorded yet</div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">₹{Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}
                      <span className="capitalize">{p.payment_method}</span>
                      {p.paidByUser ? ` · By: ${p.paidByUser.name}` : ''}
                    </p>
                    {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">Paid</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
