import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InstallAppButton from '../components/common/InstallAppButton';

export default function LandingPage() {
  const { tenant, selectedPlant, plants, loading, selectPlant } = useTenant();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  const plant = selectedPlant;
  const hasDomainPlant = !!(tenant?.id && plant?.id);
  const hasDomainTenant = !!(tenant?.id);

  const primaryColor = plant?.primary_color || tenant?.primary_color || '#1E40AF';
  const secondaryColor = plant?.secondary_color || tenant?.secondary_color || '#3B82F6';
  const brandName = plant?.name || tenant?.name || 'Water Supply Management';
  const tagline = plant?.tagline || tenant?.tagline || 'Manage your water supply efficiently';
  const logoUrl = plant?.logo_url || tenant?.logo_url;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ─── Hero Section ─── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          {/* Logo */}
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-6 object-cover border-4 border-white/30 shadow-2xl"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-6 bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-2xl">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 3c-1.5 4-6 7.5-6 11a6 6 0 0012 0c0-3.5-4.5-7-6-11z" />
              </svg>
            </div>
          )}

          {/* Brand Name */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {brandName}
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto leading-relaxed">
            {tagline}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200"
              style={{ color: primaryColor }}
            >
              Sign In
            </button>
            <InstallAppButton className="w-full sm:w-auto !bg-white/20 hover:!bg-white/30 border border-white/30" />
          </div>
        </div>
      </div>

      {/* ─── Plant Details Card (only when domain resolves to a specific plant) ─── */}
      {hasDomainPlant && (
        <div className="max-w-4xl mx-auto w-full px-6 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Plant Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plant Name */}
              <InfoItem
                icon={<BuildingIcon />}
                label="Plant Name"
                value={plant.name}
                color={primaryColor}
              />

              {/* Owner / Tenant */}
              {tenant?.name && tenant.name !== plant.name && (
                <InfoItem
                  icon={<UserIcon />}
                  label="Owner"
                  value={tenant.name}
                  color={primaryColor}
                />
              )}

              {/* Contact Number */}
              {plant.phone && (
                <InfoItem
                  icon={<PhoneIcon />}
                  label="Contact"
                  value={plant.phone}
                  href={`tel:${plant.phone}`}
                  color={primaryColor}
                />
              )}

              {/* Address */}
              {plant.address && (
                <InfoItem
                  icon={<MapPinIcon />}
                  label="Address"
                  value={plant.address}
                  color={primaryColor}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Plant Selection (when no domain match → multi-tenant fallback) ─── */}
      {!hasDomainTenant && plants.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-6 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Select Your Plant</h2>
          <p className="text-gray-500 text-center mb-6">Choose your water supply plant to continue</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plants.map((p) => {
              const pColor = p.primary_color || p.tenantPrimaryColor || '#1E40AF';
              return (
                <button
                  key={p.id}
                  onClick={() => selectPlant(p)}
                  className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: pColor }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 truncate">{p.name}</h3>
                    {p.tenantName && <p className="text-sm text-gray-500 truncate">{p.tenantName}</p>}
                    {p.phone && <p className="text-xs text-gray-400 mt-1">{p.phone}</p>}
                    {p.address && <p className="text-xs text-gray-400 truncate mt-0.5">{p.address}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Features Section ─── */}
      <div className="max-w-4xl mx-auto w-full px-6 py-10">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Use Our Platform</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Daily Distribution', desc: 'Track water deliveries & schedules', icon: TruckIcon },
            { title: 'Payments', desc: 'Bills, receipts & outstanding balance', icon: CurrencyIcon },
            { title: 'Events & Booking', desc: 'Book tankers for events easily', icon: CalendarIcon },
            { title: 'Reports', desc: 'Real-time analytics & insights', icon: ChartIcon },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm text-center">
              <div className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: primaryColor + '15' }}>
                <f.icon color={primaryColor} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-gray-200 bg-white px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <span>&copy; {new Date().getFullYear()} {tenant?.name || 'Water Supply Management'}. All rights reserved.</span>
          <span>Powered by Water Supply SaaS Platform</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── Helper Component ─── */
function InfoItem({ icon, label, value, href, color }) {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
      <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ backgroundColor: color + '15' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  );

  if (href) return <a href={href} className="block hover:ring-2 hover:ring-blue-100 rounded-lg transition-shadow">{content}</a>;
  return content;
}

/* ─── Icons ─── */
function BuildingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon({ color }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  );
}

function CurrencyIcon({ color }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  );
}

function CalendarIcon({ color }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ChartIcon({ color }) {
  return (
    <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}
