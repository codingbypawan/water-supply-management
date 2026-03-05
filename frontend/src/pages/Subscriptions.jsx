import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const EMPTY_PLAN = {
  name: '',
  description: '',
  max_plants: 1,
  max_customers_per_plant: 1000,
  price_monthly: '',
  price_yearly: '',
  billing_model: 'per_tenant',
  features: '',
};

export default function Subscriptions() {
  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [assignForm, setAssignForm] = useState({ tenant_id: '', plan_id: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [planRes, tenantRes] = await Promise.allSettled([
        api.get('/subscriptions/plans'),
        api.get('/tenants'),
      ]);

      if (planRes.status === 'fulfilled') {
        const d = planRes.value.data?.data;
        setPlans(Array.isArray(d) ? d : []);
      }
      if (tenantRes.status === 'fulfilled') {
        const d = tenantRes.value.data?.data;
        setTenants(Array.isArray(d) ? d : d?.tenants || []);
      }
    } catch {
      toast.error('Failed to load subscriptions data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...planForm,
        price_monthly: parseFloat(planForm.price_monthly),
        price_yearly: planForm.price_yearly ? parseFloat(planForm.price_yearly) : null,
        max_plants: parseInt(planForm.max_plants, 10),
        max_customers_per_plant: parseInt(planForm.max_customers_per_plant, 10),
        features: planForm.features
          ? planForm.features.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      };
      await api.post('/subscriptions/plans', payload);
      toast.success('Plan created');
      setShowPlanModal(false);
      setPlanForm(EMPTY_PLAN);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/subscriptions/subscribe', assignForm);
      toast.success('Subscription assigned');
      setShowAssignModal(false);
      setAssignForm({ tenant_id: '', plan_id: '', start_date: '', end_date: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to assign subscription');
    } finally {
      setSaving(false);
    }
  };

  // Get subscription info for each tenant
  const getTenantSub = (tenant) => {
    const sub = tenant.subscriptions?.[0] || tenant.subscription;
    return sub;
  };

  const planColor = (index) => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
    ];
    return colors[index % colors.length];
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">Manage plans and tenant subscriptions</p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            Assign
          </button>
          <button
            onClick={() => { setPlanForm(EMPTY_PLAN); setShowPlanModal(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            + Plan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Plans Grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plans ({plans.length})</h3>
            {plans.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                <p className="text-gray-400">No plans yet. Create your first plan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan, idx) => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className={`bg-gradient-to-r ${planColor(idx)} p-6 text-white`}>
                      <h4 className="text-xl font-bold">{plan.name}</h4>
                      <p className="text-white/80 text-sm mt-1">{plan.description || 'No description'}</p>
                      <div className="flex items-baseline gap-1 mt-4">
                        <span className="text-3xl font-extrabold">
                          &#8377;{parseFloat(plan.price_monthly).toLocaleString()}
                        </span>
                        <span className="text-white/70 text-sm">/month</span>
                      </div>
                      {plan.price_yearly && (
                        <p className="text-white/70 text-xs mt-1">
                          &#8377;{parseFloat(plan.price_yearly).toLocaleString()}/year
                        </p>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Max Plants</span>
                        <span className="font-medium text-gray-900">{plan.max_plants}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Max Customers/Plant</span>
                        <span className="font-medium text-gray-900">{plan.max_customers_per_plant?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Billing Model</span>
                        <span className="font-medium text-gray-900 capitalize">{plan.billing_model?.replace('_', ' ')}</span>
                      </div>
                      {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Features</p>
                          <div className="flex flex-wrap gap-1.5">
                            {plan.features.map((f, fi) => (
                              <span key={fi} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tenant Subscriptions Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenant Subscriptions</h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {tenants.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No tenants</div>
              ) : (
                <>
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left p-4 font-semibold text-gray-600">Tenant</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Domain</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Current Plan</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Validity</th>
                        <th className="text-left p-4 font-semibold text-gray-600">Plants</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tenants.map((t) => {
                        const sub = getTenantSub(t);
                        const planName = sub?.plan?.name || '—';
                        const subStatus = sub?.status || 'none';
                        return (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                  style={{ backgroundColor: t.primary_color || '#3b82f6' }}
                                >
                                  {t.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900">{t.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-500 text-xs">{t.domain || t.slug || '—'}</td>
                            <td className="p-4 font-medium text-gray-900">{planName}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                subStatus === 'active' ? 'bg-green-50 text-green-700'
                                  : subStatus === 'grace' ? 'bg-yellow-50 text-yellow-700'
                                  : subStatus === 'expired' ? 'bg-red-50 text-red-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {subStatus}
                              </span>
                            </td>
                            <td className="p-4 text-gray-500 text-xs">
                              {sub ? `${sub.start_date} → ${sub.end_date}` : '—'}
                            </td>
                            <td className="p-4 text-gray-600">{t.plants?.length ?? 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Tenant Subscription Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {tenants.map((t) => {
                    const sub = getTenantSub(t);
                    const planName = sub?.plan?.name || '—';
                    const subStatus = sub?.status || 'none';
                    return (
                      <div key={t.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                              style={{ backgroundColor: t.primary_color || '#3b82f6' }}
                            >
                              {t.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{t.name}</p>
                              <p className="text-xs text-gray-400">{planName}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                            subStatus === 'active' ? 'bg-green-50 text-green-700'
                            : subStatus === 'expired' ? 'bg-red-50 text-red-600'
                            : 'bg-gray-100 text-gray-500'
                          }`}>{subStatus}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg sm:mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Subscription Plan</h3>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
                <input
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Plan description"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (&#8377;) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={planForm.price_monthly}
                    onChange={(e) => setPlanForm({ ...planForm, price_monthly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yearly Price (&#8377;)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={planForm.price_yearly}
                    onChange={(e) => setPlanForm({ ...planForm, price_yearly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Plants</label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.max_plants}
                    onChange={(e) => setPlanForm({ ...planForm, max_plants: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Customers/Plant</label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.max_customers_per_plant}
                    onChange={(e) => setPlanForm({ ...planForm, max_customers_per_plant: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Model</label>
                <select
                  value={planForm.billing_model}
                  onChange={(e) => setPlanForm({ ...planForm, billing_model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="per_tenant">Per Tenant</option>
                  <option value="per_plant">Per Plant</option>
                  <option value="per_customer">Per Customer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features (comma-separated)</label>
                <input
                  value={planForm.features}
                  onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., SMS Alerts, Reports, API Access"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Plan to Tenant</h3>
            </div>
            <form onSubmit={handleAssign} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
                <select
                  required
                  value={assignForm.tenant_id}
                  onChange={(e) => setAssignForm({ ...assignForm, tenant_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">Select tenant</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
                <select
                  required
                  value={assignForm.plan_id}
                  onChange={(e) => setAssignForm({ ...assignForm, plan_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — &#8377;{parseFloat(p.price_monthly).toLocaleString()}/mo
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    required
                    type="date"
                    value={assignForm.start_date || today}
                    onChange={(e) => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    required
                    type="date"
                    value={assignForm.end_date}
                    onChange={(e) => setAssignForm({ ...assignForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? 'Assigning...' : 'Assign Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
