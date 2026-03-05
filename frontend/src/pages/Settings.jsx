import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPass.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.newPass,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const showRateSection = ['plant_admin', 'tenant_admin', 'platform_admin'].includes(user?.role);

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h2>

      {/* Plant Default Rate */}
      {showRateSection && <PlantRateSection />}

      {/* Profile Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">Name</span>
            <span className="text-gray-900 text-sm font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">Phone</span>
            <span className="text-gray-900 text-sm font-medium">{user?.phone}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">Role</span>
            <span className="text-gray-900 text-sm font-medium capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 text-sm">Email</span>
            <span className="text-gray-900 text-sm font-medium">{user?.email || '—'}</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input type="password" required value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" required value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input type="password" required value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none" />
          </div>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════ */
/*  Plant Default Rate Management Section  */
/* ════════════════════════════════════════ */
function PlantRateSection() {
  const [currentRate, setCurrentRate] = useState(null);
  const [rateHistory, setRateHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const loadRate = async () => {
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        api.get('/rates/current'),
        api.get('/rates'),
      ]);
      setCurrentRate(currentRes.data.data);
      setRateHistory(Array.isArray(historyRes.data.data) ? historyRes.data.data : []);
    } catch {
      // May not have rate set yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRate(); }, []);

  const handleSave = async () => {
    if (!newRate || Number(newRate) <= 0) {
      toast.error('Enter a valid rate');
      return;
    }
    setSaving(true);
    try {
      await api.post('/rates', { rate_per_unit: Number(newRate) });
      toast.success(`Default rate set to ₹${newRate}/container`);
      setShowForm(false);
      setNewRate('');
      loadRate();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 min-w-0 mr-2">Plant Default Rate</h3>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setNewRate(currentRate?.rate_per_unit || ''); }}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0 whitespace-nowrap"
          >
            {currentRate ? 'Update Rate' : 'Set Rate'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <>
          {/* Current Rate Display */}
          {currentRate ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Current active rate</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  ₹{Number(currentRate.rate_per_unit).toLocaleString()}<span className="text-sm font-normal text-green-600">/{currentRate.unit_type || 'container'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Effective from</p>
                <p className="text-sm text-gray-600">
                  {new Date(currentRate.effective_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
              <p className="text-sm text-yellow-700 font-medium">No default rate set</p>
              <p className="text-xs text-yellow-600 mt-1">Set a default rate to start recording distributions</p>
            </div>
          )}

          {/* Update Form */}
          {showForm && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-600">New Rate (₹ per container)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="w-full text-center text-2xl font-bold py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                placeholder="0"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewRate(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Rate'}
                </button>
              </div>
            </div>
          )}

          {/* Rate History */}
          {rateHistory.length > 1 && (
            <div className="mt-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
              >
                <svg className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Rate History ({rateHistory.length})
              </button>
              {showHistory && (
                <div className="mt-2 space-y-2">
                  {rateHistory.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">₹{r.rate_per_unit}/{r.unit_type || 'container'}</span>
                        {r.status === 'active' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">Active</span>
                        )}
                        {r.status === 'inactive' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(r.effective_from).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
